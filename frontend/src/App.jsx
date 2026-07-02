import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Search, Trophy, Settings } from 'lucide-react';
import { supabase } from './lib/supabase';
import './index.css';

const fakeEvents = [
  {
    id: 'fake-1',
    title: 'SWS Sprint Cup - Night Race',
    track_name: 'Cremona Circuit',
    event_date: '15 Luglio 2026',
    event_type: 'Sprint',
    is_beginner_friendly: false,
    engine_info: 'Sodi RT8 390cc',
    price_info: '€ 65.00',
    event_url: '#'
  },
  {
    id: 'fake-2',
    title: 'Endurance 3H by KZR',
    track_name: 'Pista Azzurra Jesolo',
    event_date: '22 Luglio 2026',
    event_type: 'Endurance',
    is_beginner_friendly: false,
    engine_info: 'TB Kart 270cc',
    price_info: '€ 150.00 / Team',
    event_url: '#'
  },
  {
    id: 'fake-3',
    title: 'Neofiti Cup - Prima Gara',
    track_name: 'Lignano Circuit',
    event_date: '28 Luglio 2026',
    event_type: 'Sprint',
    is_beginner_friendly: true,
    engine_info: 'Sodi SR4 270cc',
    price_info: '€ 45.00',
    event_url: '#'
  }
];

function App() {
  const [activeFilter, setActiveFilter] = useState('Tutti');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = ['Tutti', 'Sprint', 'Endurance', 'Campionati', 'Per Neofiti', 'Nord Italia', 'Centro/Sud Italia'];

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Errore nel fetch degli eventi:", error);
          setEvents(fakeEvents);
        } else {
          // Uniamo i fake data ai dati reali per test visivo
          setEvents([...(data || []), ...fakeEvents]);
        }
      } catch (err) {
        console.error("Errore di rete:", err);
        setEvents(fakeEvents);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Filter Logic
  const filteredEvents = events.filter(e => {
    if (activeFilter === 'Tutti') return true;
    if (activeFilter === 'Per Neofiti') return e.is_beginner_friendly;
    if (activeFilter === 'Sprint') return e.event_type?.toLowerCase() === 'sprint';
    if (activeFilter === 'Endurance') return e.event_type?.toLowerCase() === 'endurance';
    return true; // Simplification for demo
  });

  return (
    <div className="font-sans text-white bg-bg-dark min-h-screen selection:bg-racing-red/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-bg-dark/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <a href="#" className="font-heading text-2xl font-extrabold flex items-center gap-3 tracking-tight transition-transform hover:scale-105">
            <img src="/logo.png" alt="Hub Karting Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,51,102,0.6)] rounded-lg" />
            HUB<span className="text-racing-red">KARTING</span>
          </a>
          
          <div className="flex gap-4 items-center">
            <button className="hidden md:block px-5 py-2.5 rounded-lg font-semibold text-sm border border-white/20 hover:bg-white/5 transition-all text-gray-300 hover:text-white">
              Bacheca Annunci
            </button>
            <button className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-racing-red text-white hover:bg-racing-orange transition-all shadow-[0_0_20px_rgba(255,51,102,0.3)] hover:shadow-[0_0_25px_rgba(255,107,53,0.5)]">
              Login Piste / Team
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32 relative rounded-3xl overflow-hidden mb-16 border border-white/10 shadow-[0_0_50px_rgba(255,51,102,0.15)]">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero-bg.png')" }}></div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-dark/80 via-bg-dark/60 to-bg-dark"></div>
          
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-racing-red/30 bg-racing-red/10 text-racing-red text-sm font-semibold tracking-wide backdrop-blur-sm">
            🔥 Stagione 2026 Aperta
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-sm">
            Trova la tua prossima <br className="hidden md:block"/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-racing-red to-racing-orange drop-shadow-lg">Gara.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Il primo portale in Italia che raccoglie tutti gli eventi rental karting. 
            Dalle prime gare sprint ai campionati nazionali, tutto in un unico posto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 rounded-xl font-bold text-lg bg-racing-red text-white hover:bg-racing-orange transition-all shadow-[0_0_30px_rgba(255,51,102,0.4)] flex items-center justify-center gap-2 hover:-translate-y-1">
              <Search size={22} />
              Cerca Eventi
            </button>
            <button className="px-8 py-4 rounded-xl font-bold text-lg border border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 text-gray-300 hover:text-white">
              Guida per Neofiti
            </button>
          </div>
        </section>

        {/* Content Section */}
        <section id="events">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-heading text-3xl font-bold text-white">Prossime Gare In Evidenza</h2>
          </div>

          {/* Filters */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {filters.map(f => (
              <button 
                key={f}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                  activeFilter === f 
                    ? 'bg-racing-red border-racing-red text-white shadow-[0_0_15px_rgba(255,51,102,0.4)] scale-105' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse">
              <div className="w-12 h-12 border-4 border-racing-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Caricamento eventi in corso...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
              <Trophy size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-semibold text-gray-300">Nessun evento trovato</p>
              <p className="mt-2">Prova a cambiare i filtri di ricerca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-racing-red/10 flex flex-col cursor-pointer">
                  
                  {/* Decorative Glow inside the card */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-racing-red/20 blur-[50px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div className="p-6 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/5 to-transparent">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
                      event.event_type?.toLowerCase() === 'endurance' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {event.event_type || 'Sprint'}
                    </span>
                    {event.is_beginner_friendly && (
                      <span className="px-3 py-1 text-xs font-bold rounded-md bg-white/10 text-white border border-white/10 flex items-center gap-1 shadow-sm">
                        🏁 Neofiti
                      </span>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-heading text-xl font-bold mb-5 line-clamp-2 text-white group-hover:text-racing-red transition-colors duration-300">{event.title}</h3>
                    
                    <div className="flex flex-col gap-3 mt-auto mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin size={18} className="text-racing-orange opacity-80" />
                        <span className="font-medium text-gray-300">{event.track_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar size={18} className="text-racing-orange opacity-80" />
                        <span className="font-medium text-gray-300">{event.event_date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Settings size={18} className="text-racing-orange opacity-80" />
                        <span className="font-medium text-gray-300">{event.engine_info || 'Motore N/A'} <span className="opacity-50 mx-1">•</span> {event.price_info || 'N/A'}</span>
                      </div>
                    </div>

                    <button 
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-racing-red hover:border-racing-red transition-all duration-300 flex justify-between items-center group/btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(event.event_url) window.open(event.event_url, '_blank');
                      }}
                    >
                      Dettagli Evento
                      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
