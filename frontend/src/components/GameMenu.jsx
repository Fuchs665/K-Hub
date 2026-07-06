import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GameMenu — menu verticale "da videogioco rally": righe con taglio diagonale
 * (clip-path) che scivolano a destra e si illuminano di rosso su hover/selezione.
 * Navigazione da tastiera (quando il menu ha il focus): ↑/↓ per muoversi,
 * Enter/Spazio per aprire la voce. Il click naviga sempre alla route.
 *
 * L'indice attivo cambia su hover/focus/frecce e viene notificato via
 * onActiveChange: la Home lo usa per sincronizzare il pannello contestuale
 * a destra (preview on hover, go on click).
 *
 * Props:
 *  - items: [{ label, to, meta? }]  voci del menu (meta = micro-label mono opzionale).
 *  - onActiveChange: (index) => void  callback quando cambia la voce evidenziata.
 *  - className: classi extra sul <nav>.
 *  - ariaLabel: etichetta accessibile del menu (default 'Menu principale').
 */
function GameMenu({ items = [], onActiveChange, className = '', ariaLabel = 'Menu principale' }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef([]);

  const setActive = (i) => {
    setActiveIndex(i);
    onActiveChange?.(i);
  };

  const focusItem = (i) => {
    if (items.length === 0) return;
    const next = (i + items.length) % items.length;
    setActive(next);
    itemRefs.current[next]?.focus();
  };

  const handleKeyDown = (e, i) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(i + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(i - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        navigate(items[i].to);
        break;
      default:
        break;
    }
  };

  return (
    <nav className={`game-menu ${className}`.trim()} aria-label={ariaLabel}>
      {items.map((item, i) => (
        <button
          key={item.to}
          type="button"
          ref={(el) => (itemRefs.current[i] = el)}
          className={`game-menu-item ${activeIndex === i ? 'is-active' : ''}`.trim()}
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          onClick={() => navigate(item.to)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          <span className="game-menu-index" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="game-menu-label">{item.label}</span>
          {item.meta && <span className="game-menu-meta">{item.meta}</span>}
          <span className="game-menu-arrow" aria-hidden="true">▸</span>
        </button>
      ))}
    </nav>
  );
}

export default GameMenu;
