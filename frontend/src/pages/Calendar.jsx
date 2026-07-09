import React, { useEffect, useMemo, useState } from 'react';
import { Flag, X, List, CalendarDays, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getEvents } from '../lib/eventsRepository';
import { ITALIAN_REGIONS } from '../lib/constants';
import { parseEventDate, formatEventDate } from '../lib/format';
import EventCard, { EventCardSkeleton } from '../components/EventCard';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';

const PAGE_SIZE = 20;
const MONTH_FETCH_SIZE = 1000; // vista mese: prende tutti gli eventi filtrati, raggruppati client-side per giorno
const ITALIAN_MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildFilterParams({ filterRegion, filterType, filterKart, filterFormat }) {
  return {
    region: filterRegion,
    eventType: filterType,
    engineType: filterKart,
    format: filterFormat === 'CAMPIONATO' ? 'campionato' : (filterFormat === 'GARA SINGOLA' ? 'gara_singola' : 'ALL'),
  };
}

// Bucket relativi a oggi: passato / oggi / weekend / prossima settimana / questo mese / mese successivo / più avanti.
function getEventBucket(event, today) {
  const date = parseEventDate(event.event_date);
  if (!date) return 'Più avanti';
  const day = startOfDay(date);
  const diffDays = Math.round((day - today) / 86400000);

  if (diffDays < 0) return 'Eventi passati';
  if (diffDays === 0) return 'Oggi';

  const weekday = today.getDay(); // 0=Dom..6=Sab
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);
  const thisSaturday = new Date(thisMonday);
  thisSaturday.setDate(thisMonday.getDate() + 5);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  const nextSunday = new Date(thisMonday);
  nextSunday.setDate(thisMonday.getDate() + 13);

  if (day >= thisSaturday && day <= thisSunday) return 'Questo weekend';
  if (day >= nextMonday && day <= nextSunday) return 'Prossima settimana';
  if (day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth()) return 'Questo mese';

  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  if (day.getFullYear() === nextMonthDate.getFullYear() && day.getMonth() === nextMonthDate.getMonth()) {
    return ITALIAN_MONTHS[nextMonthDate.getMonth()];
  }

  return 'Più avanti';
}

function groupEventsByBucket(events) {
  const today = startOfDay(new Date());
  const nextMonthLabel = ITALIAN_MONTHS[(today.getMonth() + 1) % 12];
  const order = ['Eventi passati', 'Oggi', 'Questo weekend', 'Prossima settimana', 'Questo mese', nextMonthLabel, 'Più avanti'];

  const buckets = new Map();
  for (const event of events) {
    const key = getEventBucket(event, today);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(event);
  }

  return order.filter(key => buckets.has(key)).map(key => ({ label: key, events: buckets.get(key) }));
}

// Griglia mese (Lun→Dom) con celle di padding per allineare la settimana.
function buildMonthMatrix(monthCursor, eventsByDay) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Lun..6=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ key: `pad-lead-${i}`, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const iso = toIsoDate(dateObj);
    cells.push({ key: iso, iso, day: d, events: eventsByDay.get(iso) || [] });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `pad-trail-${cells.length}`, outside: true });
  }
  return cells;
}

function Calendar() {
  const [view, setView] = useState('list'); // 'list' | 'month'

  // Vista lista
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [page, setPage] = useState(1);

  // Vista mese
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [monthEvents, setMonthEvents] = useState([]);
  const [monthLoading, setMonthLoading] = useState(true);
  const [monthErrorMsg, setMonthErrorMsg] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  // Filtri
  const [filterType, setFilterType] = useState('ALL');
  const [filterKart, setFilterKart] = useState('ALL');
  const [filterFormat, setFilterFormat] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterKart, filterFormat, filterRegion, page]);

  useEffect(() => {
    if (view !== 'month') return;
    fetchMonthEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, filterType, filterKart, filterFormat, filterRegion, monthCursor]);

  async function fetchEvents() {
    try {
      setLoading(true);
      setErrorMsg('');
      const { events: data, total: count } = await getEvents({
        ...buildFilterParams({ filterRegion, filterType, filterKart, filterFormat }),
        page,
        pageSize: PAGE_SIZE,
      });
      setEvents(data);
      setTotal(count);
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMsg('Impossibile caricare gli eventi.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMonthEvents() {
    try {
      setMonthLoading(true);
      setMonthErrorMsg('');
      const { events: data } = await getEvents({
        ...buildFilterParams({ filterRegion, filterType, filterKart, filterFormat }),
        page: 1,
        pageSize: MONTH_FETCH_SIZE,
      });
      setMonthEvents(data);
    } catch (error) {
      console.error('Error fetching month events:', error);
      setMonthErrorMsg('Impossibile caricare gli eventi del mese.');
    } finally {
      setMonthLoading(false);
    }
  }

  const eventTypes = ['ALL', 'Sprint', 'Endurance', 'Ironman'];
  const kartTypes = ['ALL', '4 Tempi Racing', '4 Tempi Rental', '2 Tempi Rental', '2 Tempi Racing'];
  const regions = ['ALL', ...ITALIAN_REGIONS];
  const formats = ['ALL', 'GARA SINGOLA', 'CAMPIONATO'];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectFilterType = (type) => {
    setFilterType(type);
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const activeFilters = [
    filterType !== 'ALL' && { id: 'type', label: filterType, clear: () => selectFilterType('ALL') },
    filterKart !== 'ALL' && { id: 'kart', label: filterKart, clear: () => { setFilterKart('ALL'); setPage(1); } },
    filterFormat !== 'ALL' && { id: 'format', label: filterFormat, clear: () => { setFilterFormat('ALL'); setPage(1); } },
    filterRegion !== 'ALL' && { id: 'region', label: filterRegion, clear: () => { setFilterRegion('ALL'); setPage(1); } },
  ].filter(Boolean);

  const advancedCount = [filterKart, filterFormat, filterRegion].filter(v => v !== 'ALL').length;

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterKart('ALL');
    setFilterFormat('ALL');
    setFilterRegion('ALL');
    setPage(1);
  };

  const todayIso = toIsoDate(startOfDay(new Date()));

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of monthEvents) {
      const date = parseEventDate(event.event_date);
      if (!date) continue;
      if (date.getFullYear() !== monthCursor.getFullYear() || date.getMonth() !== monthCursor.getMonth()) continue;
      const iso = toIsoDate(date);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(event);
    }
    return map;
  }, [monthEvents, monthCursor]);

  const monthCells = useMemo(() => buildMonthMatrix(monthCursor, eventsByDay), [monthCursor, eventsByDay]);
  const monthLabel = monthCursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();

  const goToPrevMonth = () => {
    setMonthCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    setSelectedDay(null);
  };
  const goToNextMonth = () => {
    setMonthCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    setSelectedDay(null);
  };
  const goToCurrentMonth = () => {
    setMonthCursor(startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    setSelectedDay(null);
  };

  const selectDay = (iso) => {
    setSelectedDay(prev => (prev === iso ? null : iso));
  };

  return (
    <div className="rkc-page cal-page">
      {/* ---------- HERO: header calendario ---------- */}
      <HudFrame className="rkc-hero cal-hero" style={{ '--hud-size': '30px', '--hud-inset': '20px' }}>
        <div className="khub-bg" aria-hidden="true">
          <div className="khub-bg-grid" />
          <div className="khub-bg-speed" />
          <div className="khub-bg-grain" />
        </div>

        <div className="rkc-hero-inner">
          <SectionEyebrow className="rkc-hero-eyebrow">
            Season 2026 · Tutte le gare in Italia
          </SectionEyebrow>
          <h1 className="rkc-title">Calendario <em>Gare</em></h1>
          <p className="rkc-subtitle">
            Trova le tue prossime sfide. Usa i filtri per affinare la ricerca.
          </p>
        </div>
      </HudFrame>

      <section className="rkc-section container">
      {/* Barra filtri principale + toggle vista */}
      <div className="calendar-toolbar">
        <div className="filters-bar no-scrollbar" style={{ flex: '1 1 260px' }}>
          {eventTypes.map(type => (
            <button
              key={type}
              className={`filter-chip ${filterType === type ? 'active' : ''}`}
              onClick={() => selectFilterType(type)}
            >
              {type === 'ALL' ? 'Tutte' : type}
            </button>
          ))}
        </div>

        <button
          className="btn-outline-snappy"
          style={{ fontSize: '0.8rem', flexShrink: 0 }}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <SlidersHorizontal size={16} /> Filtri avanzati{advancedCount > 0 ? ` (${advancedCount})` : ''}
          <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <div className="rkc-toggle" role="tablist" aria-label="Vista calendario">
          <button role="tab" aria-selected={view === 'list'} className={`rkc-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            <List size={15} /> Lista
          </button>
          <button role="tab" aria-selected={view === 'month'} className={`rkc-toggle-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>
            <CalendarDays size={15} /> Mese
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="advanced-filters-panel">
          <SectionEyebrow as="div" className="rkc-section-eyebrow cal-panel-eyebrow">
            Filtri avanzati
          </SectionEyebrow>

          <div className="filter-group" style={{ flex: '1 1 200px' }}>
            <label htmlFor="filter-kart" className="cal-filter-label">Tipo Kart</label>
            <select
              id="filter-kart"
              className="cal-select"
              value={filterKart}
              onChange={handleFilterChange(setFilterKart)}
            >
              {kartTypes.map(kart => <option key={kart} value={kart}>{kart}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ flex: '1 1 200px' }}>
            <label htmlFor="filter-format" className="cal-filter-label">Formato</label>
            <select
              id="filter-format"
              className="cal-select"
              value={filterFormat}
              onChange={handleFilterChange(setFilterFormat)}
            >
              {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ flex: '1 1 200px' }}>
            <label htmlFor="filter-region" className="cal-filter-label">Regione</label>
            <select
              id="filter-region"
              className="cal-select"
              value={filterRegion}
              onChange={handleFilterChange(setFilterRegion)}
            >
              {regions.map(reg => <option key={reg} value={reg}>{reg}</option>)}
            </select>
          </div>
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="active-filters-row">
          {activeFilters.map(f => (
            <span key={f.id} className="active-filter-pill">
              {f.label}
              <button onClick={f.clear} aria-label={`Rimuovi filtro ${f.label}`}>
                <X size={12} />
              </button>
            </span>
          ))}
          <button className="btn-outline-snappy" style={{ fontSize: '0.75rem', padding: '5px 10px' }} onClick={resetFilters}>
            Azzera tutti
          </button>
        </div>
      )}

      {view === 'list' ? (
        loading ? (
          <div className="events-grid">
            {Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : errorMsg ? (
          <div className="rkc-error">{errorMsg}</div>
        ) : (
          <>
            <SectionEyebrow as="div" className="rkc-section-eyebrow">
              {total} {total === 1 ? 'gara trovata' : 'gare trovate'}
            </SectionEyebrow>

            {events.length === 0 ? (
              <div className="empty-state">
                <Flag size={40} />
                <h3>Nessuna gara trovata</h3>
                <p>Prova ad allargare i filtri di ricerca.</p>
                {activeFilters.length > 0 && (
                  <button className="btn-snappy" style={{ marginTop: '12px', fontSize: '0.9rem' }} onClick={resetFilters}>
                    Azzera filtri
                  </button>
                )}
              </div>
            ) : (
              groupEventsByBucket(events).map(group => (
                <div key={group.label} className="date-group">
                  <h3 className="date-group-heading">{group.label}</h3>
                  <div className="events-grid">
                    {group.events.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
                <button
                  className="btn-outline-snappy"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Precedente
                </button>
                <span className="font-mono">Pagina {page} di {totalPages}</span>
                <button
                  className="btn-outline-snappy"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Successiva
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <>
          <div className="month-nav">
            <button className="rkc-scroll-btn" onClick={goToPrevMonth} aria-label="Mese precedente">
              <ChevronLeft size={20} />
            </button>
            <h2 className="month-nav-label">{monthLabel}</h2>
            <button className="rkc-scroll-btn" onClick={goToNextMonth} aria-label="Mese successivo">
              <ChevronRight size={20} />
            </button>
            <button className="btn-outline-snappy" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={goToCurrentMonth}>
              Oggi
            </button>
          </div>

          {monthLoading ? (
            <div className="rkc-empty">// CARICAMENTO CALENDARIO...</div>
          ) : monthErrorMsg ? (
            <div className="rkc-error">{monthErrorMsg}</div>
          ) : (
            <>
              <div className="month-grid">
                {WEEKDAY_LABELS.map(w => <div key={w} className="month-grid-weekday">{w}</div>)}
                {monthCells.map(cell => cell.outside ? (
                  <div key={cell.key} className="month-cell outside" />
                ) : (
                  <button
                    key={cell.key}
                    type="button"
                    className={[
                      'month-cell',
                      cell.events.length > 0 ? 'has-events' : '',
                      cell.iso === selectedDay ? 'selected' : '',
                      cell.iso === todayIso ? 'is-today' : '',
                    ].filter(Boolean).join(' ')}
                    disabled={cell.events.length === 0}
                    onClick={() => selectDay(cell.iso)}
                  >
                    <span className="month-cell-day">{cell.day}{cell.iso === todayIso ? ' • Oggi' : ''}</span>
                    {cell.events.slice(0, 2).map(e => (
                      <span key={e.id} className={`month-cell-event ${e.event_type?.toLowerCase() === 'sprint' ? 'evt-sprint' : 'evt-endurance'}`}>
                        {e.title}
                      </span>
                    ))}
                    {cell.events.length > 2 && (
                      <span className="month-cell-more">+{cell.events.length - 2} altre</span>
                    )}
                  </button>
                ))}
              </div>

              {eventsByDay.size === 0 && (
                <div className="empty-state">
                  <Flag size={40} />
                  <h3>Nessuna gara in questo mese</h3>
                  <p>Prova a cambiare mese o ad allargare i filtri.</p>
                </div>
              )}

              {selectedDay && (
                <div className="month-selected-panel">
                  <div className="rkc-section-head">
                    <h2 className="rkc-section-title" style={{ fontSize: '1.4rem', margin: 0 }}>{formatEventDate(selectedDay)}</h2>
                    <button className="rkc-tab active" onClick={() => setSelectedDay(null)}>
                      <X size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Chiudi
                    </button>
                  </div>
                  <div className="events-grid">
                    {(eventsByDay.get(selectedDay) || []).map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
      </section>
    </div>
  );
}

export default Calendar;
