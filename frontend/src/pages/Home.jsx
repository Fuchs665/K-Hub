import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getUpcomingEvents, getUpcomingEventsCount } from '../lib/eventsRepository';
import { getTracksCount } from '../lib/tracksRepository';
import GameMenu from '../components/GameMenu';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';
import { formatEventDate } from '../lib/format';

// Voci del command center → route reali (le 5 sezioni principali del mockup).
const MENU_ITEMS = [
  { label: 'Calendario Gare', to: '/calendar' },
  { label: 'RKC ASI', to: '/rkc-asi' },
  { label: "Piste d'Italia", to: '/tracks' },
  { label: 'Dashboard Pilota', to: '/dashboard' },
  { label: 'Area Organizzatori', to: '/organizer' },
];

// Classifica MOCK: stessa forma dei futuri record (pos/pilota/team/punti) così
// lo switch ai dati reali da race_results sarà indolore (brief §4).
const MOCK_STANDINGS = [
  { pos: 1, driver: 'M. Rossi', team: 'SCUDERIA CREMONA', points: 218 },
  { pos: 2, driver: 'L. Bianchi', team: 'KART TEAM LAZIO', points: 205 },
  { pos: 3, driver: 'D. Furchia', team: 'RKC MILANO', points: 197 },
  { pos: 4, driver: 'A. Verdi', team: 'SODI RACING', points: 184 },
];

function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: null, tracks: null });

  useEffect(() => {
    (async () => {
      try {
        const [events, count, tracks] = await Promise.all([
          getUpcomingEvents(3),
          getUpcomingEventsCount(),
          getTracksCount(),
        ]);
        setUpcomingEvents(events);
        setStats({ events: count, tracks });
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const evTxt = stats.events != null ? stats.events : '—';
  const trTxt = stats.tracks != null ? stats.tracks : '—';

  // Pannelli contestuali (uno per voce di menu). L'eyebrow del calendario usa
  // i conteggi reali; il board RKC usa MOCK_STANDINGS.
  const panels = [
    {
      eyebrow: `${evTxt} eventi · ${trTxt} piste`,
      title: <>Il calendario<br />nazionale</>,
      body: 'Tutte le gare rental in un unico posto. Filtra per pista, formato e tipo di kart. Un click per iscriverti, uno per aggiungere al tuo calendario.',
    },
    {
      eyebrow: 'Rental Kart Championship — ASI',
      title: <>Classifica<br />campionato</>,
      body: 'Il board interattivo del campionato: standing live, best lap e distacchi, aggiornati gara dopo gara.',
      board: true,
    },
    {
      eyebrow: 'Directory circuiti',
      title: <>Le piste<br />d'Italia</>,
      body: 'Mappa interattiva dei kartodromi: regolamenti, layout, tipi di kart e link diretti. Scegli dove correre.',
    },
    {
      eyebrow: 'Telemetria personale · powered by Racesense',
      title: <>Il tuo<br />profilo pilota</>,
      body: (
        <>
          Gare disputate, podi, best lap assoluto. In futuro con upload dei tempi sul giro e dati
          telemetria: <span className="khub-lap">1:02.418</span> — il tuo miglior giro, tracciato per sempre.
        </>
      ),
    },
    {
      eyebrow: 'Per gli organizzatori',
      title: <>Pubblica<br />il tuo evento</>,
      body: "Sei un kartodromo o un organizzatore? Inserisci le tue gare in 60 secondi e raggiungi tutti i piloti d'Italia. Gratis.",
    },
  ];

  return (
    <div className="khub-home">
      {/* ---------- HERO: command center ---------- */}
      <HudFrame className="khub-hero" style={{ '--hud-size': '34px', '--hud-inset': '22px' }}>
        {/* sfondo animato */}
        <div className="khub-bg" aria-hidden="true">
          <div className="khub-bg-grid" />
          <div className="khub-bg-speed" />
          <div className="khub-bg-grain" />
        </div>

        {/* striscia HUD in alto */}
        <div className="khub-hud-top" aria-hidden="true">
          <span>SYS // K-HUB_OS v0.1 · ITALIA</span>
          <span className="khub-hud-live">● <span className="khub-blink">LIVE</span> · SEASON 2026</span>
        </div>

        {/* colonna sinistra: brand + menu */}
        <div className="khub-col-left">
          <div className="khub-brand">
            <div className="khub-brand-k">K-HUB</div>
            <div className="khub-brand-sub">Rental Karting · Command Center</div>
          </div>
          <GameMenu items={MENU_ITEMS} onActiveChange={setActiveIndex} className="khub-menu" />
        </div>

        {/* colonna destra: pannello contestuale */}
        <div className="khub-panel-wrap">
          {panels.map((p, i) => (
            <section key={p.eyebrow} className={`khub-panel ${activeIndex === i ? 'show' : ''}`.trim()}>
              <div className="khub-card">
                <SectionEyebrow className="khub-eyebrow">{p.eyebrow}</SectionEyebrow>
                <h2 className="khub-card-title">{p.title}</h2>
                <p className="khub-card-body">{p.body}</p>
                {p.board && (
                  <div className="khub-board" key={activeIndex}>
                    {MOCK_STANDINGS.map((s) => (
                      <div className="khub-row" key={s.pos}>
                        <span className="khub-pos">{s.pos}</span>
                        <span className="khub-drv">
                          {s.driver}
                          <small>{s.team}</small>
                        </span>
                        <span className="khub-pts">
                          {s.points}
                          <span>PTS</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* hint navigazione */}
        <div className="khub-hint" aria-hidden="true">
          NAV <b>↑</b> <b>↓</b> · SELECT <b>ENTER</b> — o passa il mouse
        </div>
      </HudFrame>

      {/* ---------- PROSSIMI EVENTI (dark) ---------- */}
      <section className="khub-events container">
        <div className="khub-events-head">
          <h2>Prossimi Eventi</h2>
          <Link to="/calendar">Vedi tutti →</Link>
        </div>

        {loading ? (
          <div className="khub-events-grid">
            {[0, 1, 2].map((i) => (
              <div className="khub-event-card" key={i} aria-hidden="true">
                <span className="khub-skel" style={{ width: '40%' }} />
                <span className="khub-skel" style={{ width: '85%', height: '22px' }} />
                <span className="khub-skel" style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="khub-events-empty">// NESSUN EVENTO IN ARRIVO — TORNA A TROVARCI PRESTO</div>
        ) : (
          <div className="khub-events-grid">
            {upcomingEvents.map((ev) => (
              <Link to={`/event/${ev.id}`} className="khub-event-card" key={ev.id}>
                <div className="khub-event-top">
                  <span
                    className={`khub-event-tag ${ev.event_type?.toLowerCase() === 'sprint' ? 'is-sprint' : 'is-endurance'}`}
                  >
                    {ev.event_type || 'GARA'}
                  </span>
                  <span className="khub-event-date">{formatEventDate(ev.event_date)}</span>
                </div>
                <h3 className="khub-event-title">{ev.title}</h3>
                {ev.track_name && (
                  <div className="khub-event-track">
                    <MapPin size={14} /> {ev.track_name}
                  </div>
                )}
                <span className="khub-event-cta">Classifica &amp; tempi ▸</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
