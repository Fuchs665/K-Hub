import React, { useEffect, useMemo, useState } from 'react';
import { getTracks } from '../lib/tracksRepository';
import ItalyMap from '../components/ItalyMap';
import { MapPin, Globe, ExternalLink, X } from 'lucide-react';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';

function TracksDirectory() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  async function fetchTracks() {
    try {
      setLoading(true);
      const data = await getTracks();
      setTracks(data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  }

  // Conteggio piste per regione, per colorare la mappa.
  const regionCounts = useMemo(() => {
    const counts = {};
    for (const t of tracks) {
      if (t.region) counts[t.region] = (counts[t.region] || 0) + 1;
    }
    return counts;
  }, [tracks]);

  const regionsWithTracks = useMemo(() => Object.keys(regionCounts).length, [regionCounts]);

  const visibleTracks = useMemo(() => {
    if (!selectedRegion) return tracks;
    return tracks.filter(t => t.region === selectedRegion);
  }, [tracks, selectedRegion]);

  const handleSelectRegion = (name) => {
    setSelectedRegion(prev => (prev === name ? null : name));
  };

  return (
    <div className="rkc-page trk-page">
      {/* ---------- HERO: header piste ---------- */}
      <HudFrame className="rkc-hero trk-hero" style={{ '--hud-size': '30px', '--hud-inset': '20px' }}>
        <div className="khub-bg" aria-hidden="true">
          <div className="khub-bg-grid" />
          <div className="khub-bg-speed" />
          <div className="khub-bg-grain" />
        </div>

        <div className="rkc-hero-inner">
          <SectionEyebrow className="rkc-hero-eyebrow">
            Kartodromi in Italia · Season 2026
          </SectionEyebrow>
          <h1 className="rkc-title">Le <em>Piste</em></h1>
          <p className="rkc-subtitle">
            Esplora i kartodromi in Italia. Clicca una regione sulla mappa per filtrare le piste.
          </p>
          <div className="rkc-hero-stats">
            <div className="rkc-stat"><b>{loading ? '—' : tracks.length}</b><span>Piste censite</span></div>
            <div className="rkc-stat"><b>{loading ? '—' : regionsWithTracks}</b><span>Regioni coperte</span></div>
          </div>
        </div>
      </HudFrame>

      <section className="rkc-section container">
        {loading ? (
          <div className="rkc-empty">// CARICAMENTO MAPPA...</div>
        ) : (
          <div className="tracks-layout">
            {/* Colonna mappa */}
            <aside className="tracks-map-col">
              <HudFrame className="trk-map-panel" corners={['tl', 'br']}>
                <ItalyMap
                  regionCounts={regionCounts}
                  selectedRegion={selectedRegion}
                  onSelect={handleSelectRegion}
                />
                <div className="map-legend">
                  <span className="legend-item"><span className="legend-swatch swatch-active" /> Con piste</span>
                  <span className="legend-item"><span className="legend-swatch swatch-empty" /> Nessuna pista</span>
                </div>
              </HudFrame>
            </aside>

            {/* Colonna lista */}
            <section className="tracks-list-col">
              <div className="tracks-list-head">
                <h2 className="rkc-section-title" style={{ fontSize: '1.5rem', margin: 0 }}>
                  {selectedRegion ? selectedRegion : 'Tutte le piste'}
                  <span className="trk-count">{visibleTracks.length}</span>
                </h2>
                {selectedRegion && (
                  <button className="rkc-tab active" onClick={() => setSelectedRegion(null)}>
                    <X size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Tutte le regioni
                  </button>
                )}
              </div>

              {visibleTracks.length === 0 ? (
                <div className="rkc-empty">
                  {selectedRegion
                    ? `// Nessuna pista registrata in ${selectedRegion}`
                    : '// Nessuna pista registrata al momento — torna presto'}
                </div>
              ) : (
                <div className="tracks-grid">
                  {visibleTracks.map(track => (
                    <article key={track.id} className="rkc-card trk-card">
                      <h3 className="khub-event-title">{track.name}</h3>

                      <div className="cal-event-info">
                        <span className="khub-event-track">
                          <MapPin size={14} />
                          {track.city ? `${track.city}${track.region ? ` (${track.region})` : ''}` : (track.region || 'Posizione da definire')}
                        </span>
                        {track.website && (
                          <span className="khub-event-track">
                            <Globe size={14} />
                            <a href={track.website} target="_blank" rel="noreferrer" className="trk-site-link">
                              Sito Web Ufficiale
                            </a>
                          </span>
                        )}
                      </div>

                      <p className="trk-desc">
                        {track.description || 'Contatta la pista per info su turni liberi e gare aziendali/private.'}
                      </p>

                      <div className="cal-event-actions">
                        <a
                          href={track.website || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="cal-btn is-primary"
                        >
                          Prenota Sessione <ExternalLink size={14} />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export default TracksDirectory;
