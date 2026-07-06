import React, { useEffect, useMemo, useState } from 'react';
import { getTracks } from '../lib/tracksRepository';
import ItalyMap from '../components/ItalyMap';
import { MapPin, Globe, ExternalLink, X } from 'lucide-react';

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

  const visibleTracks = useMemo(() => {
    if (!selectedRegion) return tracks;
    return tracks.filter(t => t.region === selectedRegion);
  }, [tracks, selectedRegion]);

  const handleSelectRegion = (name) => {
    setSelectedRegion(prev => (prev === name ? null : name));
  };

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>Le Piste</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Esplora i kartodromi in Italia. Clicca una regione sulla mappa per filtrare le piste.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
          // CARICAMENTO MAPPE...
        </div>
      ) : (
        <div className="tracks-layout">
          {/* Colonna mappa */}
          <aside className="tracks-map-col">
            <div className="card-snappy" style={{ padding: '16px' }}>
              <ItalyMap
                regionCounts={regionCounts}
                selectedRegion={selectedRegion}
                onSelect={handleSelectRegion}
              />
              <div className="map-legend">
                <span className="legend-item"><span className="legend-swatch swatch-active" /> Con piste</span>
                <span className="legend-item"><span className="legend-swatch swatch-empty" /> Nessuna pista</span>
              </div>
            </div>
          </aside>

          {/* Colonna lista */}
          <section className="tracks-list-col">
            <div className="tracks-list-head">
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                {selectedRegion ? selectedRegion : 'Tutte le piste'}
                <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginLeft: '10px', fontSize: '1rem' }} className="font-mono">
                  {visibleTracks.length}
                </span>
              </h2>
              {selectedRegion && (
                <button className="btn-outline-snappy reset-region-btn" onClick={() => setSelectedRegion(null)}>
                  <X size={16} /> Tutte le regioni
                </button>
              )}
            </div>

            {visibleTracks.length === 0 ? (
              <div className="empty-state">
                <MapPin size={32} />
                <p>
                  {selectedRegion
                    ? `Nessuna pista registrata in ${selectedRegion}.`
                    : 'Nessuna pista registrata al momento. Torna presto!'}
                </p>
              </div>
            ) : (
              <div className="tracks-grid">
                {visibleTracks.map(track => (
                  <div key={track.id} className="card-snappy" style={{ borderBottomColor: 'var(--text-main)' }}>
                    <div className="card-header" style={{ background: 'var(--text-main)', color: 'white' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{track.name}</h3>
                    </div>

                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-main)' }}>
                          <MapPin size={18} style={{ marginTop: '2px', color: 'var(--castrol-red)' }} />
                          <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                            {track.city ? `${track.city}${track.region ? ` (${track.region})` : ''}` : (track.region || 'Posizione da definire')}
                          </span>
                        </div>

                        {track.website && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                            <Globe size={18} />
                            <a href={track.website} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                              Sito Web Ufficiale
                            </a>
                          </div>
                        )}

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {track.description || "Contatta la pista per info su turni liberi e gare aziendali/private."}
                        </p>
                      </div>

                      <a
                        href={track.website || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-snappy"
                        style={{ width: '100%', padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
                      >
                        PRENOTA SESSIONE <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default TracksDirectory;
