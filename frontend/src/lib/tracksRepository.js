import { supabase } from './supabase';
import { getCached, setCached } from './cache';
import { slugify } from './tracks';

export async function getTracks() {
  const cacheKey = 'tracks:all';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  setCached(cacheKey, data || [], 5 * 60_000);
  return data || [];
}

// Solo count, nessuna riga trasferita.
export async function getTracksCount() {
  const cacheKey = 'tracks:count';
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const { count, error } = await supabase
    .from('tracks')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  setCached(cacheKey, count ?? 0, 5 * 60_000);
  return count ?? 0;
}

// Le piste non hanno uno slug in DB: lo deriviamo dal nome (tabella piccola, già in cache).
export async function getTrackBySlug(slug) {
  const tracks = await getTracks();
  return tracks.find((t) => slugify(t.name) === slug) ?? null;
}

// Nomi alternativi con cui le fonti hanno scritto una pista (track_aliases,
// migration 011), per trovare anche le gare scrapeate prima del track_id.
// Tabella assente o errore di lettura: nessun alias, la pagina funziona lo stesso.
export async function getTrackAliasNames(trackId) {
  const cacheKey = 'tracks:aliases';
  let byTrack = getCached(cacheKey);
  if (!byTrack) {
    const { data, error } = await supabase.from('track_aliases').select('track_id, raw_name');
    byTrack = new Map();
    if (!error) {
      for (const row of data || []) {
        if (!row.raw_name) continue;
        byTrack.set(row.track_id, [...(byTrack.get(row.track_id) ?? []), row.raw_name]);
      }
    }
    setCached(cacheKey, byTrack, 5 * 60_000);
  }
  return byTrack.get(trackId) ?? [];
}
