-- Script SQL per creare le tabelle principali su Supabase

-- 1. Tabella Piste / Organizzatori
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT,
    city TEXT,
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella Eventi
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    track_id UUID REFERENCES public.tracks(id),
    track_name TEXT NOT NULL, -- Denormalizzato per velocità e scraper
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL, -- Sprint, Endurance, Championship
    engine_type TEXT, -- 4 Tempi, 2 Tempi, ecc.
    price TEXT,
    is_beginner_friendly BOOLEAN DEFAULT false,
    source_url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilitiamo la RLS (Row Level Security) e creiamo una policy per la lettura pubblica
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eventi visibili a tutti" ON public.events FOR SELECT USING (true);

-- Permettiamo gli inserimenti autenticati (utile per lo scraper locale)
CREATE POLICY "Inserimento eventi autorizzato" ON public.events FOR INSERT WITH CHECK (true);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Piste visibili a tutti" ON public.tracks FOR SELECT USING (true);
