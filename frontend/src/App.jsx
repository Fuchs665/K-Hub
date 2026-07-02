import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, MapPin, Flag, DollarSign, ChevronRight } from 'lucide-react';
import './index.css';

// Inizializza Supabase (assicurati che il file .env.local contenga le variabili corrette)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filtra eventi
  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    return event.event_type.toUpperCase() === filter.toUpperCase();
  });

  // Estrae categorie univoche per i filtri
  const eventTypes = ['ALL', ...new Set(events.map(e => e.event_type.toUpperCase()))];

  return (
    <>
      <nav className="navbar">
        <div className="container nav-content">
          <a href="/" className="logo-container">
            <span className="logo-k">K</span>
            <span className="logo-hub">Hub</span>
          </a>
          <div>
            <button className="btn-snappy" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              AREA PILOTI
            </button>
          </div>
        </div>
      </nav>

      <main className="container main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>Gare Rental Kart</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
              Trova le migliori sfide in pista. Nessuna scusa, solo cronometro.
            </p>
          </div>
        </div>

        {/* Filtri */}
        <div className="filters-bar">
          {eventTypes.map(type => (
            <button 
              key={type}
              onClick={() => setFilter(type)}
              className={`filter-chip ${filter === type ? 'active' : ''}`}
            >
              {type === 'ALL' ? 'TUTTE LE GARE' : type}
            </button>
          ))}
        </div>

        {/* Griglia Eventi */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
            // CARICAMENTO TELEMETRIA...
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.length === 0 ? (
              <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
                Nessuna gara trovata per questa categoria.
              </div>
            ) : (
              filteredEvents.map(event => (
                <div key={event.id} className="card-snappy">
                  <div className="card-header">
                    <span className={`tag ${event.event_type.toLowerCase() === 'sprint' ? 'tag-sprint' : 'tag-endurance'}`}>
                      {event.event_type}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {event.engine_type}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <h3 className="card-title">{event.title}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <MapPin size={16} />
                        <span className="font-mono" style={{ fontSize: '0.9rem' }}>{event.track_name}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Calendar size={16} />
                        <span className="font-mono" style={{ fontSize: '0.9rem' }}>{event.event_date}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <DollarSign size={16} />
                        <span className="font-mono" style={{ fontSize: '0.9rem' }}>{event.price}</span>
                      </div>
                    </div>
                    
                    <a 
                      href={event.source_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-outline-snappy" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}
                    >
                      Dettagli Iscrizione <ChevronRight size={16} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default App;
