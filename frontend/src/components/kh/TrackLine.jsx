import React from 'react';
import { layoutViewBox } from '../../lib/tracks';

// Il disegno reale di una pista. Con `kart` un puntino percorre il tracciato:
// durata = metri / 100, così ogni kart va alla stessa velocità.
// Con prefers-reduced-motion il kart è nascosto dal CSS.
function TrackLine({ layout, kart = false, label, className = '' }) {
  if (!layout) return null;
  const labelled = Boolean(label);
  return (
    <svg
      className={`kh-track ${className}`.trim()}
      viewBox={layoutViewBox(layout)}
      preserveAspectRatio="xMidYMid meet"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <path d={layout.path} />
      {kart && (
        <circle className="kh-kart" r="6">
          <animateMotion dur={`${(layout.lengthM / 100).toFixed(1)}s`} repeatCount="indefinite" path={layout.path} />
        </circle>
      )}
    </svg>
  );
}

export default TrackLine;
