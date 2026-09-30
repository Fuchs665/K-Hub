import React from 'react';
import { Link } from 'react-router-dom';
import DatePlate from './DatePlate';
import TrackLine from './TrackLine';
import { cleanEventTitle, formatEventType, formatName } from '../../lib/eventTitle';
import { findLayout } from '../../lib/tracks';
import { parseEventDate } from '../../lib/format';
import { startOfDay } from '../../lib/eventBuckets';

// Una gara nella lista del calendario (design system: EventRow). Tutta la riga
// porta alla pagina evento (link esteso sul titolo); il titolo originale della
// fonte resta nel tooltip. Con `register` e un link di iscrizione, a destra c'è
// il bottone per iscriversi direttamente sul sito dell'organizzatore (solo per
// gare non ancora passate): è il click che conta per i kartodromi.
function EventRow({ event, register = false }) {
  const layout = findLayout(event.track_name);
  const title = cleanEventTitle(event.title, event.track_name);
  const place = [formatName(event.track_name), event.region].filter(Boolean).join(', ');
  const date = parseEventDate(event.event_date);
  const canRegister = register && event.source_url && (!date || date >= startOfDay(new Date()));

  return (
    <article className={`kh-event ${register ? 'kh-event--register' : ''}`.trim()}>
      <DatePlate date={event.event_date} />
      <span className="kh-event__main">
        <Link to={`/event/${event.id}`} className="kh-event__title kh-event__link" title={event.title}>{title}</Link>
        {place && <span className="kh-event__place">{place}</span>}
      </span>
      <span className="kh-event__format">{formatEventType(event.event_type)}</span>
      {layout ? <TrackLine layout={layout} className="kh-event__track" /> : <span className="kh-event__track" aria-hidden="true" />}
      {register && (
        <span className="kh-event__action">
          {canRegister && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noreferrer"
              className="kh-btn kh-btn--secondary kh-btn--sm"
              aria-label={`Iscriviti a ${title} sul sito dell'organizzatore (si apre in una nuova scheda)`}
            >
              Iscriviti
            </a>
          )}
        </span>
      )}
    </article>
  );
}

export function EventGroups({ groups, register = false }) {
  return groups.map((group) => (
    <div className="kh-event-group" key={group.label}>
      <h3 className="kh-title-3">{group.label}</h3>
      <div className="kh-event-list">
        {group.events.map((event) => <EventRow event={event} register={register} key={event.id} />)}
      </div>
    </div>
  ));
}

export default EventRow;
