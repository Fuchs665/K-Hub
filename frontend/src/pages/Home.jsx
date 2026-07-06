import React, { useEffect, useState } from 'react';
import { getUpcomingEvents } from '../lib/eventsRepository';
import { Link } from 'react-router-dom';
import EventCard, { EventCardSkeleton } from '../components/EventCard';

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
        <div className="events-grid">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
          // NESSUN EVENTO IN ARRIVO — TORNA A TROVARCI PRESTO
        </div>
      ) : (
        <div className="events-grid">
          {upcomingEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
