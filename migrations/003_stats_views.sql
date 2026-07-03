-- Migration 003: motore statistiche lato Postgres (viste + RPC).
-- Nessuna aggregazione va fatta in JS sul client: tutto qui.

-- ============================================================
-- Vista base: risultato gara + best lap / media giri
-- ============================================================
CREATE OR REPLACE VIEW public.v_race_result_lap_stats AS
SELECT
    rr.id AS race_result_id,
    rr.event_id,
    rr.pilot_id,
    rr.pilot_name,
    rr.position,
    rr.points,
    MIN(lt.time_ms) AS best_lap_ms,
    AVG(lt.time_ms) AS avg_lap_ms,
    COUNT(lt.id) AS laps_recorded
FROM public.race_results rr
LEFT JOIN public.lap_times lt ON lt.race_result_id = rr.id
GROUP BY rr.id, rr.event_id, rr.pilot_id, rr.pilot_name, rr.position, rr.points;

-- ============================================================
-- Classifica nazionale piloti (aggregata su tutte le gare disputate)
-- ============================================================
CREATE OR REPLACE VIEW public.v_pilot_leaderboard AS
SELECT
    p.id AS pilot_id,
    p.display_name,
    COUNT(DISTINCT rr.id) AS races_count,
    COUNT(DISTINCT rr.id) FILTER (WHERE rr.position <= 3) AS podiums_count,
    COALESCE(SUM(rr.points), 0) AS total_points,
    MIN(lt.time_ms) AS best_lap_ms
FROM public.profiles p
JOIN public.race_results rr ON rr.pilot_id = p.id
LEFT JOIN public.lap_times lt ON lt.race_result_id = rr.id
GROUP BY p.id, p.display_name
ORDER BY total_points DESC;

-- ============================================================
-- RPC: statistiche di un singolo pilota (per Dashboard Pilota)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_pilot_stats(p_pilot_id UUID)
RETURNS TABLE (
    races_count BIGINT,
    podiums_count BIGINT,
    best_lap_ms INTEGER,
    avg_lap_ms NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        COUNT(DISTINCT rr.id) AS races_count,
        COUNT(DISTINCT rr.id) FILTER (WHERE rr.position <= 3) AS podiums_count,
        MIN(lt.time_ms) AS best_lap_ms,
        AVG(lt.time_ms) AS avg_lap_ms
    FROM public.race_results rr
    LEFT JOIN public.lap_times lt ON lt.race_result_id = rr.id
    WHERE rr.pilot_id = p_pilot_id;
$$;

-- ============================================================
-- RPC: classifica di un singolo evento
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_event_standings(p_event_id UUID)
RETURNS TABLE (
    result_id UUID,
    pilot_id UUID,
    pilot_name TEXT,
    "position" INTEGER,
    points NUMERIC,
    best_lap_ms INTEGER
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        rr.id,
        rr.pilot_id,
        rr.pilot_name,
        rr.position,
        rr.points,
        MIN(lt.time_ms) AS best_lap_ms
    FROM public.race_results rr
    LEFT JOIN public.lap_times lt ON lt.race_result_id = rr.id
    WHERE rr.event_id = p_event_id
    GROUP BY rr.id, rr.pilot_id, rr.pilot_name, rr.position, rr.points
    ORDER BY rr.position NULLS LAST;
$$;
