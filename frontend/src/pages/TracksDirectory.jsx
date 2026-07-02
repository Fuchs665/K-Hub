import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Globe, ExternalLink } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function TracksDirectory() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracks();
  }, []);

  async function fetchTracks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>Le Piste</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Esplora i migliori kartodromi in Italia. Prenota allenamenti o organizza gare private direttamente con loro.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
          // CARICAMENTO MAPPE...
        </div>
      ) : (
        <div className="events-grid">
          {tracks.length === 0 ? (
            <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
              Nessuna pista registrata al momento. Torna presto!
            </div>
          ) : (
            tracks.map(track => (
              <div key={track.id} className="card-snappy" style={{ borderBottomColor: 'var(--text-main)' }}>
                <div className="card-header" style={{ background: 'var(--text-main)', color: 'white' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{track.name}</h3>
                </div>
                
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-main)' }}>
                      <MapPin size={18} style={{ marginTop: '2px' }} />
                      <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                        {track.location || 'Posizione da definire'}
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

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      {track.description || "Contatta la pista per info su turni liberi e gare aziendali/private."}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
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
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default TracksDirectory;
