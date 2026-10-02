import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUpcomingEvents } from '../lib/eventsRepository';
import { getTracks } from '../lib/tracksRepository';
import { groupEventsByBucket, startOfDay } from '../lib/eventBuckets';
import { parseEventDate, formatLongDate } from '../lib/format';
import { cleanEventTitle, formatEventType, formatName, posterTitle } from '../lib/eventTitle';
import { findLayout, posterGround, sameTrack, trackPath } from '../lib/tracks';
import { TRACK_LAYOUTS } from '../data/trackLayouts';
import Poster from '../components/kh/Poster';
import TrackLine from '../components/kh/TrackLine';
import { EventGroups } from '../components/kh/EventRow';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const FORMATS = [
  { value: 'ALL', label: 'Tutte' },
  { value: 'Sprint', label: 'Sprint' },
  { value: 'Endurance', label: 'Endurance' },
  { value: 'Ironman', label: 'Ironman' },
];
const LIST_SIZE = 6;
const SOON_DAYS = 15;

const matchesFormat = (event, format) =>
  format === 'ALL' || (event.event_type || '').toLowerCase().includes(format.toLowerCase());

function gareLabel(n) {
  if (n === 0) return 'Nessuna gara in programma';
  return n === 1 ? '1 gara in programma' : `${n} gare in programma`;
}

function Home() {
  useDocumentTitle('K-Hub, il calendario del rental karting in Italia');
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [listFormat, setListFormat] = useState('ALL');
  const [searchRegion, setSearchRegion] = useState('ALL');
  const [searchFormat, setSearchFormat] = useState('ALL');

  useEffect(() => {
    let alive = true;
    Promise.all([getUpcomingEvents(40), getTracks()])
      .then(([ev, tr]) => {
        if (!alive) return;
        setEvents(ev);
        setTracks(tr);
        setStatus('ready');
      })
      .catch((error) => {
        console.error('Errore nel caricare la home:', error);
        if (alive) setStatus('error');
      });
    return () => { alive = false; };
  }, []);

  const today = startOfDay(new Date());
  const ready = status === 'ready';
  const soonCount = events.filter((e) => {
    const d = parseEventDate(e.event_date);
    return d && (d - today) / 86400000 <= SOON_DAYS;
  }).length;
  const regions = useMemo(
    () => [...new Set(tracks.map((t) => t.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it')),
    [tracks],
  );
  const listed = events.filter((e) => matchesFormat(e, listFormat)).slice(0, LIST_SIZE);
  const groups = groupEventsByBucket(listed, today);
  const next = events[0];

  // Una card per ogni pista di cui abbiamo il tracciato.
  const featured = useMemo(
    () => TRACK_LAYOUTS.map((layout) => {
      const track = tracks.find((t) => sameTrack(t.name, layout.name));
      if (!track) return null;
      const upcoming = events.filter((e) => e.track_id === track.id || sameTrack(e.track_name, layout.name)).length;
      return { layout, track, upcoming };
    }).filter(Boolean),
    [tracks, events],
  );
  const bandExample = featured.find((f) => f.layout.poster !== posterGround(next?.track_name)) ?? featured[0];

  function search(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchRegion !== 'ALL') params.set('regione', searchRegion);
    if (searchFormat !== 'ALL') params.set('formato', searchFormat);
    const qs = params.toString();
    navigate(qs ? `/calendar?${qs}` : '/calendar');
  }

  const nextTitle = next ? cleanEventTitle(next.title, next.track_name) : '';
  const nextTrack = next ? formatName(next.track_name) : '';
  const nextDate = next ? formatLongDate(next.event_date) : '';

  return (
    <>
      <section className="kh-wrap kh-hero">
        <div className="kh-hero__copy">
          <h1 className="kh-display-1">Trova la tua prossima gara in kart.</h1>
          <p className="kh-lede">
            Raccogliamo le gare rental dei kartodromi italiani: sprint, endurance e ironman. Scegli quella che fa
            per te e iscriviti direttamente sul sito della pista.
          </p>
          <form className="kh-search" onSubmit={search}>
            <div className="kh-field">
              <label htmlFor="home-regione">Regione</label>
              <select id="home-regione" className="kh-select" value={searchRegion} onChange={(e) => setSearchRegion(e.target.value)}>
                <option value="ALL">Tutta Italia</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="kh-field">
              <label htmlFor="home-formato">Formato</label>
              <select id="home-formato" className="kh-select" value={searchFormat} onChange={(e) => setSearchFormat(e.target.value)}>
                <option value="ALL">Tutti i formati</option>
                {FORMATS.slice(1).map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <button type="submit" className="kh-btn kh-btn--primary" style={{ minHeight: 52 }}>Cerca gare</button>
          </form>
          <div className="kh-stats">
            <div className="kh-stat">
              <span className="kh-count">{ready ? soonCount : '–'}</span>
              <span>{soonCount === 1 ? 'gara' : 'gare'} nei prossimi {SOON_DAYS} giorni</span>
            </div>
            <div className="kh-stat">
              <span className="kh-count">{ready ? regions.length : '–'}</span>
              <span>regioni con piste censite</span>
            </div>
          </div>
        </div>

        <div className="kh-hero__poster">
          {status === 'loading' && <div className="kh-poster-placeholder" aria-label="Caricamento della prossima gara" />}
          {next && (
            <>
              <Poster
                ground={posterGround(next.track_name)}
                lines={[posterTitle(next)]}
                layout={findLayout(next.track_name)}
                trackLabel={nextTrack || 'Pista da confermare'}
                dateLabel={nextDate}
                format={formatEventType(next.event_type)}
                label={`Locandina: ${nextTitle}, ${nextTrack}, ${nextDate}`}
                kart
              />
              <div className="kh-hero__caption">
                <p>La prossima gara: <strong>{nextTitle}</strong>, {nextDate.toLowerCase()}.</p>
                <Link to={`/event/${next.id}`} className="kh-btn kh-btn--secondary">Vedi la gara</Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="kh-section" aria-labelledby="home-gare">
        <div className="kh-wrap">
          <div className="kh-section__head">
            <h2 id="home-gare" className="kh-title-2">Prossime gare</h2>
            <Link to="/calendar" className="kh-link-accent">Apri il calendario completo</Link>
          </div>
          <div className="kh-chips" role="group" aria-label="Filtra per formato" style={{ marginBottom: 28 }}>
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                className="kh-chip"
                aria-pressed={listFormat === f.value}
                onClick={() => setListFormat(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {status === 'error' && (
            <div className="kh-empty">
              <p>Non riusciamo a caricare le gare in questo momento. Ricarica la pagina tra qualche minuto.</p>
            </div>
          )}
          {ready && groups.length === 0 && (
            <div className="kh-empty">
              <p>Nessuna gara {listFormat === 'ALL' ? '' : `${listFormat.toLowerCase()} `}in programma per ora.</p>
              <Link to="/calendar" className="kh-link-accent">Guarda il calendario completo</Link>
            </div>
          )}
          <EventGroups groups={groups} register />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="kh-section" aria-labelledby="home-piste">
          <div className="kh-wrap">
            <div className="kh-section__head">
              <div>
                <h2 id="home-piste" className="kh-title-2">Le piste</h2>
                <p className="kh-muted">Il disegno di ogni pista viene da OpenStreetMap e lo confermiamo con il kartodromo.</p>
              </div>
              <Link to="/tracks" className="kh-link-accent">Vedi tutte le piste</Link>
            </div>
            <div className="kh-track-cards">
              {featured.map(({ layout, track, upcoming }) => (
                <Link key={layout.id} to={trackPath(track.name)} className="kh-track-card">
                  <TrackLine layout={layout} />
                  <div className="kh-track-card__row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span className="kh-title-3">{formatName(track.name)}</span>
                      <span className="kh-small" style={{ fontSize: 14 }}>{[track.city, track.region].filter(Boolean).join(', ')}</span>
                    </div>
                    <span className="kh-track-card__len"><span className="kh-count">{layout.lengthM}</span>m</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: upcoming ? 700 : 500, color: upcoming ? undefined : 'var(--ink-muted)' }}>
                    {gareLabel(upcoming)}
                  </span>
                </Link>
              ))}
            </div>
            <p className="kh-small" style={{ marginTop: 24 }}>Tracciati © OpenStreetMap contributors.</p>
          </div>
        </section>
      )}

      <section className="kh-band" aria-labelledby="home-org">
        <div className="kh-wrap kh-band__grid">
          <div className="kh-band__copy">
            <h2 id="home-org" className="kh-title-2">Organizzi gare rental?</h2>
            <p style={{ fontSize: 18 }}>
              Pubblica le tue gare su K-Hub e raggiungi i piloti che cercano dove correre. Ogni gara riceve la sua
              locandina, pronta per i tuoi social.
            </p>
            <ul className="kh-band__list">
              <li>Pubblicazione gratuita</li>
              <li>Una locandina per ogni gara</li>
              <li>Link diretto alla tua pagina di iscrizione</li>
            </ul>
            <Link to="/organizer" className="kh-btn kh-btn--secondary">Pubblica una gara</Link>
          </div>
          {bandExample && (
            <div className="kh-band__poster">
              <Poster
                ground={bandExample.layout.poster}
                lines={bandExample.layout.posterLines}
                layout={bandExample.layout}
                trackLabel={`${bandExample.layout.lengthM} m`}
                dateLabel={bandExample.track.city || bandExample.track.region}
                format="Pista"
                label={`Esempio di locandina: ${formatName(bandExample.track.name)}`}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
