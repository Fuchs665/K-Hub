import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Flag, ChevronRight, Filter } from 'lucide-react';
import { getEvents } from '../lib/eventsRepository';
import { ITALIAN_REGIONS } from '../lib/constants';

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
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Tipologia Gara</label>
          <select
            className="filter-select"
            value={filterType}
            onChange={handleFilterChange(setFilterType)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo Kart</label>
          <select
            className="filter-select"
            value={filterKart}
            onChange={handleFilterChange(setFilterKart)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {kartTypes.map(kart => <option key={kart} value={kart}>{kart}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Formato</label>
          <select
            className="filter-select"
            value={filterFormat}
            onChange={handleFilterChange(setFilterFormat)}
            style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', background: 'white', fontFamily: 'inherit', fontWeight: '600' }}
          >
            {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Regione</label>
          <select
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
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="font-mono">
          // CARICAMENTO TELEMETRIA...
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '40px 0', color: 'var(--castrol-red)' }}>{errorMsg}</div>
      ) : (
        <>
          <div className="events-grid">
            {events.length === 0 ? (
              <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
                Nessuna gara trovata con i filtri selezionati.
              </div>
            ) : (
              events.map(event => (
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
                        <CalendarIcon size={18} />
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
                        <CalendarIcon size={14} /> Aggiungi al Calendario
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

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
