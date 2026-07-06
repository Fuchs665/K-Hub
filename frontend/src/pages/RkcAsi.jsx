import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, Trophy, X } from 'lucide-react';
import { getRkcAsiEvents } from '../lib/eventsRepository';
import { ITALIAN_REGIONS } from '../lib/constants';
import EventCard, { EventCardSkeleton } from '../components/EventCard';

function RkcAsi() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const tabsRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getRkcAsiEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching RKC ASI events:', error);
      setErrorMsg('Impossibile caricare il calendario RKC ASI.');
    } finally {
      setLoading(false);
    }
  }

  // Conteggio tappe per regione, per evidenziare i tab con dati (stesso pattern di TracksDirectory).
  const regionCounts = useMemo(() => {
    const counts = {};
    for (const e of events) {
      if (e.region) counts[e.region] = (counts[e.region] || 0) + 1;
    }
    return counts;
  }, [events]);

  const visibleEvents = useMemo(() => {
    if (!selectedRegion) return events;
    return events.filter(e => e.region === selectedRegion);
  }, [events, selectedRegion]);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectRegion = (name) => {
    setSelectedRegion(prev => (prev === name ? null : name));
  };

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
          {ITALIAN_REGIONS.map(region => (
            <button
              key={region}
              onClick={() => handleSelectRegion(region)}
              className={`filter-chip ${selectedRegion === region ? 'active' : ''}`}
              style={{ flexShrink: 0, opacity: regionCounts[region] ? 1 : 0.5 }}
            >
              {region}{regionCounts[region] ? ` (${regionCounts[region]})` : ''}
            </button>
          ))}
        </div>

        <button onClick={() => scrollTabs('right')} className="scroll-btn">
          <ChevronRight size={24} />
        </button>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--text-main)', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.8rem' }}>
            {selectedRegion ? `Tappe in ${selectedRegion}` : 'Tutte le tappe'}
          </h3>
          {selectedRegion && (
            <button className="btn-outline-snappy reset-region-btn" onClick={() => setSelectedRegion(null)}>
              <X size={16} /> Tutte le regioni
            </button>
          )}
        </div>

        {loading ? (
          <div className="events-grid">
            {Array.from({ length: 3 }, (_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '40px 0', color: 'var(--castrol-red)' }}>{errorMsg}</div>
        ) : visibleEvents.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 0 }}>
            <Trophy size={40} />
            <h3>Calendario tappe in arrivo</h3>
            <p>
              {selectedRegion
                ? `Nessuna tappa RKC ASI confermata in ${selectedRegion} al momento.`
                : 'Le tappe ufficiali RKC ASI saranno pubblicate qui appena confermate.'}
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {visibleEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RkcAsi;
