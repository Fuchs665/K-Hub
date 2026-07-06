import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft, Trophy } from 'lucide-react';

function RkcAsi() {
  const [activeRegion, setActiveRegion] = useState('Lombardia');
  const tabsRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Hardcoded regions for the tabs
  const regions = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
    'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
  ];

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '40px', background: 'var(--castrol-red)', padding: '40px', color: 'white', clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <Trophy size={48} />
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1', margin: 0 }}>RKC ASI</h1>
        </div>
        <h2 style={{ color: 'white', margin: 0, opacity: 0.9 }}>VERSO LE FINALI NAZIONALI</h2>
        <p style={{ marginTop: '16px', maxWidth: '600px', fontSize: '1.1rem' }}>
          Il percorso per accedere alle finali nazionali ASI. Cerca le tappe della tua regione, accumula punti e preparati alla sfida definitiva.
        </p>
      </div>

      {/* Region Tabs with Arrows */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '10px' }}>
        <button onClick={() => scrollTabs('left')} className="scroll-btn">
          <ChevronLeft size={24} />
        </button>

        <div className="filters-bar no-scrollbar" ref={tabsRef} style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: '12px', padding: '5px 0', scrollBehavior: 'smooth' }}>
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`filter-chip ${activeRegion === region ? 'active' : ''}`}
              style={{ flexShrink: 0 }}
            >
              {region}
            </button>
          ))}
        </div>

        <button onClick={() => scrollTabs('right')} className="scroll-btn">
          <ChevronRight size={24} />
        </button>
      </div>

      <div>
        <h3 style={{ marginBottom: '20px', fontSize: '1.8rem', borderBottom: '2px solid var(--text-main)', paddingBottom: '10px' }}>
          Tappe in {activeRegion}
        </h3>

        <div className="empty-state" style={{ marginTop: 0 }}>
          <Trophy size={40} />
          <h3>Calendario tappe in arrivo</h3>
          <p>Le tappe ufficiali RKC ASI di questa regione saranno pubblicate qui appena confermate.</p>
        </div>
      </div>
    </div>
  );
}

export default RkcAsi;
