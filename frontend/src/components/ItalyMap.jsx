import React from 'react';
import { ITALY_VIEWBOX, ITALY_REGIONS } from '../data/italyRegions';

/**
 * Mappa SVG cliccabile dell'Italia per regioni.
 * - regionCounts: { [nomeRegione]: numeroPiste } — decide quali regioni sono "attive".
 * - selectedRegion: nome regione selezionata (o null).
 * - onSelect(nomeRegione): chiamata al click di una regione con piste.
 *   Cliccare la regione gia' selezionata la deseleziona (gestito dal genitore).
 * Le regioni senza piste sono grigie e non interattive.
 */
function ItalyMap({ regionCounts = {}, selectedRegion = null, onSelect }) {
  const handleActivate = (name, count) => {
    if (count > 0 && onSelect) onSelect(name);
  };

  return (
    <svg
      viewBox={ITALY_VIEWBOX}
      className="italy-map"
      role="img"
      aria-label="Mappa delle regioni italiane con piste di kart"
      xmlns="http://www.w3.org/2000/svg"
    >
      {ITALY_REGIONS.map(({ id, name, path }) => {
        const count = regionCounts[name] || 0;
        const hasTracks = count > 0;
        const isSelected = selectedRegion === name;
        const classes = [
          'italy-region',
          hasTracks ? 'has-tracks' : 'empty',
          isSelected ? 'selected' : '',
        ].filter(Boolean).join(' ');

        return (
          <path
            key={id}
            d={path}
            className={classes}
            onClick={() => handleActivate(name, count)}
            role={hasTracks ? 'button' : undefined}
            tabIndex={hasTracks ? 0 : undefined}
            aria-pressed={hasTracks ? isSelected : undefined}
            onKeyDown={(e) => {
              if (hasTracks && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleActivate(name, count);
              }
            }}
          >
            <title>
              {hasTracks
                ? `${name} — ${count} pist${count === 1 ? 'a' : 'e'}`
                : `${name} — nessuna pista`}
            </title>
          </path>
        );
      })}
    </svg>
  );
}

export default ItalyMap;
