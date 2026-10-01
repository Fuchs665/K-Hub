import React from 'react';

// "1:02.418" da millisecondi; null se il tempo non c'è.
function formatLap(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return null;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// Tempo sul giro nel carattere del monitor tempi (design system: LapTime).
// kind: 'best' (giro più veloce della gara, viola), 'pb' (miglior giro del
// pilota, verde), 'slower' (giallo) o nessuno. Un tempo mancante non diventa
// mai uno zero: resta "Non disponibile".
function LapTime({ ms, kind, label, size }) {
  const value = formatLap(ms);
  const classes = ['kh-lap', value ? (kind ? `kh-lap--${kind}` : '') : 'kh-lap--missing', size === 'sm' ? 'kh-lap--sm' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes}>
      <span className="kh-lap__value">{value ?? '–:––.–––'}</span>
      {(label || !value) && <span className="kh-lap__label">{value ? label : 'Non disponibile'}</span>}
    </span>
  );
}

export default LapTime;
