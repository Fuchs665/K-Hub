-- Migration 001: layer statistiche (profiles, race_results, lap_times, regulations)
-- + estensione events (region, format, created_by) + indici.
-- Idempotente: eseguibile più volte senza errori su un DB già migrato.

-- ============================================================
-- 1. Estensione tabella events
-- ============================================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS format TEXT
    CHECK (format IN ('gara_singola', 'campionato'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Rimuove duplicati pre-esistenti (stesso source_url + event_date) tenendo la riga più vecchia,
-- necessario perché lo scraper girava senza deduplica prima di questa migration.
DELETE FROM public.events a
    USING public.events b
    WHERE a.source_url IS NOT NULL
    AND a.source_url = b.source_url
    AND a.event_date = b.event_date
    AND a.id > b.id;

-- Chiave naturale per la deduplica dello scraper (upsert on_conflict).
CREATE UNIQUE INDEX IF NOT EXISTS events_source_url_event_date_key
    ON public.events (source_url, event_date)
    WHERE source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_region ON public.events (region);

-- Backfill best-effort dei dati storici (euristica identica a quella finora mockata in Calendar.jsx/RkcAsi.jsx).
UPDATE public.events SET format = CASE
    WHEN title ILIKE '%campionato%' OR title ILIKE '%championship%' THEN 'campionato'
    ELSE 'gara_singola'
END
WHERE format IS NULL;

UPDATE public.events e SET region = r.region
FROM (VALUES
    ('Abruzzo'), ('Basilicata'), ('Calabria'), ('Campania'), ('Emilia-Romagna'),
    ('Friuli-Venezia Giulia'), ('Lazio'), ('Liguria'), ('Lombardia'), ('Marche'),
    ('Molise'), ('Piemonte'), ('Puglia'), ('Sardegna'), ('Sicilia'), ('Toscana'),
    ('Trentino-Alto Adige'), ('Umbria'), ('Valle d''Aosta'), ('Veneto')
) AS r(region)
WHERE e.region IS NULL AND e.track_name ILIKE '%' || r.region || '%';

-- ============================================================
-- 2. Profili pilota/organizzatore (estende auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'pilot' CHECK (role IN ('pilot', 'organizer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. Risultati gara
-- ============================================================
CREATE TABLE IF NOT EXISTS public.race_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pilot_name TEXT NOT NULL,
    position INTEGER,
    points NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS race_results_event_pilot_key
    ON public.race_results (event_id, pilot_id)
    WHERE pilot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_race_results_event_id ON public.race_results (event_id);
CREATE INDEX IF NOT EXISTS idx_race_results_pilot_id ON public.race_results (pilot_id);

-- ============================================================
-- 4. Tempi sul giro
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lap_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_result_id UUID NOT NULL REFERENCES public.race_results(id) ON DELETE CASCADE,
    lap_number INTEGER NOT NULL,
    time_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (race_result_id, lap_number)
);

CREATE INDEX IF NOT EXISTS idx_lap_times_race_result_id ON public.lap_times (race_result_id);

-- ============================================================
-- 5. Regolamento per evento
-- ============================================================
CREATE TABLE IF NOT EXISTS public.regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
    ballast_rules TEXT,
    qualifying_format TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
