import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, getEventLapTimes } from '../lib/eventsRepository';
import { getEventStandings } from '../lib/pilotsRepository';
import { formatTimeMs } from '../lib/utils';
import { formatEventDate, formatLabel } from '../lib/format';
import { ChevronLeft, MapPin, Calendar, X } from 'lucide-react';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [standings, setStandings] = useState([]);
  const [lapTimes, setLapTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  // Chiave sull id del risultato, non sul pilot_id: i piloti inseriti a mano
  // senza profilo registrato hanno pilot_id NULL e non sarebbero espandibili.
  const [expandedResultId, setExpandedResultId] = useState(null);

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
      <div className="rkc-page evt-page">
        <div className="rkc-empty" style={{ padding: '180px 0' }}>// CALCOLO CLASSIFICHE...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rkc-page evt-page">
        <div className="rkc-empty" style={{ padding: '160px 24px' }}>
          <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>
            EVENTO NON TROVATO
          </p>
          <Link to="/calendar" className="cal-btn is-primary">Torna al Calendario</Link>
        </div>
      </div>
    );
  }

  const toggleResult = (resultId) => {
    setExpandedResultId(prev => prev === resultId ? null : resultId);
  };

  const getLapsForResult = (resultId) => {
    return lapTimes.filter(l => l.race_results?.id === resultId);
  };

  const expandedStanding = standings.find(s => s.result_id === expandedResultId) || null;
  const expandedLaps = expandedResultId ? getLapsForResult(expandedResultId) : [];

  return (
    <div className="rkc-page evt-page">
      {/* ---------- HERO ---------- */}
      <HudFrame className="rkc-hero evt-hero" style={{ '--hud-size': '30px', '--hud-inset': '20px' }}>
        <div className="khub-bg" aria-hidden="true">
          <div className="khub-bg-grid" />
          <div className="khub-bg-speed" />
          <div className="khub-bg-grain" />
        </div>

        <div className="rkc-hero-inner">
          <Link to="/calendar" className="evt-back">
            <ChevronLeft size={16} /> Torna al Calendario
          </Link>
          <SectionEyebrow className="rkc-hero-eyebrow">Scheda Evento</SectionEyebrow>
          <h1 className="rkc-title">{event.title}</h1>

          <div className="evt-meta">
            <span className="evt-meta-item"><MapPin size={16} /> {event.track_name}</span>
            <span className="evt-meta-item"><Calendar size={16} /> {formatEventDate(event.event_date)}</span>
            <span className={`khub-event-tag ${event.event_type?.toLowerCase() === 'sprint' ? 'is-sprint' : 'is-endurance'}`}>
              {event.event_type}
            </span>
            {event.format && <span className="khub-event-tag">{formatLabel(event.format)}</span>}
          </div>
        </div>
      </HudFrame>

      {/* ---------- CLASSIFICA ---------- */}
      <section className="rkc-section container">
        <div className="rkc-section-head">
          <div>
            <SectionEyebrow className="rkc-section-eyebrow">Risultati</SectionEyebrow>
            <h2 className="rkc-section-title">Classifica Finale</h2>
          </div>
        </div>

        {standings.length === 0 ? (
          <div className="rkc-empty">// Nessun risultato caricato per questo evento</div>
        ) : (
          <div className="rkc-board">
            {standings.map((std, idx) => (
              <button
                key={std.result_id || idx}
                className={`rkc-row ${expandedResultId === std.result_id ? 'selected' : ''}`.trim()}
                onClick={() => toggleResult(std.result_id)}
                aria-expanded={expandedResultId === std.result_id}
              >
                <span className="rkc-pos">{std.position || '-'}</span>
                <span className="rkc-drv">{std.pilot_name}</span>
                <span className="evt-row-vals">
                  <span className="rkc-val is-lap">
                    {std.best_lap_ms ? formatTimeMs(std.best_lap_ms) : '--:--.---'}
                    <small>BEST LAP</small>
                  </span>
                  <span className="rkc-val">
                    {std.points || 0}
                    <small>PUNTI</small>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {expandedStanding && (
          <HudFrame className="rkc-detail" corners={['tl', 'br']}>
            <div className="rkc-detail-head">
              <div>
                <div className="rkc-detail-name">{expandedStanding.pilot_name}</div>
                <div className="rkc-detail-team">Dettaglio tempi sul giro</div>
              </div>
              <button className="rkc-detail-close" onClick={() => setExpandedResultId(null)} aria-label="Chiudi dettaglio">
                <X size={18} />
              </button>
            </div>

            {expandedLaps.length === 0 ? (
              <p className="dsh-telemetry-text" style={{ margin: 0 }}>Nessun tempo registrato.</p>
            ) : (
              <div className="rkc-detail-grid">
                {expandedLaps.map(lap => (
                  <div
                    key={lap.id}
                    className={`rkc-tile ${lap.time_ms === expandedStanding.best_lap_ms ? 'is-lap' : ''}`.trim()}
                  >
                    <b>{formatTimeMs(lap.time_ms)}</b>
                    <span>Giro {lap.lap_number}</span>
                  </div>
                ))}
              </div>
            )}
          </HudFrame>
        )}
      </section>
    </div>
  );
}

export default EventDetails;
