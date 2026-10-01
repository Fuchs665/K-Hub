import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { getEvents, getEventFacets } from '../lib/eventsRepository';
import { parseEventDate, formatLongDate } from '../lib/format';
import { ITALIAN_MONTHS, startOfDay, toIsoDate, groupEventsByBucket, groupByMonth } from '../lib/eventBuckets';
import { cleanEventTitle } from '../lib/eventTitle';
import EventRow, { EventGroups } from '../components/kh/EventRow';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const PAGE_SIZE = 20;
const MONTH_FETCH_SIZE = 500;
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const FORMATS = [
  { value: 'ALL', label: 'Tutte' },
  { value: 'Sprint', label: 'Sprint' },
  { value: 'Endurance', label: 'Endurance' },
  { value: 'Ironman', label: 'Ironman' },
];
const RACE_KINDS = [
  { value: 'ALL', label: 'Gare singole e campionati' },
  { value: 'gara_singola', label: 'Solo gare singole' },
  { value: 'campionato', label: 'Solo campionati' },
];

// I filtri vivono nell'URL, così una ricerca si può condividere:
// /calendar?formato=Sprint&regione=Lombardia&kart=Rental&tipo=campionato&quando=passate&vista=mese&mese=2026-10
const DEFAULTS = { formato: 'ALL', regione: 'ALL', kart: 'ALL', tipo: 'ALL', quando: 'programma', vista: 'lista', mese: '' };

function readFilters(params) {
  return Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => [key, params.get(key) || fallback]));
}

function currentYm() {
  return toIsoDate(new Date()).slice(0, 7);
}

function shiftYm(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  return toIsoDate(new Date(y, m - 1 + delta, 1)).slice(0, 7);
}

function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  return { first, from: toIsoDate(first), to: toIsoDate(last), label: `${ITALIAN_MONTHS[m - 1]} ${y}` };
}

// Griglia del mese da lunedì a domenica, con celle vuote ai bordi.
function buildMonthCells(first, eventsByDay) {
  const cells = [];
  const lead = (first.getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) cells.push({ key: `lead-${i}` });
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const iso = toIsoDate(new Date(first.getFullYear(), first.getMonth(), d));
    cells.push({ key: iso, iso, day: d, events: eventsByDay.get(iso) || [] });
  }
  while (cells.length % 7 !== 0) cells.push({ key: `trail-${cells.length}` });
  return cells;
}

function SkeletonRows() {
  return (
    <div className="kh-event-list" aria-label="Caricamento delle gare">
      {[0, 1, 2, 3].map((i) => (
        <div className="kh-skel-row" key={i} aria-hidden="true">
          <span className="kh-skel" style={{ width: 72, height: 78 }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <span className="kh-skel" style={{ width: '55%', height: 20 }} />
            <span className="kh-skel" style={{ width: '30%', height: 14 }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Calendar() {
  useDocumentTitle('Calendario gare, K-Hub');
  const [params, setParams] = useSearchParams();
  const f = readFilters(params);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [facets, setFacets] = useState({ regions: [], engineTypes: [] });

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === DEFAULTS[key]) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  }

  useEffect(() => {
    getEventFacets().then(setFacets).catch((error) => console.error('Errore nel caricare i filtri:', error));
  }, []);

  const query = { region: f.regione, eventType: f.formato, engineType: f.kart, format: f.tipo };
  const filterKey = `${f.regione}|${f.formato}|${f.kart}|${f.tipo}`;
  const past = f.quando === 'passate';

  // ---- Vista lista: pagina 1 al cambio filtri, poi "Mostra altre gare" in coda.
  const listKey = `${filterKey}|${f.quando}`;
  const [request, setRequest] = useState({ key: listKey, page: 1 });
  if (request.key !== listKey) setRequest({ key: listKey, page: 1 });
  const [list, setList] = useState({ events: [], total: 0, status: 'loading' });

  useEffect(() => {
    if (f.vista !== 'lista') return undefined;
    let alive = true;
    setList((l) => ({ ...l, status: request.page === 1 ? 'loading' : 'more' }));
    getEvents({ ...query, when: past ? 'past' : 'upcoming', page: request.page, pageSize: PAGE_SIZE })
      .then(({ events, total }) => {
        if (!alive) return;
        setList((l) => ({ events: request.page === 1 ? events : [...l.events, ...events], total, status: 'ready' }));
      })
      .catch((error) => {
        console.error('Errore nel caricare le gare:', error);
        if (alive) setList((l) => ({ ...l, status: 'error' }));
      });
    return () => { alive = false; };
    // query e past sono già dentro request.key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, f.vista]);

  // ---- Vista mese
  const ym = /^\d{4}-\d{2}$/.test(f.mese) ? f.mese : currentYm();
  const month = monthRange(ym);
  const monthKey = `${filterKey}|${ym}`;
  const [monthData, setMonthData] = useState({ key: null, events: [], status: 'loading' });
  const [selected, setSelected] = useState({ ym: null, iso: null });
  const selectedDay = selected.ym === ym ? selected.iso : null;

  useEffect(() => {
    if (f.vista !== 'mese') return undefined;
    let alive = true;
    setMonthData((m) => ({ ...m, status: 'loading' }));
    getEvents({ ...query, from: month.from, to: month.to, page: 1, pageSize: MONTH_FETCH_SIZE })
      .then(({ events }) => { if (alive) setMonthData({ key: monthKey, events, status: 'ready' }); })
      .catch((error) => {
        console.error('Errore nel caricare il mese:', error);
        if (alive) setMonthData((m) => ({ ...m, status: 'error' }));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, f.vista]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of monthData.events) {
      const d = parseEventDate(event.event_date);
      if (!d) continue;
      const iso = toIsoDate(d);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(event);
    }
    return map;
  }, [monthData.events]);
  const cells = buildMonthCells(month.first, eventsByDay);
  const todayIso = toIsoDate(startOfDay(new Date()));
  const dayGroups = [...eventsByDay.keys()].sort().map((iso) => ({ label: formatLongDate(iso), events: eventsByDay.get(iso) }));

  // ---- Filtri attivi e conteggio
  const kindLabel = RACE_KINDS.find((k) => k.value === f.tipo)?.label;
  const active = [
    f.formato !== 'ALL' && { key: 'formato', label: f.formato },
    f.regione !== 'ALL' && { key: 'regione', label: f.regione },
    f.kart !== 'ALL' && { key: 'kart', label: `Kart: ${f.kart}` },
    f.tipo !== 'ALL' && { key: 'tipo', label: kindLabel },
  ].filter(Boolean);
  const extraCount = [f.regione, f.kart, f.tipo].filter((v) => v !== 'ALL').length;
  const resetAll = () => update({ formato: 'ALL', regione: 'ALL', kart: 'ALL', tipo: 'ALL' });

  const withCurrent = (values, current) => (current !== 'ALL' && !values.includes(current) ? [...values, current] : values);
  const regions = withCurrent(facets.regions, f.regione);
  const engineTypes = withCurrent(facets.engineTypes, f.kart);

  let count = null;
  let countLabel = '';
  if (f.vista === 'lista' && list.status !== 'loading' && list.status !== 'error') {
    count = list.total;
    countLabel = past ? (count === 1 ? 'gara passata' : 'gare passate') : (count === 1 ? 'gara in programma' : 'gare in programma');
  } else if (f.vista === 'mese' && monthData.status === 'ready') {
    count = monthData.events.length;
    countLabel = `${count === 1 ? 'gara' : 'gare'} a ${ITALIAN_MONTHS[month.first.getMonth()].toLowerCase()}`;
  }

  const listGroups = past ? groupByMonth(list.events) : groupEventsByBucket(list.events);

  return (
    <>
      <section className="kh-wrap kh-cal-head">
        <div>
          <h1 className="kh-display-1">Calendario gare</h1>
          <p className="kh-lede" style={{ marginTop: 16 }}>
            Le gare rental che raccogliamo dai siti di kartodromi e organizzatori. Scegli formato e regione, poi
            iscriviti sul sito della pista.
          </p>
        </div>
        <div className="kh-stat kh-cal-count" aria-live="polite">
          <span className="kh-count">{count ?? '–'}</span>
          <span>{countLabel || 'gare'}</span>
        </div>
      </section>

      <section className="kh-wrap kh-cal-tools" aria-label="Filtri del calendario">
        <div className="kh-cal-row">
          <div className="kh-chips" role="group" aria-label="Formato">
            {FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                className="kh-chip"
                aria-pressed={f.formato === fmt.value}
                onClick={() => update({ formato: fmt.value })}
              >
                {fmt.label}
              </button>
            ))}
          </div>
          <div className="kh-seg" role="group" aria-label="Vista">
            <button type="button" aria-pressed={f.vista === 'lista'} onClick={() => update({ vista: 'lista' })}>Lista</button>
            <button type="button" aria-pressed={f.vista === 'mese'} onClick={() => update({ vista: 'mese' })}>Mese</button>
          </div>
        </div>

        <button
          type="button"
          className="kh-btn kh-btn--secondary kh-btn--sm kh-cal-filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls="kh-cal-filters"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Altri filtri{extraCount > 0 ? ` (${extraCount})` : ''}
        </button>
        <div id="kh-cal-filters" className={`kh-cal-filters ${filtersOpen ? 'is-open' : ''}`.trim()}>
          <div className="kh-field">
            <label htmlFor="cal-regione">Regione</label>
            <select id="cal-regione" className="kh-select" value={f.regione} onChange={(e) => update({ regione: e.target.value })}>
              <option value="ALL">Tutta Italia</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="kh-field">
            <label htmlFor="cal-kart">Tipo di kart</label>
            <select id="cal-kart" className="kh-select" value={f.kart} onChange={(e) => update({ kart: e.target.value })}>
              <option value="ALL">Tutti i kart</option>
              {engineTypes.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="kh-field">
            <label htmlFor="cal-tipo">Gara singola o campionato</label>
            <select id="cal-tipo" className="kh-select" value={f.tipo} onChange={(e) => update({ tipo: e.target.value })}>
              {RACE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
        </div>

        {active.length > 0 && (
          <div className="kh-cal-active">
            {active.map((a) => (
              <button key={a.key} type="button" className="kh-pill" onClick={() => update({ [a.key]: 'ALL' })} aria-label={`Rimuovi il filtro ${a.label}`}>
                {a.label} <X size={14} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="kh-link-accent kh-cal-reset" onClick={resetAll}>Azzera i filtri</button>
          </div>
        )}
      </section>

      {f.vista === 'lista' ? (
        <section className="kh-wrap kh-cal-body" aria-label={past ? 'Gare passate' : 'Gare in programma'}>
          <div className="kh-seg" role="group" aria-label="Periodo" style={{ marginBottom: 28 }}>
            <button type="button" aria-pressed={!past} onClick={() => update({ quando: 'programma' })}>In programma</button>
            <button type="button" aria-pressed={past} onClick={() => update({ quando: 'passate' })}>Passate</button>
          </div>

          {list.status === 'loading' && <SkeletonRows />}
          {list.status === 'error' && (
            <div className="kh-empty"><p>Non riusciamo a caricare le gare in questo momento. Ricarica la pagina tra qualche minuto.</p></div>
          )}
          {(list.status === 'ready' || list.status === 'more') && list.events.length === 0 && (
            <div className="kh-empty">
              <p>
                {active.length > 0
                  ? 'Nessuna gara con questi filtri.'
                  : past ? 'Non ci sono ancora gare passate.' : 'Nessuna gara in programma per ora.'}
              </p>
              {active.length > 0 && <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={resetAll}>Azzera i filtri</button>}
              {active.length === 0 && !past && (
                <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={() => update({ quando: 'passate' })}>Guarda le gare passate</button>
              )}
            </div>
          )}
          {list.status !== 'loading' && list.status !== 'error' && <EventGroups groups={listGroups} register={!past} />}
          {list.events.length > 0 && list.events.length < list.total && (
            <button
              type="button"
              className="kh-btn kh-btn--secondary kh-more"
              disabled={list.status === 'more'}
              onClick={() => setRequest((r) => ({ ...r, page: r.page + 1 }))}
            >
              {list.status === 'more' ? 'Caricamento…' : `Mostra altre gare (${list.total - list.events.length})`}
            </button>
          )}
        </section>
      ) : (
        <section className="kh-wrap kh-cal-body" aria-labelledby="cal-mese">
          <div className="kh-month-nav">
            <button type="button" className="kh-icon-btn" aria-label="Mese precedente" onClick={() => update({ mese: shiftYm(ym, -1) })}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <h2 id="cal-mese" className="kh-title-2">{month.label}</h2>
            <button type="button" className="kh-icon-btn" aria-label="Mese successivo" onClick={() => update({ mese: shiftYm(ym, 1) })}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            {ym !== currentYm() && (
              <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={() => update({ mese: '' })}>Torna a questo mese</button>
            )}
          </div>

          {monthData.status === 'error' && (
            <div className="kh-empty"><p>Non riusciamo a caricare il mese in questo momento. Ricarica la pagina tra qualche minuto.</p></div>
          )}
          {monthData.status !== 'error' && (
            <>
              <div className="kh-month" aria-busy={monthData.status === 'loading'}>
                {WEEKDAYS.map((w) => <div key={w} className="kh-month__wd" aria-hidden="true">{w}</div>)}
                {cells.map((cell) => {
                  if (!cell.iso) return <div key={cell.key} className="kh-month__cell kh-month__cell--outside" aria-hidden="true" />;
                  const isToday = cell.iso === todayIso;
                  const dayLabel = (
                    <span className="kh-month__day">
                      {cell.day}{isToday && <span className="kh-month__today">oggi</span>}
                    </span>
                  );
                  if (cell.events.length === 0) {
                    return <div key={cell.key} className={`kh-month__cell ${isToday ? 'is-today' : ''}`.trim()}>{dayLabel}</div>;
                  }
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={`kh-month__cell has-events ${isToday ? 'is-today' : ''}`.trim()}
                      aria-pressed={selectedDay === cell.iso}
                      aria-label={`${formatLongDate(cell.iso)}: ${cell.events.length} ${cell.events.length === 1 ? 'gara' : 'gare'}`}
                      onClick={() => setSelected({ ym, iso: selectedDay === cell.iso ? null : cell.iso })}
                    >
                      {dayLabel}
                      {cell.events.slice(0, 2).map((ev) => (
                        <span key={ev.id} className="kh-month__ev">{cleanEventTitle(ev.title, ev.track_name)}</span>
                      ))}
                      {cell.events.length > 2 && <span className="kh-month__more">e altre {cell.events.length - 2}</span>}
                    </button>
                  );
                })}
              </div>

              {monthData.status === 'ready' && eventsByDay.size === 0 && (
                <div className="kh-empty">
                  <p>{active.length > 0 ? 'Nessuna gara con questi filtri in questo mese.' : 'Nessuna gara in questo mese.'}</p>
                </div>
              )}

              {selectedDay && eventsByDay.has(selectedDay) && (
                <div className="kh-month-day">
                  <h3 className="kh-title-3" style={{ marginBottom: 8 }}>{formatLongDate(selectedDay)}</h3>
                  <div className="kh-event-list">
                    {eventsByDay.get(selectedDay).map((ev) => <EventRow key={ev.id} event={ev} register />)}
                  </div>
                </div>
              )}

              <div className="kh-month-list">
                <EventGroups groups={dayGroups} register />
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}

export default Calendar;
