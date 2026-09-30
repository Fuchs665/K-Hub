import React from 'react';
import { Link } from 'react-router-dom';
import DatePlate from './DatePlate';
import TrackLine from './TrackLine';
import { cleanEventTitle, formatEventType, formatName } from '../../lib/eventTitle';
import { findLayout } from '../../lib/tracks';

// Una gara nella lista del calendario (design system: EventRow). Tutta la riga
// porta alla pagina evento; il titolo originale della fonte resta nel tooltip.
function EventRow({ event }) {
  const layout = findLayout(event.track_name);
  const place = [formatName(event.track_name), event.region].filter(Boolean).join(', ');
  return (
    <Link to={`/event/${event.id}`} className="kh-event" title={event.title}>
      <DatePlate date={event.event_date} />
      <span className="kh-event__main">
        <span className="kh-event__title">{cleanEventTitle(event.title, event.track_name)}</span>
        {place && <span className="kh-event__place">{place}</span>}
      </span>
      <span className="kh-event__format">{formatEventType(event.event_type)}</span>
      {layout ? <TrackLine layout={layout} className="kh-event__track" /> : <span className="kh-event__track" aria-hidden="true" />}
    </Link>
  );
}

export function EventGroups({ groups }) {
  return groups.map((group) => (
    <div className="kh-event-group" key={group.label}>
      <h3 className="kh-title-3">{group.label}</h3>
      <div className="kh-event-list">
        {group.events.map((event) => <EventRow event={event} key={event.id} />)}
      </div>
    </div>
  ));
}

export default EventRow;
