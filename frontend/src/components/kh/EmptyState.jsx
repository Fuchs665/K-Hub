import React from 'react';
import { organizerMailto, trackSuggestionMailto } from '../../lib/contact';

// Stato vuoto onesto: spiega perché non c'è nulla, offre azioni (children)
// e, se serve, i due link di contatto (segnala un circuito / organizzatori).
function EmptyState({ title, children, region, suggestTrack = false, organizers = false, as: Heading = 'h3' }) {
  return (
    <div className="kh-empty kh-empty-state">
      <Heading className="kh-title-3">{title}</Heading>
      {children && <p className="kh-muted kh-empty-state__text">{children}</p>}
      {(suggestTrack || organizers) && (
        <ul className="kh-empty-state__links">
          {suggestTrack && (
            <li>
              <a className="kh-link-accent" href={trackSuggestionMailto(region)}>
                Ne conosci una? Segnalaci un circuito
              </a>
            </li>
          )}
          {organizers && (
            <li>
              <a className="kh-link-accent" href={organizerMailto()}>
                Organizzi gare? Pubblicale qui gratis
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default EmptyState;
