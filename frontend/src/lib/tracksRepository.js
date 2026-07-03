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
