import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, getEventLapTimes } from '../lib/eventsRepository';
import { getEventStandings } from '../lib/pilotsRepository';
import { formatTimeMs } from '../lib/utils';
import { formatEventDate, formatLabel } from '../lib/format';
import { Trophy, Timer, ChevronLeft, MapPin, Calendar, Activity } from 'lucide-react';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [standings, setStandings] = useState([]);
  const [lapTimes, setLapTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPilotId, setExpandedPilotId] = useState(null);

  useEffect(() => {
    async function loadEventData() {
      try {
        const [eventData, standingsData, lapsData] = await Promise.all([
          getEventById(id),
          getEventStandings(id),
          getEventLapTimes(id)
        ]);

        setEvent(eventData);
        setStandings(standingsData || []);
        setLapTimes(lapsData || []);
      } catch (err) {
        console.error('Error loading event:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEventData();
  }, [id]);

  if (loading) {
    return (
      <div className="container main-content font-mono" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        // CALCOLO CLASSIFICHE IN CORSO...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container main-content" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--castrol-red)' }}>EVENTO NON TROVATO</h2>
        <Link to="/calendar" className="btn-outline-snappy" style={{ marginTop: '20px' }}>Torna al Calendario</Link>
      </div>
    );
  }

  const togglePilot = (pilotId) => {
    setExpandedPilotId(prev => prev === pilotId ? null : pilotId);
  };

  const getLapsForPilot = (pilotId) => {
    return lapTimes.filter(l => l.race_results?.pilot_id === pilotId);
  };

  return (
    <div className="container main-content">
      {/* Header Evento */}
      <div style={{ marginBottom: '40px' }}>
        <Link to="/calendar" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase' }}>
          <ChevronLeft size={16} /> Torna al Calendario
        </Link>
        <h1 style={{ fontSize: '3rem', lineHeight: '1.1', marginBottom: '16px' }}>{event.title}</h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div className="info-box info-box-location">
            <MapPin size={18} />
            <span>{event.track_name}</span>
          </div>
          <div className="info-box info-box-date">
            <Calendar size={18} />
            <span>{formatEventDate(event.event_date)}</span>
          </div>
          <div className={`tag ${event.event_type?.toLowerCase() === 'sprint' ? 'tag-sprint' : 'tag-endurance'}`} style={{ alignSelf: 'center' }}>
            {event.event_type}
          </div>
          {event.format && <div className="tag" style={{ alignSelf: 'center' }}>{formatLabel(event.format)}</div>}
        </div>
      </div>

      {/* Classifiche */}
      <div className="card-snappy" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="card-header" style={{ background: 'var(--text-main)', color: 'white', borderBottom: 'none' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
            <Trophy size={24} /> Classifica Finale
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--text-main)', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                <th style={{ padding: '16px', width: '60px', textAlign: 'center' }}>Pos</th>
                <th style={{ padding: '16px' }}>Pilota</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Best Lap</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Punti</th>
                <th style={{ padding: '16px', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    Nessun risultato caricato per questo evento.
                  </td>
                </tr>
              ) : (
                standings.map((std, idx) => {
                  const isExpanded = expandedPilotId === std.pilot_id;
                  const pilotLaps = getLapsForPilot(std.pilot_id);
                  const isPodium = std.position <= 3 && std.position > 0;
                  
                  return (
                    <React.Fragment key={std.result_id || idx}>
                      <tr 
                        onClick={() => togglePilot(std.pilot_id)}
                        style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(227, 24, 55, 0.05)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '900', fontSize: '1.2rem', color: isPodium ? 'var(--castrol-green)' : 'var(--text-main)' }}>
                          {std.position || '-'}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                          {std.pilot_name}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }} className="font-mono">
                          {std.best_lap_ms ? formatTimeMs(std.best_lap_ms) : '--:--.---'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', fontSize: '1.2rem' }} className="font-mono">
                          {std.points || 0}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: 'var(--castrol-red)' }}>
                          <Activity size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </td>
                      </tr>
                      
                      {/* Dettaglio Tempi (Accordion) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ padding: 0, borderBottom: '2px solid var(--text-main)' }}>
                            <div style={{ background: 'var(--bg-light)', padding: '20px', borderLeft: '4px solid var(--castrol-red)' }}>
                              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Timer size={16} /> Dettaglio Tempi
                              </h4>
                              
                              {pilotLaps.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }} className="font-mono">Nessun tempo registrato.</p>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                                  {pilotLaps.map(lap => {
                                    const isBest = lap.time_ms === std.best_lap_ms;
                                    return (
                                      <div key={lap.id} style={{ 
                                        padding: '8px 12px', 
                                        background: isBest ? 'var(--castrol-red)' : 'white',
                                        color: isBest ? 'white' : 'var(--text-main)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                      }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase' }}>Giro {lap.lap_number}</span>
                                        <span className="font-mono" style={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatTimeMs(lap.time_ms)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
