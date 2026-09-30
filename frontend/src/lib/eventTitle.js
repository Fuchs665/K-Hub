// Titoli degli eventi ripuliti per la UI. Gli scraper riportano i titoli così
// come sono sui siti sorgente: tutto maiuscolo, nome della pista ripetuto,
// tag della fonte, mese e anno in coda, parole chiave SEO. Il titolo originale
// resta nel DB: questa funzione serve solo a mostrarlo.

const MONTHS = 'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre';
const SOURCE_TAG = /\s*\((xrace|werace|sws|krm)\)/gi;
const DAY_TAG = /\s*\(\d{1,2}\/\d{1,2}\)/g;
const TRAILING_DATE = new RegExp(`\\s+(?:(?:${MONTHS})\\s+)?\\d{4}\\s*$`, 'i');
// Nei titoli lunghi dei siti WeRace/SWS, da qui in poi ci sono solo parole chiave.
const SEO_TAIL = /\s+\b(?:werace|sws|gara sodi|squadre)\b/i;
const ACRONYMS = new Set(['RKC', 'ASI', 'KRM', 'SWS', 'MKS', 'KCE', 'KZR', 'PGK', 'XRACE', 'WERACE']);
const LOWER_AFTER_COMMA = new Set(['tappa', 'round', 'gara', 'test', 'prova', 'finale']);

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fixCase(word) {
  const letters = word.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length <= 3 || letters !== letters.toUpperCase() || ACRONYMS.has(letters)) return word;
  return word.charAt(0) + word.slice(1).toLowerCase();
}

export function cleanEventTitle(title, trackName) {
  if (!title) return '';
  let t = String(title).replace(SOURCE_TAG, '').replace(DAY_TAG, '');

  if (trackName) {
    t = t.replace(new RegExp(`\\s*${escapeRegex(trackName.trim())}`, 'i'), '').replace(/\s*\(\s*\)/g, '');
  }

  if (t.split(/\s+/).length > 6) {
    const cut = t.search(SEO_TAIL);
    if (cut > 0) t = t.slice(0, cut);
  }

  t = t.replace(TRAILING_DATE, '');

  // Parole della pista rimaste in coda (es. "Milano Rozzano" con pista "Big Kart Rozzano").
  if (trackName) {
    const trackWords = new Set(trackName.toLowerCase().split(/[^a-zà-ÿ]+/).filter(w => w.length > 3));
    const words = t.trim().split(/\s+/);
    while (words.length > 2 && trackWords.has(words[words.length - 1].toLowerCase())) words.pop();
    t = words.join(' ');
  }

  t = t
    .split(/\s+/)
    .map(fixCase)
    .join(' ')
    .replace(/\s+[–—-]\s+(\S+)/g, (_, next) => `, ${LOWER_AFTER_COMMA.has(next.toLowerCase()) ? next.toLowerCase() : next}`)
    .replace(/[\s,–—-]+$/, '')
    .trim();

  return t || String(title);
}

// Nomi di pista scritti tutti in maiuscolo: "KZR MARTINSICURO (TE)" -> "KZR Martinsicuro (TE)".
export function formatName(name) {
  if (!name) return '';
  return String(name).trim().split(/\s+/).map(fixCase).join(' ');
}

// "Sprint/Endurance" -> "Sprint ed endurance", "SPRINT CUP" -> "Sprint cup".
export function formatEventType(type) {
  if (!type) return '';
  const t = String(type).trim().toLowerCase().replace(/\s*\/\s*/g, ' e ').replace(/ e (?=e)/g, ' ed ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Titolo corto per la locandina: "8 ore" se la gara dichiara la durata,
// altrimenti il formato.
export function posterTitle(event) {
  const hours = /\b(\d{1,2})\s*ore\b/i.exec(event?.title || '');
  if (hours) return `${hours[1]} ore`;
  const type = (event?.event_type || '').split('/')[0].trim();
  return type ? type.toLowerCase() : 'gara';
}
