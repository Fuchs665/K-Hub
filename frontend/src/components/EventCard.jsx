import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, ChevronRight, Trophy } from 'lucide-react';
import { formatEventDate, generateCalendarLink } from '../lib/format';

// Card evento in tema dark "Rally Game Menu": stessa firma visiva di
// khub-event-card (RkcAsi/Home) ma con la riga di azioni del calendario.
function EventCard({ event }) {
  return (
    <article className="rkc-card">
      <div className="khub-event-top">
        <span className={`khub-event-tag ${event.event_type?.toLowerCase() === 'sprint' ? 'is-sprint' : 'is-endurance'}`}>
          {event.event_type}
        </span>
        <span className="khub-event-date">{event.engine_type}</span>
      </div>

      <h3 className="khub-event-title">{event.title}</h3>

      <div className="cal-event-info">
        <span className="khub-event-track">
          <MapPin size={14} /> {event.track_name}
        </span>
        <span className="khub-event-track">
          <CalendarIcon size={14} /> {formatEventDate(event.event_date)}
        </span>
      </div>

      <div className="cal-event-actions">
        <Link to={`/event/${event.id}`} className="cal-btn is-primary">
          <Trophy size={14} /> Classifica & Tempi
        </Link>
        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="cal-btn"
          >
            Dettagli & Iscrizione <ChevronRight size={14} />
          </a>
        )}
        <a
          href={generateCalendarLink(event)}
          target="_blank"
          rel="noreferrer"
          className="cal-btn"
        >
          <CalendarIcon size={13} /> Aggiungi al Calendario
        </a>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="rkc-card" aria-hidden="true" style={{ gap: '14px' }}>
      <span className="khub-skel" style={{ width: '40%' }} />
      <span className="khub-skel" style={{ width: '85%', height: '22px' }} />
      <span className="khub-skel" style={{ width: '60%' }} />
      <span className="khub-skel" style={{ width: '100%', height: '38px' }} />
      <span className="khub-skel" style={{ width: '100%', height: '38px' }} />
    </div>
  );
}

export default EventCard;
