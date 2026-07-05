import { supabase } from './supabase';
import { getCached, setCached, clearCached } from './cache';

// Lista leggera dei profili registrati, per collegare pilot_name -> pilot_id.
export async function getProfilesLite() {
  const cacheKey = 'profilesLite:all';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .order('display_name', { ascending: true });

  if (error) throw error;
  setCached(cacheKey, data || []);
  return data || [];
}

// Inserisce i risultati di una gara e ritorna le righe create (con id),
// necessarie per collegare gli eventuali lap_times.
// rows: [{ pilot_name, pilot_id?, position?, points? }]
export async function insertRaceResults(eventId, rows) {
  const payload = rows.map(r => ({
    event_id: eventId,
    pilot_name: r.pilot_name,
    pilot_id: r.pilot_id || null,
    position: r.position ?? null,
    points: r.points ?? null,
  }));

  const { data, error } = await supabase
    .from('race_results')
    .insert(payload)
    .select('id, pilot_name, pilot_id');

  if (error) {
    // 23505 = violazione UNIQUE (event_id, pilot_id): pilota registrato già a referto
    if (error.code === '23505') {
      throw new Error('Uno dei piloti registrati ha già un risultato per questo evento.');
    }
    throw error;
  }

  invalidateStatsCaches(eventId);
  return data || [];
}

// laps: [{ race_result_id, lap_number, time_ms }]
export async function insertLapTimes(eventId, laps) {
  if (!laps.length) return [];

  const { data, error } = await supabase
    .from('lap_times')
    .insert(laps)
    .select('id');

  if (error) {
    if (error.code === '23505') {
      throw new Error('Tempi duplicati: esiste già un tempo per uno dei giri indicati.');
    }
    throw error;
  }

  invalidateStatsCaches(eventId);
  return data || [];
}

function invalidateStatsCaches(eventId) {
  clearCached(`eventStandings:${eventId}`);
  clearCached(`eventLapTimes:${eventId}`);
  clearCached('pilotLeaderboard:');
  clearCached('pilotStats:');
  clearCached('pilotRaceHistory:');
}
