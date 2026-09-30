import React, { useLayoutEffect, useRef } from 'react';
import TrackLine from './TrackLine';

// Il titolo della locandina parte da 33cqi e si riduce finché la riga più
// lunga non entra. Le misure scalano con la locandina (unità cqi), quindi il
// rapporto si calcola una volta, e di nuovo quando il carattere vero è
// caricato (prima la misura è fatta sul carattere di riserva).
const TITLE_FONT = 'italic 900 100px "Archivo"';

function useFitTitle(ref, key) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let active = true;
    const fit = () => {
      if (!active) return;
      el.style.setProperty('--kh-fit', '1');
      const widest = Math.max(0, ...[...el.children].map((line) => line.scrollWidth));
      // Margine per la sporgenza del corsivo, che scrollWidth non conta.
      if (widest > 0) el.style.setProperty('--kh-fit', String(Math.min(1, (el.clientWidth / widest) * 0.94)));
    };
    fit();
    if (document.fonts?.load) document.fonts.load(TITLE_FONT).then(fit, fit);
    return () => { active = false; };
  }, [ref, key]);
}

// Locandina generata di una gara o di una pista (design system: Poster).
// ground: 'giallo' | 'rosso' | 'blu'. lines: titolo già spezzato in righe corte.
function Poster({ ground = 'giallo', lines, layout, trackLabel, dateLabel, format, label, kart = false, className = '' }) {
  const titleRef = useRef(null);
  useFitTitle(titleRef, lines.join('|'));

  return (
    <article className={`kh-poster kh-poster--${ground} ${lines.length > 1 ? 'kh-poster--multi' : ''} ${className}`.replace(/\s+/g, ' ').trim()} aria-label={label}>
      <p className="kh-poster__title" ref={titleRef}>
        {lines.map((line) => <span className="kh-poster__line" key={line}>{line}</span>)}
      </p>
      {layout && (
        <div className="kh-poster__art" aria-hidden="true">
          <TrackLine layout={layout} kart={kart} />
        </div>
      )}
      <div className="kh-poster__foot">
        <span className="kh-poster__track">{trackLabel}</span>
        {dateLabel && <span className="kh-poster__date">{dateLabel}</span>}
        <span className="kh-poster__meta">
          {format && <span className="kh-poster__format">{format}</span>}
          <span className="kh-poster__mark">k-hub</span>
        </span>
      </div>
    </article>
  );
}

export default Poster;
