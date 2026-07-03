-- Migration 002: RLS corretta.
-- Lettura pubblica ovunque, scrittura solo utenti autenticati (+ owner-check su events).
-- Lo scraper NON passa più da qui: usa la service_role key, che bypassa RLS.
-- Idempotente: DROP POLICY IF EXISTS prima di ogni CREATE POLICY.

-- ============================================================
-- events: sostituisce la policy INSERT WITH CHECK (true)
-- ============================================================
DROP POLICY IF EXISTS "Inserimento eventi autorizzato" ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;

CREATE POLICY "events_insert_authenticated" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "events_update_owner" ON public.events;
CREATE POLICY "events_update_owner" ON public.events
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "events_delete_owner" ON public.events;
CREATE POLICY "events_delete_owner" ON public.events
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- ============================================================
-- tracks: scrittura autenticata (finora nessuna policy INSERT/UPDATE esisteva)
-- ============================================================
DROP POLICY IF EXISTS "tracks_insert_authenticated" ON public.tracks;
CREATE POLICY "tracks_insert_authenticated" ON public.tracks
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "tracks_update_authenticated" ON public.tracks;
CREATE POLICY "tracks_update_authenticated" ON public.tracks
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================
-- race_results
-- ============================================================
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "race_results_select_all" ON public.race_results;
CREATE POLICY "race_results_select_all" ON public.race_results
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "race_results_write_authenticated" ON public.race_results;
CREATE POLICY "race_results_write_authenticated" ON public.race_results
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- lap_times
-- ============================================================
ALTER TABLE public.lap_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lap_times_select_all" ON public.lap_times;
CREATE POLICY "lap_times_select_all" ON public.lap_times
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "lap_times_write_authenticated" ON public.lap_times;
CREATE POLICY "lap_times_write_authenticated" ON public.lap_times
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- regulations
-- ============================================================
ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regulations_select_all" ON public.regulations;
CREATE POLICY "regulations_select_all" ON public.regulations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "regulations_write_authenticated" ON public.regulations;
CREATE POLICY "regulations_write_authenticated" ON public.regulations
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
