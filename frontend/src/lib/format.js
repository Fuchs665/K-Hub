// Helper condivisi per la formattazione dei dati evento nelle card.

// Accetta sia 'YYYY-MM-DD' (formato DB) sia 'DD-MM-YYYY' (vecchi dati scraper).
export function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return null;
  const [a, b, c] = parts;
  const [year, month, day] = a.length === 4 ? [a, b, c] : [c, b, a];
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

// 'SAB 11 LUG 2026' — se la data non è interpretabile, mostra la stringa originale.
export function formatEventDate(dateStr) {
  const date = parseEventDate(dateStr);
  if (!date) return dateStr ?? '';
  return dateFormatter.format(date).replace(/\./g, '').toUpperCase();
}

// 'gara_singola' -> 'GARA SINGOLA'
export function formatLabel(value) {
  if (!value) return '';
  return String(value).replace(/_/g, ' ').toUpperCase();
}

export function generateCalendarLink(event) {
  const date = parseEventDate(event.event_date);
  let dates = '';
  if (date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    dates = `&dates=${y}${m}${d}/${y}${m}${d}`;
  }
  const details = event.source_url ? `Iscrizione: ${event.source_url}` : 'Evento karting da K-Hub';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(event.track_name ?? '')}`;
}
