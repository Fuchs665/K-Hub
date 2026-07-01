import React, { useState } from 'react';
import { Calendar, MapPin, Trophy, ChevronRight, Search, Menu } from 'lucide-react';
import './index.css';

// Dati mock per iniziare a vedere l'interfaccia
const MOCK_EVENTS = [
  {
    id: 1,
    title: 'SWS Sprint Cup - Pomposa',
    track: 'Circuito di Pomposa (FE)',
    date: '15 Ottobre 2026',
    type: 'Sprint',
    engine: '4 Tempi (Sodi RT8)',
    price: '65€',
    isBeginnerFriendly: true
  },
  {
    id: 2,
    title: 'KZR Championship - Tappa 3',
    track: 'Cremona Circuit (CR)',
    date: '22 Ottobre 2026',
    type: 'Championship',
    engine: '2 Tempi (R-MAX)',
    price: '150€',
    isBeginnerFriendly: false
  },
  {
    id: 3,
    title: '6H Endurance Rental Masters',
    track: 'Lignano Circuit (UD)',
    date: '1 Novembre 2026',
    type: 'Endurance',
    engine: '4 Tempi',
    price: '300€/Team',
    isBeginnerFriendly: true
  }
];

function App() {
  const [activeFilter, setActiveFilter] = useState('Tutti');

  const filters = ['Tutti', 'Sprint', 'Endurance', 'Campionati', 'Per Neofiti', 'Nord Italia', 'Centro/Sud Italia'];

  return (
    <>
      <nav className="navbar">
        <div className="container nav-content">
          <a href="#" className="logo">
            <Trophy color="#FF3366" size={28} />
            HUB<span>KARTING</span>
          </a>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn btn-outline" style={{ display: 'none' /* hidden on mobile */ }}>
              Bacheca Annunci
            </button>
            <button className="btn btn-primary">
              Login Piste / Team
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content container">
        <section className="hero-section">
          <h1 className="title-gradient hero-title">Trova la tua prossima gara.</h1>
          <p className="hero-subtitle">
            Il primo portale in Italia che raccoglie tutti gli eventi rental karting. 
            Dalle prime gare sprint ai campionati nazionali, tutto in un unico posto.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              <Search size={20} />
              Cerca Eventi
            </button>
            <button className="btn btn-outline" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              Guida per Neofiti
            </button>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Prossime Gare In Evidenza</h2>
          </div>

          <div className="filters-bar">
            {filters.map(f => (
              <button 
                key={f}
                className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="events-grid">
            {MOCK_EVENTS.map(event => (
              <div key={event.id} className="glass-panel">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={`tag tag-${event.type.toLowerCase()}`}>
                    {event.type}
                  </span>
                  {event.isBeginnerFriendly && (
                    <span className="tag" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                      🏁 Neofiti
                    </span>
                  )}
                </div>
                
                <div className="card-body">
                  <h3 className="card-title">{event.title}</h3>
                  
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="card-info-row">
                      <MapPin className="card-info-icon" />
                      <span>{event.track}</span>
                    </div>
                    <div className="card-info-row">
                      <Calendar className="card-info-icon" />
                      <span>{event.date}</span>
                    </div>
                    <div className="card-info-row">
                      <div className="card-info-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚙️</div>
                      <span>{event.engine} • {event.price}</span>
                    </div>
                  </div>

                  <button className="btn btn-outline" style={{ width: '100%', marginTop: '24px' }}>
                    Dettagli Evento
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
