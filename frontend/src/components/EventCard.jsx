import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, ChevronRight, Trophy } from 'lucide-react';
import { formatEventDate, generateCalendarLink } from '../lib/format';

function EventCard({ event }) {
  return (
    <div className="card-snappy">
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

        <div className="card-info">
          <div className="info-box info-box-location">
            <MapPin size={18} />
            <span>{event.track_name}</span>
          </div>

          <div className="info-box info-box-date">
            <CalendarIcon size={18} />
            <span>{formatEventDate(event.event_date)}</span>
          </div>
        </div>

        <div className="card-actions">
          <Link to={`/event/${event.id}`} className="btn-snappy card-action-btn">
            <Trophy size={16} /> Classifica & Tempi
          </Link>
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline-snappy card-action-btn"
            >
              Dettagli & Iscrizione <ChevronRight size={16} />
            </a>
          )}
          <a
            href={generateCalendarLink(event)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline-snappy card-action-btn"
            style={{ fontSize: '0.85rem' }}
          >
            <CalendarIcon size={14} /> Aggiungi al Calendario
          </a>
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card-snappy skeleton-card" aria-hidden="true">
      <div className="card-header">
        <span className="skeleton-line" style={{ width: '35%', height: '24px' }} />
        <span className="skeleton-line" style={{ width: '20%' }} />
      </div>
      <div className="card-body">
        <span className="skeleton-line" style={{ width: '85%', height: '22px', marginBottom: '10px' }} />
        <span className="skeleton-line" style={{ width: '60%', height: '22px', marginBottom: '20px' }} />
        <div className="card-info">
          <span className="skeleton-line" style={{ width: '100%', height: '38px' }} />
          <span className="skeleton-line" style={{ width: '100%', height: '38px' }} />
        </div>
        <div className="card-actions">
          <span className="skeleton-line" style={{ width: '100%', height: '42px' }} />
          <span className="skeleton-line" style={{ width: '100%', height: '36px' }} />
        </div>
      </div>
    </div>
  );
}

export default EventCard;
