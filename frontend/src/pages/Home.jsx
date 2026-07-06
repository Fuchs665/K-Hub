import React, { useEffect, useState } from 'react';
import { getUpcomingEvents, getUpcomingEventsCount } from '../lib/eventsRepository';
import { getTracksCount } from '../lib/tracksRepository';
import { Link } from 'react-router-dom';
import EventCard, { EventCardSkeleton } from '../components/EventCard';

function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: null, tracks: null });

  useEffect(() => {
    fetchEvents();
    fetchStats();
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

  async function fetchStats() {
    try {
      const [events, tracks] = await Promise.all([getUpcomingEventsCount(), getTracksCount()]);
      setStats({ events, tracks });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  return (
    <div className="container main-content">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '60px', marginTop: '40px' }}>
        <h1 style={{ fontSize: '4rem', lineHeight: '1', marginBottom: '16px' }}>K-HUB ITALIA</h1>
        <div className="checker-strip" style={{ marginBottom: '24px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1.5rem', maxWidth: '600px', marginBottom: '30px' }}>
          Il portale definitivo per i piloti di Rental Kart. Trova gare, campionati e piste in tutta Italia.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/calendar" className="btn-snappy">
            TROVA UNA GARA
          </Link>
          <Link to="/tracks" className="btn-outline-snappy" style={{ padding: '12px 24px', fontSize: '1rem' }}>
            ESPLORA LE PISTE
          </Link>
        </div>

        <div className="hero-stats">
          {stats.events !== null && stats.events > 0 && (
            <div className="stat-chip">
              <span className="stat-value">{stats.events}</span>
              <span className="stat-label">Gare in calendario</span>
            </div>
          )}
          {stats.tracks !== null && stats.tracks > 0 && (
            <div className="stat-chip">
              <span className="stat-value">{stats.tracks}</span>
              <span className="stat-label">Piste censite</span>
            </div>
          )}
          <div className="stat-chip">
            <span className="stat-value">4</span>
            <span className="stat-label">Fonti monitorate</span>
          </div>
        </div>
      </div>

      {/* Banner Guida Neofiti */}
      <div style={{ background: 'var(--bg-card)', border: '2px solid var(--text-main)', borderBottom: '6px solid var(--castrol-red)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Prima volta al rental?</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Scopri format, glossario e come iscriverti alla tua prima gara.</div>
        </div>
        <Link to="/guida-rental" className="btn-outline-snappy" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          LEGGI LA GUIDA
        </Link>
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
