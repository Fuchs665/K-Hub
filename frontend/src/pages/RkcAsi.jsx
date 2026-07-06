import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X, MapPin } from 'lucide-react';
import { getRkcAsiEvents } from '../lib/eventsRepository';
import { ITALIAN_REGIONS } from '../lib/constants';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';
import { formatEventDate } from '../lib/format';

// Classifica MOCK del campionato. Stessa forma dei futuri record aggregati da
// race_results (punti stagione + ultima gara) e lap_times (best lap): quando i
// dati reali esisteranno basta rimpiazzare MOCK_LEADERBOARD con la query, senza
// toccare la UI. Le tre viste ordinano lo stesso set su metriche diverse.
const MOCK_LEADERBOARD = [
  { id: 'p1', driver: 'M. Rossi',     team: 'Scuderia Cremona',        points: 218, lastPts: 18, lastPos: 2, bestLapMs: 62418, races: 9, wins: 4, podiums: 7 },
  { id: 'p2', driver: 'L. Bianchi',   team: 'Kart Team Lazio',         points: 205, lastPts: 12, lastPos: 4, bestLapMs: 61890, races: 9, wins: 3, podiums: 6 },
  { id: 'p3', driver: 'D. Furchia',   team: 'RKC Milano',              points: 197, lastPts: 25, lastPos: 1, bestLapMs: 61240, races: 9, wins: 2, podiums: 5 },
  { id: 'p4', driver: 'A. Verdi',     team: 'Sodi Racing',             points: 184, lastPts: 10, lastPos: 5, bestLapMs: 62960, races: 8, wins: 1, podiums: 4 },
  { id: 'p5', driver: 'G. Costa',     team: 'Pista Azzurra',           points: 162, lastPts: 15, lastPos: 3, bestLapMs: 62110, races: 9, wins: 0, podiums: 3 },
  { id: 'p6', driver: 'S. Marchetti', team: 'Kartodromo Val Vibrata',  points: 149, lastPts: 6,  lastPos: 7, bestLapMs: 63400, races: 7, wins: 0, podiums: 2 },
  { id: 'p7', driver: 'F. Greco',     team: '7 Laghi Kart',            points: 121, lastPts: 8,  lastPos: 6, bestLapMs: 62740, races: 8, wins: 0, podiums: 1 },
  { id: 'p8', driver: 'R. Neri',      team: 'South Garda Karting',     points: 98,  lastPts: 4,  lastPos: 8, bestLapMs: 63980, races: 6, wins: 0, podiums: 0 },
];

const VIEWS = [
  { key: 'general', label: 'Classifica generale' },
  { key: 'last',    label: 'Ultima gara' },
  { key: 'bestlap', label: 'Best lap' },
];

// Millisecondi -> M:SS.mmm (formato tempi RKC / Apex Timing).
function formatLap(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${m}:${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function RkcAsi() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [view, setView] = useState('general');
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const tabsRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getRkcAsiEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching RKC ASI events:', error);
      setErrorMsg('Impossibile caricare il calendario RKC ASI.');
    } finally {
      setLoading(false);
    }
  }

  // Conteggio tappe per regione, per evidenziare i tab con dati (come TracksDirectory).
  const regionCounts = useMemo(() => {
    const counts = {};
    for (const e of events) {
      if (e.region) counts[e.region] = (counts[e.region] || 0) + 1;
    }
    return counts;
  }, [events]);

  const regionsWithData = useMemo(() => Object.keys(regionCounts).length, [regionCounts]);

  const visibleEvents = useMemo(() => {
    if (!selectedRegion) return events;
    return events.filter(e => e.region === selectedRegion);
  }, [events, selectedRegion]);

  // Classifica ordinata secondo la vista attiva. La posizione e sempre l'indice
  // nell'ordinamento corrente, cosi il toggle rimescola visibilmente le righe.
  const rankedRows = useMemo(() => {
    const arr = [...MOCK_LEADERBOARD];
    if (view === 'general') arr.sort((a, b) => b.points - a.points);
    else if (view === 'last') arr.sort((a, b) => a.lastPos - b.lastPos);
    else arr.sort((a, b) => a.bestLapMs - b.bestLapMs);

    return arr.map((d, i) => {
      let value, label, isLap = false;
      if (view === 'general') { value = d.points; label = 'PTS'; }
      else if (view === 'last') { value = d.lastPts; label = 'PTS · ULTIMA'; }
      else { value = formatLap(d.bestLapMs); label = 'BEST LAP'; isLap = true; }
      return { ...d, pos: i + 1, value, label, isLap };
    });
  }, [view]);

  // Posizione in classifica generale per il pannello dettaglio (indipendente dalla vista).
  const generalRank = useMemo(() => {
    const map = {};
    [...MOCK_LEADERBOARD].sort((a, b) => b.points - a.points).forEach((d, i) => { map[d.id] = i + 1; });
    return map;
  }, []);

  const selectedDriver = MOCK_LEADERBOARD.find(d => d.id === selectedDriverId) || null;

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const amount = 220;
      tabsRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleSelectRegion = (name) => setSelectedRegion(prev => (prev === name ? null : name));
  const toggleDriver = (id) => setSelectedDriverId(prev => (prev === id ? null : id));

  return (
    <div className="rkc-page">
      {/* ---------- HERO: header campionato ---------- */}
      <HudFrame className="rkc-hero" style={{ '--hud-size': '30px', '--hud-inset': '20px' }}>
        <div className="khub-bg" aria-hidden="true">
          <div className="khub-bg-grid" />
          <div className="khub-bg-speed" />
          <div className="khub-bg-grain" />
        </div>

        <div className="rkc-hero-inner">
          <SectionEyebrow className="rkc-hero-eyebrow">
            Rental Kart Championship — ASI · Season 2026
          </SectionEyebrow>
          <h1 className="rkc-title">RKC <em>ASI</em></h1>
          <p className="rkc-subtitle">
            Il campionato di rental karting verso le finali nazionali ASI. Segui la classifica gara
            dopo gara, i migliori giri e il calendario delle tappe nella tua regione.
          </p>
          <div className="rkc-hero-stats">
            <div className="rkc-stat"><b>{loading ? '—' : events.length}</b><span>Tappe in calendario</span></div>
            <div className="rkc-stat"><b>{loading ? '—' : regionsWithData}</b><span>Regioni coinvolte</span></div>
            <div className="rkc-stat"><b>2026</b><span>Stagione</span></div>
          </div>
        </div>
      </HudFrame>

      {/* ---------- BOARD CAMPIONATO (mock) ---------- */}
      <section className="rkc-section container">
        <div className="rkc-section-head">
          <div>
            <SectionEyebrow className="rkc-section-eyebrow">Standing di campionato</SectionEyebrow>
            <h2 className="rkc-section-title">Classifica</h2>
          </div>
          <div className="rkc-toggle" role="tablist" aria-label="Vista classifica">
            {VIEWS.map(v => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view === v.key}
                className={`rkc-toggle-btn ${view === v.key ? 'active' : ''}`.trim()}
                onClick={() => setView(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rkc-board" key={view}>
          {rankedRows.map(r => (
            <button
              key={r.id}
              className={`rkc-row ${selectedDriverId === r.id ? 'selected' : ''}`.trim()}
              onClick={() => toggleDriver(r.id)}
              aria-expanded={selectedDriverId === r.id}
            >
              <span className="rkc-pos">{r.pos}</span>
              <span className="rkc-drv">
                {r.driver}
                <small>{r.team}</small>
              </span>
              <span className={`rkc-val ${r.isLap ? 'is-lap' : ''}`.trim()}>
                {r.value}
                <small>{r.label}</small>
              </span>
            </button>
          ))}
        </div>

        {selectedDriver && (
          <HudFrame className="rkc-detail" corners={['tl', 'br']}>
            <div className="rkc-detail-head">
              <div>
                <div className="rkc-detail-name">{selectedDriver.driver}</div>
                <div className="rkc-detail-team">{selectedDriver.team}</div>
              </div>
              <button className="rkc-detail-close" onClick={() => setSelectedDriverId(null)} aria-label="Chiudi dettaglio pilota">
                <X size={18} />
              </button>
            </div>
            <div className="rkc-detail-grid">
              <div className="rkc-tile"><b>#{generalRank[selectedDriver.id]}</b><span>Posizione</span></div>
              <div className="rkc-tile"><b>{selectedDriver.points}</b><span>Punti</span></div>
              <div className="rkc-tile"><b>{selectedDriver.races}</b><span>Gare</span></div>
              <div className="rkc-tile"><b>{selectedDriver.wins}</b><span>Vittorie</span></div>
              <div className="rkc-tile"><b>{selectedDriver.podiums}</b><span>Podi</span></div>
              <div className="rkc-tile is-lap"><b>{formatLap(selectedDriver.bestLapMs)}</b><span>Miglior giro</span></div>
            </div>
          </HudFrame>
        )}

        <p className="rkc-mock-note">
          // Dati dimostrativi — la classifica ufficiale sarà popolata dai risultati reali a stagione avviata
        </p>
      </section>

      {/* ---------- CALENDARIO TAPPE (dati reali per regione) ---------- */}
      <section className="rkc-section container">
        <div className="rkc-section-head">
          <div>
            <SectionEyebrow className="rkc-section-eyebrow">Verso le finali nazionali</SectionEyebrow>
            <h2 className="rkc-section-title">
              {selectedRegion ? `Tappe in ${selectedRegion}` : 'Calendario tappe'}
            </h2>
          </div>
          {selectedRegion && (
            <button className="rkc-tab active" onClick={() => setSelectedRegion(null)}>
              <X size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Tutte le regioni
            </button>
          )}
        </div>

        {/* Tab regione con frecce di scroll */}
        <div className="rkc-tabs-wrap">
          <button onClick={() => scrollTabs('left')} className="rkc-scroll-btn" aria-label="Scorri regioni a sinistra">
            <ChevronLeft size={20} />
          </button>
          <div className="rkc-tabs no-scrollbar" ref={tabsRef}>
            {ITALIAN_REGIONS.map(region => (
              <button
                key={region}
                onClick={() => handleSelectRegion(region)}
                className={`rkc-tab ${regionCounts[region] ? 'has-data' : ''} ${selectedRegion === region ? 'active' : ''}`.replace(/\s+/g, ' ').trim()}
              >
                {region}{regionCounts[region] ? ` (${regionCounts[region]})` : ''}
              </button>
            ))}
          </div>
          <button onClick={() => scrollTabs('right')} className="rkc-scroll-btn" aria-label="Scorri regioni a destra">
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="khub-events-grid">
            {[0, 1, 2].map(i => (
              <div className="khub-event-card" key={i} aria-hidden="true">
                <span className="khub-skel" style={{ width: '40%' }} />
                <span className="khub-skel" style={{ width: '85%', height: '22px' }} />
                <span className="khub-skel" style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="rkc-error">{errorMsg}</div>
        ) : visibleEvents.length === 0 ? (
          <div className="rkc-empty">
            {selectedRegion
              ? `// Nessuna tappa RKC ASI confermata in ${selectedRegion} al momento`
              : '// Calendario tappe in arrivo — le date ufficiali appariranno qui appena confermate'}
          </div>
        ) : (
          <div className="khub-events-grid">
            {visibleEvents.map(ev => {
              const inner = (
                <>
                  <div className="khub-event-top">
                    <span className={`khub-event-tag ${ev.event_type?.toLowerCase() === 'sprint' ? 'is-sprint' : 'is-endurance'}`}>
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
                  <span className="khub-event-cta">
                    {ev.source_url ? 'Dettagli & iscrizione ▸' : 'Classifica & tempi ▸'}
                  </span>
                </>
              );
              // Per le tappe RKC il valore e il link esterno alla pagina evento (scelta Step 7);
              // fallback alla scheda interna se manca il source_url.
              return ev.source_url ? (
                <a key={ev.id} href={ev.source_url} target="_blank" rel="noreferrer" className="khub-event-card">
                  {inner}
                </a>
              ) : (
                <Link key={ev.id} to={`/event/${ev.id}`} className="khub-event-card">
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default RkcAsi;
