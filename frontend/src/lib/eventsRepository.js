import { supabase } from './supabase';
import { getCached, setCached, clearCached } from './cache';

const PAGE_SIZE = 20;

export async function getEvents({
  region = 'ALL',
  eventType = 'ALL',
  engineType = 'ALL',
  format = 'ALL',
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const cacheKey = `events:${region}:${eventType}:${engineType}:${format}:${page}:${pageSize}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('event_date', { ascending: true });

  if (region !== 'ALL') query = query.eq('region', region);
  if (eventType !== 'ALL') query = query.eq('event_type', eventType);
  if (engineType !== 'ALL') query = query.eq('engine_type', engineType);
  if (format !== 'ALL') query = query.eq('format', format);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const result = { events: data || [], total: count || 0, page, pageSize };
  setCached(cacheKey, result);
  return result;
}

export async function getRkcAsiEvents({ region = 'ALL' } = {}) {
  const cacheKey = `rkcAsiEvents:${region}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from('events')
    .select('*')
    .or('title.ilike.%RKC%,title.ilike.%ASI%')
    .order('event_date', { ascending: true });

  if (region !== 'ALL') query = query.eq('region', region);

  const { data, error } = await query;
  if (error) throw error;

  setCached(cacheKey, data || []);
  return data || [];
}

export async function getUpcomingEvents(limit = 3) {
  const cacheKey = `upcomingEvents:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  setCached(cacheKey, data || []);
  return data || [];
}

export async function insertEvent(eventData) {
  const { data, error } = await supabase.from('events').insert([eventData]).select();
  if (error) throw error;
  clearCached('events:');
  clearCached('rkcAsiEvents:');
  clearCached('upcomingEvents:');
  return data;
}

export async function getEventById(eventId) {
  const cacheKey = `event:${eventId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  setCached(cacheKey, data);
  return data;
}

export async function getEventLapTimes(eventId) {
  const cacheKey = `eventLapTimes:${eventId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Laps require joining race_results to filter by event_id
  const { data, error } = await supabase
    .from('lap_times')
    .select(`
      id, lap_number, time_ms,
      race_results!inner(id, event_id, pilot_id)
    `)
    .eq('race_results.event_id', eventId)
    .order('lap_number', { ascending: true });

  if (error) throw error;
  setCached(cacheKey, data || []);
  return data || [];
}
