import React, { useEffect, useState } from 'react';
import { getUpcomingEvents } from '../lib/eventsRepository';
import { Calendar, MapPin, Flag, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const data = await getUpcomingEvents(3);
      setUpcomingEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const generateCalendarLink = (event) => {
    let dates = "";
    if (event.event_date) {
      const parts = event.event_date.split('-');
      if (parts.length === 3) {
        const year = parts[2].length === 4 ? parts[2] : (parts[0].length === 4 ? parts[0] : "2026");
        const month = parts[1].padStart(2, '0');
        const day = (parts[0].length === 4 ? parts[2] : parts[0]).padStart(2, '0');
        dates = `&dates=${year}${month}${day}/${year}${month}${day}`;
      }
    }
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}${dates}&details=${encodeURIComponent("Iscrizione: " + event.source_url)}&location=${encodeURIComponent(event.track_name)}`;
  };

  return (
    <div className="container main-content">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '60px', marginTop: '40px' }}>
        <h1 style={{ fontSize: '4rem', lineHeight: '1', marginBottom: '16px' }}>K-HUB ITALIA</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.5rem', maxWidth: '600px', marginBottom: '30px' }}>
          Il portale definitivo per i piloti di Rental Kart. Trova gare, campionati e piste in tutta Italia.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/calendar" className="btn-snappy">
            TROVA UNA GARA
          </Link>
          <Link to="/tracks" className="btn-outline-snappy" style={{ padding: '12px 24px', fontSize: '1rem' }}>
            ESPLORA LE PISTE
          </Link>
        </div>
      </div>

      {/* Banner RKC ASI */}
      <div style={{ background: 'var(--text-main)', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px', borderRadius: '4px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Scopri il percorso per qualificarsi alle finali nazionali RKC ASI</div>
        <Link to="/rkc-asi" className="btn-snappy" style={{ padding: '10px 20px', fontSize: '0.9rem', background: 'var(--castrol-red)', borderColor: 'var(--castrol-red)', color: 'white' }}>
          VAI ALLA SEZIONE
        </Link>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Prossimi Eventi</h2>
        <Link to="/calendar" style={{ color: 'var(--castrol-red)', fontWeight: 'bold', textDecoration: 'none' }}>Vedi tutti →</Link>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
          // CARICAMENTO TELEMETRIA...
        </div>
      ) : (
        <div className="events-grid">
          {upcomingEvents.map(event => (
            <div key={event.id} className="card-snappy">
              <div className="card-header">
                <span className={`tag ${event.event_type?.toLowerCase() === 'sprint' ? 'tag-sprint' : 'tag-endurance'}`}>
                  {event.event_type}
                </span>
                <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {event.engine_type}
                </span>
              </div>
              
              <div className="card-body">
                <h3 className="card-title">{event.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  <div className="info-box info-box-location">
                    <MapPin size={18} />
                    <span>{event.track_name}</span>
                  </div>
                  
                  <div className="info-box info-box-date">
                    <Calendar size={18} />
                    <span>{event.event_date}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <a 
                    href={event.source_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-snappy" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center', fontSize: '0.9rem' }}
                  >
                    Dettagli & Iscrizione <ChevronRight size={16} />
                  </a>
                  <a 
                    href={generateCalendarLink(event)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-outline-snappy" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                  >
                    <Calendar size={14} /> Aggiungi al Calendario
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
