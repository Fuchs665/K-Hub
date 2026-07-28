import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X, MapPin } from 'lucide-react';
import { getRkcAsiEvents } from '../lib/eventsRepository';
import { ITALIAN_REGIONS } from '../lib/constants';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';
import { formatEventDate } from '../lib/format';

function RkcAsi() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
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

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const amount = 220;
      tabsRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleSelectRegion = (name) => setSelectedRegion(prev => (prev === name ? null : name));

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
            Il campionato di rental karting verso le finali nazionali ASI. Qui trovi il calendario
            delle tappe regione per regione; classifica e migliori giri arriveranno a stagione avviata.
          </p>
          <div className="rkc-hero-stats">
            <div className="rkc-stat"><b>{loading ? '—' : events.length}</b><span>Tappe in calendario</span></div>
            <div className="rkc-stat"><b>{loading ? '—' : regionsWithData}</b><span>Regioni coinvolte</span></div>
            <div className="rkc-stat"><b>2026</b><span>Stagione</span></div>
          </div>
        </div>
      </HudFrame>

      {/* ---------- CLASSIFICA (placeholder: nessun dato reale) ----------
           Il board e il pannello dettaglio pilota vivevano su un set di piloti
           inventati: rimossi. Le classi .rkc-board/.rkc-row/.rkc-detail/.rkc-tile
           restano in index.css perche' le usano EventDetails e Dashboard, quindi
           quando ci saranno risultati veri da race_results il markup si rimonta
           uguale. */}
      <section className="rkc-section container">
        <div className="rkc-section-head">
          <div>
            <SectionEyebrow className="rkc-section-eyebrow">Standing di campionato</SectionEyebrow>
            <h2 className="rkc-section-title">Classifica</h2>
          </div>
        </div>

        <div className="khub-board-soon">// CLASSIFICA CAMPIONATO — DATI IN ARRIVO A STAGIONE AVVIATA</div>
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
