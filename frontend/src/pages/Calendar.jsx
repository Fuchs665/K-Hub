import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar as CalendarIcon, MapPin, Flag, ChevronRight, Filter } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [filterType, setFilterType] = useState('ALL');
  const [filterKart, setFilterKart] = useState('ALL');
  const [filterFormat, setFilterFormat] = useState('ALL'); // Gara Singola vs Campionato
  const [filterRegion, setFilterRegion] = useState('ALL');

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

  // Hardcoded options for filters
  const eventTypes = ['ALL', 'Sprint', 'Endurance', 'Ironman'];
  const kartTypes = ['ALL', '4 Tempi Racing', '4 Tempi Rental', '2 Tempi Rental', '2 Tempi Racing'];
  
  // Mock Regions and Formats for now as they might not be explicitly in DB yet
  const regions = [
    'ALL', 'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 
    'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
  ];
  const formats = ['ALL', 'GARA SINGOLA', 'CAMPIONATO'];

  // Apply filters
  const filteredEvents = events.filter(event => {
    if (filterType !== 'ALL' && event.event_type?.toUpperCase() !== filterType) return false;
    if (filterKart !== 'ALL' && event.engine_type?.toUpperCase() !== filterKart) return false;
    // Note: For Region and Format, we might need to check title or add DB columns later. 
    // Here we do a basic includes check if it's not ALL
    if (filterFormat !== 'ALL' && !event.title?.toUpperCase().includes(filterFormat === 'CAMPIONATO' ? 'CHAMPIONSHIP' : '')) {
      // Very basic mock logic for format
      if (filterFormat === 'CAMPIONATO' && !event.title?.toUpperCase().includes('CAMPIONATO') && !event.title?.toUpperCase().includes('CHAMPIONSHIP') && !event.title?.toUpperCase().includes('SWS')) return false;
    }
    // Region check (mocked based on track name for now, very naive)
    if (filterRegion !== 'ALL' && !event.track_name?.toUpperCase().includes(filterRegion.toUpperCase())) {
      // In a real app we'd have a region column in the tracks/events table
    }
    return true;
  });

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
            onChange={e => setFilterType(e.target.value)}
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
            onChange={e => setFilterKart(e.target.value)}
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
            onChange={e => setFilterFormat(e.target.value)}
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
            onChange={e => setFilterRegion(e.target.value)}
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
      ) : (
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
              Nessuna gara trovata con i filtri selezionati.
            </div>
          ) : (
            filteredEvents.map(event => (
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
      )}
    </div>
  );
}

export default Calendar;
