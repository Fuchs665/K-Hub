-- Script di migrazione per K-Hub - Step 2 (Backend & Statistiche)

-- 1. Aggiunta campi mancanti alla tabella events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS format TEXT;

-- 2. Vincolo UNIQUE per l'upsert dello scraper
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS unique_source_url_event_date;
ALTER TABLE public.events ADD CONSTRAINT unique_source_url_event_date UNIQUE (source_url, event_date);

-- 3. RLS events: restrizione policy di inserimento eccessivamente permissiva
DROP POLICY IF EXISTS "Inserimento eventi autorizzato" ON public.events;
CREATE POLICY "Inserimento eventi solo autenticati" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- (Nota: la Service Role key dello scraper bypassa nativamente la RLS, quindi funzionerà comunque)

-- 4. Tabella pilots (profilo esteso per i piloti, collegata in 1:1 con auth.users)
CREATE TABLE IF NOT EXISTS public.pilots (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    full_name TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pilots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Piloti visibili a tutti" ON public.pilots;
CREATE POLICY "Piloti visibili a tutti" ON public.pilots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Utente aggiorna se stesso" ON public.pilots;
CREATE POLICY "Utente aggiorna se stesso" ON public.pilots FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Utente inserisce se stesso" ON public.pilots;
CREATE POLICY "Utente inserisce se stesso" ON public.pilots FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Tabella race_results (Risultati finali di un pilota in un evento)
CREATE TABLE IF NOT EXISTS public.race_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    position INTEGER, -- 1 = Primo, 2 = Secondo, ecc.
    points NUMERIC(10, 2), -- Punteggio per campionato
    category TEXT, -- Es: Pro, Am, Iron, Rookie
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, pilot_id)
);

ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Risultati visibili a tutti" ON public.race_results;
CREATE POLICY "Risultati visibili a tutti" ON public.race_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserimento risultati autenticato" ON public.race_results;
CREATE POLICY "Inserimento risultati autenticato" ON public.race_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Aggiornamento risultati autenticato" ON public.race_results;
CREATE POLICY "Aggiornamento risultati autenticato" ON public.race_results FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Tabella lap_times (Dettaglio cronometrico)
CREATE TABLE IF NOT EXISTS public.lap_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_result_id UUID REFERENCES public.race_results(id) ON DELETE CASCADE,
    lap_number INTEGER NOT NULL,
    time_ms INTEGER NOT NULL, -- Tempo in millisecondi (massima precisione)
    is_invalid BOOLEAN DEFAULT false, -- Giro invalidato per track limits o taglio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(race_result_id, lap_number)
);

ALTER TABLE public.lap_times ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tempi sul giro visibili a tutti" ON public.lap_times;
CREATE POLICY "Tempi sul giro visibili a tutti" ON public.lap_times FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserimento tempi autenticato" ON public.lap_times;
CREATE POLICY "Inserimento tempi autenticato" ON public.lap_times FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Aggiornamento tempi autenticato" ON public.lap_times;
CREATE POLICY "Aggiornamento tempi autenticato" ON public.lap_times FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. Tabella regulations (Regolamento specifico di un evento)
CREATE TABLE IF NOT EXISTS public.regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    qualify_format TEXT, -- Es. 'Superpole', 'Q1-Q2-Q3', '10 Minuti'
    weight_rules TEXT, -- Es. 'Zavorra fissa 85kg'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id)
);

ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Regolamenti visibili a tutti" ON public.regulations;
CREATE POLICY "Regolamenti visibili a tutti" ON public.regulations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserimento regolamenti autenticato" ON public.regulations;
CREATE POLICY "Inserimento regolamenti autenticato" ON public.regulations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Aggiornamento regolamenti autenticato" ON public.regulations;
CREATE POLICY "Aggiornamento regolamenti autenticato" ON public.regulations FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. Indici per prestazioni
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_region ON public.events(region);
CREATE INDEX IF NOT EXISTS idx_events_format ON public.events(format);
CREATE INDEX IF NOT EXISTS idx_race_results_pilot ON public.race_results(pilot_id);
CREATE INDEX IF NOT EXISTS idx_lap_times_result ON public.lap_times(race_result_id);
CREATE INDEX IF NOT EXISTS idx_lap_times_time ON public.lap_times(time_ms);

-- 9. RPC (Remote Procedure Call) per calcolo statistiche pilota lato database
CREATE OR REPLACE FUNCTION public.get_pilot_stats(p_pilot_id UUID)
RETURNS TABLE (
    total_races BIGINT,
    total_podiums BIGINT,
    best_lap_time_ms INTEGER,
    avg_finish_position NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(rr.id) AS total_races,
        COUNT(rr.id) FILTER (WHERE rr.position <= 3) AS total_podiums,
        (
            SELECT MIN(lt.time_ms) 
            FROM public.lap_times lt 
            JOIN public.race_results r2 ON r2.id = lt.race_result_id
            WHERE r2.pilot_id = p_pilot_id AND lt.is_invalid = false
        ) AS best_lap_time_ms,
        AVG(rr.position) AS avg_finish_position
    FROM public.race_results rr
    WHERE rr.pilot_id = p_pilot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
