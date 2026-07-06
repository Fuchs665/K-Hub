import { supabase } from './supabase';
import { getCached, setCached } from './cache';

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
