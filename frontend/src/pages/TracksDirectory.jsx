import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { getTracks } from '../lib/tracksRepository';
import { findLayout, trackPath } from '../lib/tracks';
import { formatName } from '../lib/eventTitle';
import ItalyMap from '../components/ItalyMap';
import EmptyState from '../components/kh/EmptyState';
import TrackLine from '../components/kh/TrackLine';
import useDocumentTitle from '../components/kh/useDocumentTitle';

function TracksDirectory() {
  useDocumentTitle('Le piste — K-Hub');
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    getTracks()
      .then((data) => { setTracks(data); setStatus('ready'); })
      .catch((error) => { console.error('Errore nel caricare le piste:', error); setStatus('error'); });
  }, []);

  // Conteggio piste per regione, per colorare la mappa.
  const regionCounts = useMemo(() => {
    const counts = {};
    for (const t of tracks) if (t.region) counts[t.region] = (counts[t.region] || 0) + 1;
    return counts;
  }, [tracks]);

  const visibleTracks = useMemo(
    () => (selectedRegion ? tracks.filter((t) => t.region === selectedRegion) : tracks),
    [tracks, selectedRegion],
  );

  const toggleRegion = (name) => setSelectedRegion((prev) => (prev === name ? null : name));
  const regionsCount = Object.keys(regionCounts).length;

  return (
    <>
      <section className="kh-wrap kh-cal-head">
        <div>
          <h1 className="kh-display-1">Le piste</h1>
          <p className="kh-lede" style={{ marginTop: 16 }}>
            I kartodromi che raccogliamo. Scegli una regione sulla mappa, poi apri la scheda della pista per vedere
            le prossime gare.
          </p>
        </div>
        <div className="kh-stat kh-cal-count" aria-live="polite">
          <span className="kh-count">{status === 'ready' ? tracks.length : '–'}</span>
          <span>{status === 'ready' ? `piste in ${regionsCount} regioni` : 'piste'}</span>
        </div>
      </section>

      <section className="kh-wrap kh-tracks-body" aria-label="Elenco delle piste">
        {status === 'error' ? (
          <div className="kh-empty">
            <h2 className="kh-title-3">Non riusciamo a caricare le piste</h2>
            <p className="kh-muted">Controlla la connessione e riprova tra poco.</p>
            <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={() => window.location.reload()}>
              Riprova
            </button>
          </div>
        ) : (
          <div className="kh-tracks-layout">
            <aside className="kh-map-col">
              {status === 'loading' ? (
                <div className="kh-poster-placeholder" aria-label="Caricamento della mappa" />
              ) : (
                <>
                  <ItalyMap regionCounts={regionCounts} selectedRegion={selectedRegion} onSelect={toggleRegion} />
                  <p className="kh-small kh-map-legend">
                    <span className="kh-swatch kh-swatch--on" aria-hidden="true" /> Regioni con piste
                    <span className="kh-swatch" aria-hidden="true" /> Nessuna pista (clicca per segnalarne una)
                  </p>
                </>
              )}
            </aside>

            <div className="kh-tracks-col">
              <div className="kh-tracks-head">
                <h2 className="kh-title-2">
                  {selectedRegion || 'Tutte le piste'}
                  {status === 'ready' && <span className="kh-tracks-n">{visibleTracks.length}</span>}
                </h2>
                {selectedRegion && (
                  <button type="button" className="kh-pill" onClick={() => setSelectedRegion(null)}>
                    Tutte le regioni <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              {status === 'loading' ? (
                <div className="kh-event-list" aria-label="Caricamento delle piste">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="kh-skel-row">
                      <span className="kh-skel" style={{ width: 96, height: 56 }} />
                      <span className="kh-skel" style={{ width: '40%', height: 18 }} />
                    </div>
                  ))}
                </div>
              ) : visibleTracks.length === 0 ? (
                <EmptyState
                  title={selectedRegion ? `Nessuna pista censita in ${selectedRegion}` : 'Nessuna pista al momento'}
                  region={selectedRegion}
                  suggestTrack
                  organizers
                >
                  {selectedRegion
                    ? 'Qui non abbiamo ancora nessun kartodromo: non vuol dire che non esista, solo che non l\'abbiamo ancora raccolto.'
                    : 'Stiamo aggiungendo nuovi kartodromi: torna presto.'}
                </EmptyState>
              ) : (
                <ul className="kh-track-list">
                  {visibleTracks.map((track) => {
                    const layout = findLayout(track.name);
                    const place = [track.city, track.region].filter(Boolean).join(', ');
                    return (
                      <li key={track.id} className="kh-track-row">
                        <div className="kh-track-row__thumb" aria-hidden="true">
                          {layout && <TrackLine layout={layout} />}
                        </div>
                        <div className="kh-track-row__main">
                          <h3 className="kh-title-3">
                            <Link to={trackPath(track.name)} className="kh-track-row__link">{formatName(track.name)}</Link>
                          </h3>
                          <span className="kh-small">{place || 'Posizione da definire'}</span>
                        </div>
                        <div className="kh-track-row__side">
                          {layout && <span className="kh-track-card__len"><span className="kh-count">{layout.lengthM}</span>m</span>}
                          {track.website && (
                            <a href={track.website} target="_blank" rel="noreferrer" className="kh-small kh-track-row__site">
                              Sito ufficiale<span className="kh-sr"> di {formatName(track.name)} (si apre in una nuova scheda)</span>
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default TracksDirectory;
