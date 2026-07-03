import { supabase } from './supabase';
import { getCached, setCached } from './cache';

export async function getPilotStats(pilotId) {
  const cacheKey = `pilotStats:${pilotId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .rpc('get_pilot_stats', { p_pilot_id: pilotId })
    .single();

  if (error) throw error;
  setCached(cacheKey, data);
  return data;
}

export async function getEventStandings(eventId) {
  const cacheKey = `eventStandings:${eventId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_event_standings', { p_event_id: eventId });
  if (error) throw error;

  setCached(cacheKey, data || []);
  return data || [];
}

export async function getLeaderboard() {
  const cacheKey = 'pilotLeaderboard:all';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('v_pilot_leaderboard')
    .select('*')
    .order('total_points', { ascending: false });

  if (error) throw error;
  setCached(cacheKey, data || []);
  return data || [];
}
