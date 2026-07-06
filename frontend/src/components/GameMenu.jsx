import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GameMenu — menu verticale "da videogioco rally": righe con taglio diagonale
 * (clip-path) che scivolano a destra e si illuminano di rosso su hover/selezione.
 * Navigazione da tastiera: ↑/↓ per muoversi, Enter/Spazio per aprire la voce.
 *
 * Props:
 *  - items: [{ label, to, meta? }]  voci del menu (meta = micro-label mono opzionale).
 *  - className: classi extra sul <nav>.
 *  - ariaLabel: etichetta accessibile del menu (default 'Menu principale').
 */
function GameMenu({ items = [], className = '', ariaLabel = 'Menu principale' }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef([]);

  const focusItem = (i) => {
    if (items.length === 0) return;
    const next = (i + items.length) % items.length;
    setActiveIndex(next);
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
          onMouseEnter={() => setActiveIndex(i)}
          onFocus={() => setActiveIndex(i)}
          onClick={() => navigate(item.to)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          <span className="game-menu-index" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="game-menu-label">{item.label}</span>
          {item.meta && <span className="game-menu-meta">{item.meta}</span>}
        </button>
      ))}
    </nav>
  );
}

export default GameMenu;
