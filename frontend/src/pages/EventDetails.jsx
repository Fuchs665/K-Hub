import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getEventById, getEventLapTimes, getEventsAtTrack } from '../lib/eventsRepository';
import { getEventStandings } from '../lib/pilotsRepository';
import { getTracks, getTrackAliasNames } from '../lib/tracksRepository';
import { formatLongDate, generateCalendarLink, parseEventDate } from '../lib/format';
import { startOfDay } from '../lib/eventBuckets';
import { cleanEventTitle, formatEventType, formatName, posterTitle } from '../lib/eventTitle';
import { findLayout, posterGround, sameTrack, trackPath } from '../lib/tracks';
import Poster from '../components/kh/Poster';
import LapTime from '../components/kh/LapTime';
import EventRow from '../components/kh/EventRow';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const RACE_KINDS = { campionato: 'Campionato', gara_singola: 'Gara singola' };
// Errori di PostgREST per id inesistente (.single() senza righe) o non valido (non un uuid).
const NOT_FOUND_CODES = ['PGRST116', '22P02'];

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

async function loadEvent(id) {
  const event = await getEventById(id);
  const [standings, laps, tracks] = await Promise.all([getEventStandings(id), getEventLapTimes(id), getTracks()]);
  // Pista in anagrafica: track_id dell'evento (risolto dallo scraper), altrimenti
  // stesso nome, oppure il nome della gara inizia con quello della pista
  // ("La Scaglia Circuit 2.0" -> "La Scaglia").
  const eventTrack = String(event.track_name ?? '').toLowerCase();
  const track = (event.track_id && tracks.find((t) => t.id === event.track_id))
    ?? tracks.find((t) => sameTrack(t.name, event.track_name))
    ?? tracks.find((t) => t.name && eventTrack.startsWith(t.name.toLowerCase()));
  const names = [track?.name ?? event.track_name, ...(track ? await getTrackAliasNames(track.id) : [])];
  const upcomingHere = event.track_name ? await getEventsAtTrack(names, { when: 'upcoming', limit: 6, trackId: track?.id }) : [];
  return { event, standings, laps, track, others: upcomingHere.filter((o) => o.id !== event.id).slice(0, 3) };
}

function EventDetails() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading' });
  const [openResult, setOpenResult] = useState(null);

  useEffect(() => {
    let alive = true;
    loadEvent(id)
      .then((data) => { if (alive) setState({ status: 'ready', ...data }); })
      .catch((error) => {
        const notFound = NOT_FOUND_CODES.includes(error?.code);
        if (!notFound) console.error('Errore nel caricare la gara:', error);
        if (alive) setState({ status: notFound ? 'notfound' : 'error' });
      });
    return () => { alive = false; };
  }, [id]);

  const event = state.event;
  const title = event ? cleanEventTitle(event.title, event.track_name) : '';
  useDocumentTitle(title ? `${title}, K-Hub` : 'Gara, K-Hub');

  if (state.status === 'loading') {
    return <div className="kh-wrap" style={{ paddingBlock: 80 }}><p className="kh-muted">Caricamento della gara…</p></div>;
  }
  if (state.status !== 'ready') {
    return (
      <div className="kh-wrap kh-empty" style={{ paddingBlock: 80 }}>
        <h1 className="kh-title-2">{state.status === 'notfound' ? 'Gara non trovata' : 'Non riusciamo a caricare la gara'}</h1>
        <p className="kh-muted">
          {state.status === 'notfound'
            ? 'Il link potrebbe essere vecchio o la gara è stata tolta dal calendario.'
            : 'Ricarica la pagina tra qualche minuto.'}
        </p>
        <Link to="/calendar" className="kh-link-accent">Vai al calendario</Link>
      </div>
    );
  }

  const { standings, laps, track, others } = state;
  const date = parseEventDate(event.event_date);
  const upcoming = !date || date >= startOfDay(new Date());
  const longDate = formatLongDate(event.event_date);
  const trackName = formatName(event.track_name);
  const layout = findLayout(track?.name ?? event.track_name);
  const bestLaps = standings.map((s) => s.best_lap_ms).filter(Boolean);
  const raceBest = bestLaps.length ? Math.min(...bestLaps) : null;
  const kart = event.engine_type && event.engine_type !== 'N/D' ? event.engine_type : null;

  const facts = [
    event.event_type && ['Formato', formatEventType(event.event_type)],
    kart && ['Kart', kart],
    RACE_KINDS[event.format] && ['Tipo', RACE_KINDS[event.format]],
    /\d/.test(event.price || '') && ['Prezzo', event.price],
    event.series === 'rkc_asi' && ['Campionato', 'RKC ASI'],
  ].filter(Boolean);

  return (
    <>
      <nav className="kh-wrap kh-crumbs" aria-label="Percorso">
        <Link to="/calendar">Calendario</Link>
        {event.region && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/calendar?regione=${encodeURIComponent(event.region)}`}>{event.region}</Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <section className="kh-wrap kh-event-hero">
        <div className="kh-event-hero__info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 className="kh-display-1 kh-event-hero__title" title={event.title}>{title}</h1>
            <p className="kh-event-hero__when">{longDate}</p>
            <p className="kh-muted" style={{ fontSize: 17, fontWeight: 500 }}>
              {track ? <Link to={trackPath(track.name)} className="kh-link-accent">{trackName}</Link> : (trackName || 'Pista da confermare')}
              {event.region ? `, ${event.region}` : ''}
            </p>
          </div>

          {!upcoming && <span className="kh-flag kh-flag--conclusa">{standings.length > 0 ? 'Conclusa, risultati' : 'Conclusa'}</span>}

          {facts.length > 0 && (
            <dl className="kh-next__facts">
              {facts.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}
            </dl>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kh-actions">
              {upcoming && event.source_url && (
                <a href={event.source_url} target="_blank" rel="noreferrer" className="kh-btn kh-btn--primary">Iscriviti alla gara</a>
              )}
              {upcoming && !event.source_url && (
                <button type="button" className="kh-btn kh-btn--primary" disabled>Iscrizioni non disponibili</button>
              )}
              {upcoming && (
                <a href={generateCalendarLink(event)} target="_blank" rel="noreferrer" className="kh-btn kh-btn--secondary">Aggiungi al calendario</a>
              )}
              {!upcoming && event.source_url && (
                <a href={event.source_url} target="_blank" rel="noreferrer" className="kh-btn kh-btn--secondary">Pagina dell'organizzatore</a>
              )}
            </div>
            {event.source_url && (
              <p className="kh-small" style={{ fontSize: 14 }}>
                {upcoming ? "Si apre la pagina di iscrizione dell'organizzatore" : "Si apre la pagina della gara sul sito dell'organizzatore"} ({hostname(event.source_url)}).
              </p>
            )}
          </div>
        </div>

        <div className="kh-event-hero__poster">
          <Poster
            ground={posterGround(track?.name ?? event.track_name)}
            lines={[posterTitle(event)]}
            layout={layout}
            trackLabel={trackName || 'Pista da confermare'}
            dateLabel={longDate}
            format={formatEventType(event.event_type)}
            label={`Locandina: ${title}, ${trackName}, ${longDate}`}
            kart
          />
        </div>
      </section>

      <section className="kh-section" aria-labelledby="gara-classifica">
        <div className="kh-wrap">
          <div className="kh-section__head">
            <div>
              <h2 id="gara-classifica" className="kh-title-2">Classifica e tempi</h2>
              {standings.length > 0 && laps.length > 0 && <p className="kh-muted">Apri i giri di un pilota per vedere tutti i suoi tempi.</p>}
            </div>
          </div>

          {standings.length === 0 ? (
            <div className="kh-empty" style={{ paddingTop: 0 }}>
              <p>
                {upcoming
                  ? "La classifica comparirà qui dopo la gara, se l'organizzatore carica risultati e tempi."
                  : 'Nessun risultato caricato per questa gara.'}
              </p>
              <p className="kh-muted" style={{ fontSize: 15 }}>
                Organizzi questa gara? <Link to="/organizer" className="kh-link-accent">Carica classifica e tempi</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="kh-table-wrap">
                <table className="kh-results">
                  <thead>
                    <tr>
                      <th scope="col">Pos.</th>
                      <th scope="col">Pilota</th>
                      <th scope="col" className="kh-col-best">Miglior giro</th>
                      <th scope="col" className="kh-num">Punti</th>
                      <th scope="col"><span className="kh-sr">Tempi sul giro</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => {
                      const key = s.result_id ?? `riga-${i}`;
                      const pilotLaps = laps.filter((l) => l.race_results?.id === s.result_id);
                      const open = openResult === key;
                      const kind = s.best_lap_ms && s.best_lap_ms === raceBest ? 'best' : undefined;
                      return (
                        <React.Fragment key={key}>
                          <tr className={open ? 'is-open' : undefined}>
                            <td className="kh-results__pos">{s.position ?? '–'}</td>
                            <td>
                              <span className="kh-results__name">{s.pilot_name}</span>
                              <span className="kh-results__best-inline"><LapTime ms={s.best_lap_ms} kind={kind} size="sm" /></span>
                            </td>
                            <td className="kh-col-best"><LapTime ms={s.best_lap_ms} kind={kind} size="sm" /></td>
                            <td className="kh-num"><span className="kh-results__pts">{s.points ?? '–'}</span></td>
                            <td className="kh-results__toggle">
                              {pilotLaps.length > 0 ? (
                                <button
                                  type="button"
                                  className="kh-btn kh-btn--secondary kh-btn--sm"
                                  aria-expanded={open}
                                  aria-controls={`giri-${key}`}
                                  aria-label={`Tempi sul giro di ${s.pilot_name} (${pilotLaps.length})`}
                                  onClick={() => setOpenResult(open ? null : key)}
                                >
                                  <span className="kh-hide-sm">Giri </span>({pilotLaps.length})
                                  <ChevronDown size={16} aria-hidden="true" className="kh-chevron" />
                                </button>
                              ) : (
                                <span className="kh-small">Nessun giro</span>
                              )}
                            </td>
                          </tr>
                          {open && (
                            <tr id={`giri-${key}`} className="kh-results__laps-row">
                              <td colSpan={5}>
                                <ol className="kh-laps" aria-label={`Tempi sul giro di ${s.pilot_name}`}>
                                  {pilotLaps.map((l) => (
                                    <li key={l.id} className="kh-laps__item">
                                      <span className="kh-laps__n">Giro {l.lap_number}</span>
                                      <LapTime
                                        ms={l.time_ms}
                                        kind={l.time_ms === raceBest ? 'best' : l.time_ms === s.best_lap_ms ? 'pb' : undefined}
                                        size="sm"
                                      />
                                    </li>
                                  ))}
                                </ol>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="kh-lap-legend">
                <span className="is-best">Giro più veloce della gara</span>
                <span className="is-pb">Miglior giro del pilota</span>
              </div>
            </>
          )}
        </div>
      </section>

      {others.length > 0 && (
        <section className="kh-section" aria-labelledby="gara-altre">
          <div className="kh-wrap">
            <div className="kh-section__head">
              <h2 id="gara-altre" className="kh-title-2">Altre gare in programma qui</h2>
              {track && <Link to={trackPath(track.name)} className="kh-link-accent">Scheda della pista</Link>}
            </div>
            <div className="kh-event-list">
              {others.map((ev) => <EventRow key={ev.id} event={ev} register />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default EventDetails;
