import { parseEventDate } from './format';

export const ITALIAN_MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Bucket relativi a oggi. Ogni bucket è un intervallo di date contiguo e
// successivo al precedente, così su eventi ordinati per data i gruppi escono
// già in ordine cronologico: passati / oggi / questa settimana (fino a
// venerdì) / questo weekend / prossima settimana / resto del mese / mese
// successivo / più avanti.
export function getEventBucket(event, today) {
  const date = parseEventDate(event.event_date);
  if (!date) return 'Più avanti';
  const day = startOfDay(date);
  const diffDays = Math.round((day - today) / 86400000);

  if (diffDays < 0) return 'Eventi passati';
  if (diffDays === 0) return 'Oggi';

  const weekday = today.getDay(); // 0=Dom..6=Sab
  const thisMonday = addDays(today, weekday === 0 ? -6 : 1 - weekday);
  const thisSaturday = addDays(thisMonday, 5);
  const thisSunday = addDays(thisMonday, 6);
  const nextMonday = addDays(thisMonday, 7);
  const nextSunday = addDays(thisMonday, 13);

  if (day < thisSaturday) return 'Questa settimana';
  if (day <= thisSunday) return 'Questo weekend';
  if (day >= nextMonday && day <= nextSunday) return 'Prossima settimana';
  if (day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth()) return 'Questo mese';

  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  if (day.getFullYear() === nextMonthDate.getFullYear() && day.getMonth() === nextMonthDate.getMonth()) {
    return ITALIAN_MONTHS[nextMonthDate.getMonth()];
  }

  return 'Più avanti';
}

// Raggruppa eventi GIÀ ordinati per data, nell'ordine in cui i bucket compaiono.
export function groupEventsByBucket(events, today = startOfDay(new Date())) {
  const groups = [];
  for (const event of events) {
    const label = getEventBucket(event, today);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
  }
  return groups;
}

// Gare passate: raggruppate per mese, dal più recente.
export function groupByMonth(events) {
  const groups = [];
  for (const event of events) {
    const d = parseEventDate(event.event_date);
    const label = d ? `${ITALIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}` : 'Data da confermare';
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(event);
    else groups.push({ label, events: [event] });
  }
  return groups;
}
