import React, { useEffect, useState } from 'react';
import { Filter, Flag, X } from 'lucide-react';
import { getEvents } from '../lib/eventsRepository';
import { ITALIAN_REGIONS } from '../lib/constants';
import EventCard, { EventCardSkeleton } from '../components/EventCard';

const PAGE_SIZE = 20;

function Calendar() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters state
  const [filterType, setFilterType] = useState('ALL');
  const [filterKart, setFilterKart] = useState('ALL');
  const [filterFormat, setFilterFormat] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterKart, filterFormat, filterRegion, page]);

  async function fetchEvents() {
    try {
      setLoading(true);
      setErrorMsg('');
      const { events: data, total: count } = await getEvents({
        region: filterRegion,
        eventType: filterType,
        engineType: filterKart,
        format: filterFormat === 'CAMPIONATO' ? 'campionato' : (filterFormat === 'GARA SINGOLA' ? 'gara_singola' : 'ALL'),
        page,
        pageSize: PAGE_SIZE,
      });
      setEvents(data);
      setTotal(count);
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMsg('Impossibile caricare gli eventi.');
    } finally {
      setLoading(false);
    }
  }

  const eventTypes = ['ALL', 'Sprint', 'Endurance', 'Ironman'];
  const kartTypes = ['ALL', '4 Tempi Racing', '4 Tempi Rental', '2 Tempi Rental', '2 Tempi Racing'];
  const regions = ['ALL', ...ITALIAN_REGIONS];
  const formats = ['ALL', 'GARA SINGOLA', 'CAMPIONATO'];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const hasActiveFilters =
    filterType !== 'ALL' || filterKart !== 'ALL' || filterFormat !== 'ALL' || filterRegion !== 'ALL';

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterKart('ALL');
    setFilterFormat('ALL');
    setFilterRegion('ALL');
    setPage(1);
  };

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>Calendario Gare</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Trova le tue prossime sfide. Usa i filtri per affinare la ricerca.
        </p>
      </div>

      {/* Advanced Filters Panel */}
      <div style={{ background: 'var(--bg-card)', padding: '20px', border: '2px solid var(--text-main)', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '10px' }}>
          <Filter size={20} />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Filtri Ricerca</h3>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filter-type" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Tipologia Gara</label>
          <select
            id="filter-type"
            className="filter-select"
            value={filterType}
            onChange={handleFilterChange(setFilterType)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filter-kart" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo Kart</label>
          <select
            id="filter-kart"
            className="filter-select"
            value={filterKart}
            onChange={handleFilterChange(setFilterKart)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {kartTypes.map(kart => <option key={kart} value={kart}>{kart}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filter-format" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Formato</label>
          <select
            id="filter-format"
            className="filter-select"
            value={filterFormat}
            onChange={handleFilterChange(setFilterFormat)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label htmlFor="filter-region" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Regione</label>
          <select
            id="filter-region"
            className="filter-select"
            value={filterRegion}
            onChange={handleFilterChange(setFilterRegion)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {regions.map(reg => <option key={reg} value={reg}>{reg}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="events-grid">
          {Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '40px 0', color: 'var(--castrol-red)' }}>{errorMsg}</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span className="font-mono" style={{ fontWeight: 'bold' }}>
              {total} {total === 1 ? 'GARA TROVATA' : 'GARE TROVATE'}
            </span>
            {hasActiveFilters && (
              <button className="btn-outline-snappy" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={resetFilters}>
                <X size={14} /> Azzera filtri
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <Flag size={40} />
              <h3>Nessuna gara trovata</h3>
              <p>Prova ad allargare i filtri di ricerca.</p>
              {hasActiveFilters && (
                <button className="btn-snappy" style={{ marginTop: '12px', fontSize: '0.9rem' }} onClick={resetFilters}>
                  Azzera filtri
                </button>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
              <button
                className="btn-outline-snappy"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Precedente
              </button>
              <span className="font-mono">Pagina {page} di {totalPages}</span>
              <button
                className="btn-outline-snappy"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Successiva
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Calendar;
