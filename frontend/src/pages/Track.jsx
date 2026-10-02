import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTrackBySlug } from '../lib/tracksRepository';
import { getEventsAtTrack } from '../lib/eventsRepository';
import { findLayout, posterGround } from '../lib/tracks';
import { formatLongDate, formatEventDate, generateCalendarLink } from '../lib/format';
import { cleanEventTitle, formatEventType, formatName, posterTitle } from '../lib/eventTitle';
import Poster from '../components/kh/Poster';
import TrackLine from '../components/kh/TrackLine';
import EventRow from '../components/kh/EventRow';
import useDocumentTitle from '../components/kh/useDocumentTitle';

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function Track() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', track: null, upcoming: [], past: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const track = await getTrackBySlug(slug);
        if (!alive) return;
        if (!track) { setState({ status: 'notfound', track: null, upcoming: [], past: [] }); return; }
        const names = findLayout(track.name)?.names ?? [track.name];
        const [upcoming, past] = await Promise.all([
          getEventsAtTrack(names, { when: 'upcoming', trackId: track.id }),
          getEventsAtTrack(names, { when: 'past', limit: 5, trackId: track.id }),
        ]);
        if (alive) setState({ status: 'ready', track, upcoming, past });
      } catch (error) {
        console.error('Errore nel caricare la pista:', error);
        if (alive) setState({ status: 'error', track: null, upcoming: [], past: [] });
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  const { status, track, upcoming, past } = state;
  const name = track ? formatName(track.name) : '';
  useDocumentTitle(name ? `${name}, K-Hub` : 'Piste, K-Hub');

  if (status === 'loading') {
    return <div className="kh-wrap" style={{ paddingBlock: 80 }}><p className="kh-muted">Caricamento della pista…</p></div>;
  }
  if (status !== 'ready') {
    return (
      <div className="kh-wrap kh-empty" style={{ paddingBlock: 80 }}>
        <h1 className="kh-title-2">{status === 'notfound' ? 'Pista non trovata' : 'Non riusciamo a caricare la pista'}</h1>
        <p className="kh-muted">
          {status === 'notfound'
            ? 'Il link potrebbe essere vecchio o la pista non è ancora censita.'
            : 'Ricarica la pagina tra qualche minuto.'}
        </p>
        <Link to="/tracks" className="kh-link-accent">Vai all'elenco delle piste</Link>
      </div>
    );
  }

  const layout = findLayout(track.name);
  const place = [track.city, track.region].filter(Boolean).join(', ');
  const website = track.website_url || track.website;
  const next = upcoming[0];
  const later = upcoming.slice(1, 6);
  const nextTitle = next ? cleanEventTitle(next.title, next.track_name) : '';
  const nextDate = next ? formatLongDate(next.event_date) : '';

  return (
    <>
      <nav className="kh-wrap kh-crumbs" aria-label="Percorso">
        <Link to="/tracks">Piste</Link>
        {track.region && <><span aria-hidden="true">/</span><span>{track.region}</span></>}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{name}</span>
      </nav>

      <section className="kh-wrap kh-track-hero">
        <figure className="kh-track-hero__figure">
          {layout ? (
            <>
              <TrackLine layout={layout} kart label={`Tracciato di ${name}`} />
              <figcaption className="kh-small">
                Tracciato © OpenStreetMap contributors.{layout.confirmed ? '' : ' Da confermare con la pista.'}
              </figcaption>
            </>
          ) : (
            <p className="kh-track-hero__none">
              Il tracciato di questa pista non è ancora disponibile.<br />
              Se la gestisci, puoi mandarcelo dall'area organizzatori.
            </p>
          )}
        </figure>

        <div className="kh-track-hero__info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h1 className="kh-display-1">{name}</h1>
            <p className="kh-muted" style={{ fontSize: 17, fontWeight: 500 }}>{place || 'Posizione da confermare'}</p>
          </div>
          <dl className="kh-facts">
            <div>
              <dt>Lunghezza</dt>
              <dd>{layout ? <><span className="kh-count">{layout.lengthM}</span> m</> : <span className="kh-muted">Non disponibile</span>}</dd>
            </div>
            <div>
              <dt>Gare in programma</dt>
              <dd><span className="kh-count">{upcoming.length}</span></dd>
            </div>
            <div>
              <dt>Città</dt>
              <dd>{track.city || <span className="kh-muted">Non disponibile</span>}</dd>
            </div>
            <div>
              <dt>Sito della pista</dt>
              <dd>
                {website
                  ? <a href={website} target="_blank" rel="noreferrer" className="kh-link-accent">{hostname(website)}</a>
                  : <span className="kh-muted">Non disponibile</span>}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="kh-section" aria-labelledby="pista-prossima">
        <div className="kh-wrap">
          <h2 id="pista-prossima" className="kh-title-2" style={{ marginBottom: 32 }}>Prossima gara qui</h2>
          {next ? (
            <div className="kh-next">
              <Poster
                ground={posterGround(track.name)}
                lines={[posterTitle(next)]}
                layout={layout}
                trackLabel={name}
                dateLabel={nextDate}
                format={formatEventType(next.event_type)}
                label={`Locandina: ${nextTitle}, ${name}, ${nextDate}`}
              />
              <div className="kh-next__info">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontSize: 'clamp(26px, 3vw, 32px)', lineHeight: 1.1, fontWeight: 800 }} title={next.title}>{nextTitle}</h3>
                  <p style={{ fontSize: 19, fontWeight: 500 }}>{nextDate}</p>
                </div>
                <dl className="kh-next__facts">
                  {next.event_type && <div><dt>Formato</dt><dd>{formatEventType(next.event_type)}</dd></div>}
                  {next.engine_type && <div><dt>Kart</dt><dd>{next.engine_type}</dd></div>}
                  {/\d/.test(next.price || '') && <div><dt>Prezzo</dt><dd>{next.price}</dd></div>}
                </dl>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="kh-actions">
                    {next.source_url ? (
                      <a href={next.source_url} target="_blank" rel="noreferrer" className="kh-btn kh-btn--primary">Iscriviti alla gara</a>
                    ) : (
                      <button type="button" className="kh-btn kh-btn--primary" disabled>Iscrizioni non disponibili</button>
                    )}
                    <a href={generateCalendarLink(next)} target="_blank" rel="noreferrer" className="kh-btn kh-btn--secondary">Aggiungi al calendario</a>
                  </div>
                  <p className="kh-small" style={{ fontSize: 14 }}>
                    {next.source_url ? "Si apre la pagina di iscrizione dell'organizzatore. " : ''}
                    <Link to={`/event/${next.id}`}>Dettagli della gara</Link>
                  </p>
                </div>
                {later.length > 0 && (
                  <div className="kh-later">
                    <h4 style={{ fontSize: 17, fontWeight: 700 }}>Più avanti qui</h4>
                    {later.map((ev) => (
                      <Link key={ev.id} to={`/event/${ev.id}`} className="kh-later__row" title={ev.title}>
                        <span style={{ fontWeight: 700 }}>{cleanEventTitle(ev.title, ev.track_name)}</span>
                        <span className="kh-muted" style={{ flex: 'none' }}>{formatEventDate(ev.event_date)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="kh-empty" style={{ paddingTop: 0 }}>
              <p>Nessuna gara in programma su questa pista per ora.</p>
              <Link to="/calendar" className="kh-link-accent">Guarda le gare sulle altre piste</Link>
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="kh-section" aria-labelledby="pista-passate">
          <div className="kh-wrap">
            <div className="kh-section__head">
              <div>
                <h2 id="pista-passate" className="kh-title-2">Gare passate qui</h2>
                <p className="kh-muted">Classifiche e tempi sono nella pagina di ogni gara, quando l'organizzatore li carica.</p>
              </div>
            </div>
            <div className="kh-event-list">
              {past.map((ev) => <EventRow key={ev.id} event={ev} />)}
            </div>
          </div>
        </section>
      )}

      <section className="kh-wrap" style={{ paddingBlock: '8px 80px' }}>
        <div className="kh-claim">
          <div>
            <h2 style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 800 }}>Gestisci {name}?</h2>
            <p style={{ fontSize: 17 }}>
              Conferma il tracciato, aggiungi il sito e pubblica le tue gare: ognuna riceve la sua locandina.
            </p>
          </div>
          <Link to="/organizer" className="kh-btn kh-btn--secondary" style={{ flex: 'none' }}>Vai all'area organizzatori</Link>
        </div>
      </section>
    </>
  );
}

export default Track;
