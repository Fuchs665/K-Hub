import { TRACK_LAYOUTS } from '../data/trackLayouts';

const norm = (s) => String(s ?? '').trim().toLowerCase();

// "KZR MARTINSICURO (TE)" -> "kzr-martinsicuro-te", "Kart&Go Montano Lucino" -> "kart-e-go-montano-lucino".
export function slugify(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function trackPath(name) {
  return `/piste/${slugify(name)}`;
}

// Specchio JS di public.normalize_track_name() (migration 011): minuscolo, senza
// accenti, punteggiatura, spazi e sigla provincia finale "(XX)".
export function normalizeTrackName(name) {
  return String(name ?? '')
    .replace(/\s*\([A-Za-z]{2}\)\s*$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Stessa pista, a meno di maiuscole/spazi/punteggiatura/sigla provincia.
export function sameTrack(a, b) {
  const na = normalizeTrackName(a);
  return na !== '' && na === normalizeTrackName(b);
}

export function findLayout(trackName) {
  return TRACK_LAYOUTS.find((l) => sameTrack(l.name, trackName)) ?? null;
}

// Riquadro del disegno, dalle coppie di coordinate del path (solo comandi M/L).
export function layoutViewBox(layout, pad = 8) {
  const nums = layout.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]);
    maxX = Math.max(maxX, nums[i]);
    minY = Math.min(minY, nums[i + 1]);
    maxY = Math.max(maxY, nums[i + 1]);
  }
  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
}

const POSTER_GROUNDS = ['giallo', 'rosso', 'blu'];

// Fondo della locandina stabile per pista: quello del tracciato se c'è,
// altrimenti derivato dal nome (così la stessa pista ha sempre lo stesso colore).
export function posterGround(trackName) {
  const layout = findLayout(trackName);
  if (layout?.poster) return layout.poster;
  let hash = 0;
  for (const ch of norm(trackName)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return POSTER_GROUNDS[hash % POSTER_GROUNDS.length];
}
