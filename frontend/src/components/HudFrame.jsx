import React from 'react';

/**
 * HudFrame — cornice HUD con bracket ad angolo (verde lime) attorno al contenuto.
 * Firma visiva del redesign: avvolge sezioni/board senza imporre uno sfondo.
 *
 * Props:
 *  - children:  contenuto incorniciato.
 *  - color:     colore dei bracket (default var(--accent2)); passa un colore per override.
 *  - corners:   quali angoli mostrare, default tutti e 4 ['tl','tr','bl','br'].
 *  - className: classi extra sul contenitore.
 *  - ...rest:   inoltrati al div (es. style, role).
 */
function HudFrame({ children, color, corners = ['tl', 'tr', 'bl', 'br'], className = '', style, ...rest }) {
  const mergedStyle = color ? { ...style, '--hud-color': color } : style;
  return (
    <div className={`hud-frame ${className}`.trim()} style={mergedStyle} {...rest}>
      {corners.map((c) => (
        <span key={c} className={`hud-corner hud-corner--${c}`} aria-hidden="true" />
      ))}
      {children}
    </div>
  );
}

export default HudFrame;
