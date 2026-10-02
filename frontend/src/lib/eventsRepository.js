import { supabase } from './supabase';
import { getCached, setCached, clearCached } from './cache';

const PAGE_SIZE = 20;

// when: 'upcoming' (da oggi, crescenti), 'past' (prima di oggi, decrescenti) o
// 'all' (crescenti). from/to: intervallo di date 'YYYY-MM-DD' incluso (vista mese).
// eventType corrisponde anche ai formati misti: 'Sprint' trova 'Sprint/Endurance'.
export async function getEvents({
  region = 'ALL',
  eventType = 'ALL',
  engineType = 'ALL',
  format = 'ALL',
  when = 'all',
  from: fromDate,
  to: toDate,
  page = 1,
  pageSize = PAGE_SIZE,
} = {}) {
  const cacheKey = `events:${region}:${eventType}:${engineType}:${format}:${when}:${fromDate}:${toDate}:${page}:${pageSize}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('event_date', { ascending: when !== 'past' });

  if (when === 'upcoming') query = query.gte('event_date', today);
  if (when === 'past') query = query.lt('event_date', today);
  if (fromDate) query = query.gte('event_date', fromDate);
  if (toDate) query = query.lte('event_date', toDate);
  if (region !== 'ALL') query = query.eq('region', region);
  if (eventType !== 'ALL') query = query.ilike('event_type', `%${eventType}%`);
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

// Solo count, nessuna riga trasferita. La chiave condivide il prefisso
// 'upcomingEvents:' così insertEvent la invalida insieme alla lista.
export async function getUpcomingEventsCount() {
  const cacheKey = 'upcomingEvents:count';
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .gte('event_date', today);

  if (error) throw error;
  setCached(cacheKey, count ?? 0);
  return count ?? 0;
}

export async function insertEvent(eventData) {
  const { data, error } = await supabase.from('events').insert([eventData]).select();
  if (error) throw error;
  clearCached('events:');
  clearCached('upcomingEvents:');
  clearCached('eventsLite:');
  clearCached('rkcAsiEvents:');
  return data;
}

// Tappe ufficiali RKC ASI (events.series = 'rkc_asi') per la pagina RkcAsi.
// when: 'upcoming' (da oggi, crescenti) o 'past' (prima di oggi, decrescenti).
export async function getRkcAsiEvents({ when = 'upcoming' } = {}) {
  const cacheKey = `rkcAsiEvents:${when}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from('events')
    .select('*')
    .eq('series', 'rkc_asi')
    .order('event_date', { ascending: when !== 'past' });
  query = when === 'past' ? query.lt('event_date', today) : query.gte('event_date', today);

  const { data, error } = await query;
  if (error) throw error;
  setCached(cacheKey, data || []);
  return data || [];
}

// Lista leggera per select/dropdown (es. inserimento risultati).
export async function getEventsLite(limit = 200) {
  const cacheKey = `eventsLite:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, track_name')
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  setCached(cacheKey, data || []);
  return data || [];
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

// Gare su una pista. Due criteri, in unione (senza duplicati):
// - track_id: la pista canonica risolta dallo scraper via track_aliases
//   (migration 011); copre anche le varianti di nome ("Orobi Kart"/"Orobikart");
// - nome: il nome della gara deve iniziare con uno dei nomi della pista, senza
//   distinzione di maiuscole (le fonti a volte aggiungono un suffisso:
//   "La Scaglia" -> "La Scaglia Circuit 2.0"). Serve per le righe scrapeate
//   prima che track_id esistesse e per gli eventi inseriti a mano. Una pista
//   può avere più nomi (vedi data/trackLayouts.js): una query per nome.
// when: 'upcoming' (da oggi, crescenti) o 'past' (decrescenti).
export async function getEventsAtTrack(trackNames, { when = 'upcoming', limit = 20, trackId = null } = {}) {
  const names = [...new Set(trackNames.filter(Boolean))];
  if (names.length === 0 && !trackId) return [];
  const cacheKey = `events:track:${when}:${limit}:${trackId ?? ''}:${names.join('|')}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().slice(0, 10);
  const past = when === 'past';
  const ranged = (query) => (past
    ? query.lt('event_date', today).order('event_date', { ascending: false })
    : query.gte('event_date', today).order('event_date', { ascending: true })
  ).limit(limit);

  const byName = names.map(async (name) => {
    const pattern = `${name.replace(/[\\%_]/g, '\\$&')}%`;
    const { data, error } = await ranged(supabase.from('events').select('*').ilike('track_name', pattern));
    if (error) throw error;
    return data || [];
  });
  // L'errore sulla query per track_id non blocca la pagina (es. colonna non
  // ancora presente sul DB): restano i risultati per nome.
  const byId = trackId
    ? [ranged(supabase.from('events').select('*').eq('track_id', trackId)).then(({ data }) => data || [])]
    : [];
  const results = await Promise.all([...byName, ...byId]);

  const unique = new Map(results.flat().map((ev) => [ev.id, ev]));
  const events = [...unique.values()]
    .sort((a, b) => (past ? b.event_date.localeCompare(a.event_date) : a.event_date.localeCompare(b.event_date)))
    .slice(0, limit);
  setCached(cacheKey, events);
  return events;
}

// Valori realmente presenti nei dati, per i filtri del calendario (tabella
// piccola: due colonne di tutte le gare, in cache 5 minuti).
export async function getEventFacets() {
  const cacheKey = 'events:facets';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.from('events').select('region, engine_type');
  if (error) throw error;

  const uniq = (key) => [...new Set((data || []).map((r) => r[key]).filter((v) => v && v !== 'N/D'))]
    .sort((a, b) => a.localeCompare(b, 'it'));
  const facets = { regions: uniq('region'), engineTypes: uniq('engine_type') };
  setCached(cacheKey, facets, 5 * 60_000);
  return facets;
}
