import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Calendar, ChevronRight, ChevronLeft, Trophy, ExternalLink } from 'lucide-react';

function RkcAsi() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState('Lombardia');
  const tabsRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Hardcoded regions for the tabs
  const regions = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 
    'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      // Fetches all events, but we will filter out only the ones containing RKC or ASI
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      
      // Basic mock filter to only grab "RKC" or "ASI" events
      const rkcEvents = (data || []).filter(e => 
        e.title?.toUpperCase().includes('RKC') || 
        e.title?.toUpperCase().includes('ASI') ||
        e.description?.toUpperCase().includes('ASI')
      );
      
      setEvents(rkcEvents);
    } catch (error) {
      console.error('Error fetching RKC events:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter events by the selected region
  const regionalEvents = events.filter(e => 
    e.track_name?.toUpperCase().includes(activeRegion.toUpperCase())
  );

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '40px', background: 'var(--castrol-red)', padding: '40px', color: 'white', clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <Trophy size={48} />
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1', margin: 0 }}>RKC ASI</h1>
        </div>
        <h2 style={{ color: 'white', margin: 0, opacity: 0.9 }}>VERSO LE FINALI NAZIONALI</h2>
        <p style={{ marginTop: '16px', maxWidth: '600px', fontSize: '1.1rem' }}>
          Il percorso per accedere alle finali nazionali ASI. Cerca le tappe della tua regione, accumula punti e preparati alla sfida definitiva.
        </p>
      </div>


      {/* Region Tabs with Arrows */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '10px' }}>
        <button onClick={() => scrollTabs('left')} className="scroll-btn">
          <ChevronLeft size={24} />
        </button>
        
        <div className="filters-bar no-scrollbar" ref={tabsRef} style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: '12px', padding: '5px 0', scrollBehavior: 'smooth' }}>
          {regions.map(region => (
            <button 
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`filter-chip ${activeRegion === region ? 'active' : ''}`}
              style={{ flexShrink: 0 }}
            >
              {region}
            </button>
          ))}
        </div>

        <button onClick={() => scrollTabs('right')} className="scroll-btn">
          <ChevronRight size={24} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
          // CARICAMENTO CALENDARIO RKC ASI...
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '20px', fontSize: '1.8rem', borderBottom: '2px solid var(--text-main)', paddingBottom: '10px' }}>
            Tappe in {activeRegion}
          </h3>
          
          <div className="events-grid">
            {regionalEvents.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                Nessuna tappa RKC ASI confermata al momento per questa regione.
              </div>
            ) : (
              regionalEvents.map(event => (
                <div key={event.id} className="card-snappy">
                  <div className="card-header" style={{ background: 'var(--castrol-red)', color: 'white', borderColor: 'var(--castrol-red)' }}>
                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {event.event_date}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <h3 className="card-title">{event.title}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <MapPin size={16} />
                        <span className="font-mono" style={{ fontSize: '0.9rem' }}>{event.track_name}</span>
                      </div>
                    </div>
                    
                    <a 
                      href={event.source_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-outline-snappy" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}
                    >
                      Dettagli Tappa <ChevronRight size={16} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RkcAsi;
