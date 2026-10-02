-- ============================================================
-- Migration 011: tabella track_aliases (alias nomi pista)
-- ============================================================
-- Le fonti scrivono la stessa pista in modi diversi ("Orobi Kart" /
-- "Orobikart", "La Scaglia" / "La Scaglia Circuit 2.0"). Vedi
-- docs/ricerca-fonti-copertura.md §C. Questa migration crea solo lo schema
-- e il seed degli alias noti: scraper e frontend NON la usano ancora.
--
-- * tracks.name resta il nome canonico mostrato in UI.
-- * alias_key = normalize_track_name(nome visto): minuscolo, senza accenti,
--   punteggiatura, spazi e sigla provincia finale "(XX)". Cosi' "Orobi Kart"
--   e "Orobikart" hanno la stessa chiave senza alias manuali. Volutamente
--   NON toglie parole generiche (kart, circuit, pista): collasserebbe piste
--   diverse. Le varianti di fondo ("La Scaglia Circuit 2.0") vanno inserite
--   come alias espliciti.
-- Idempotente. Da applicare a mano nel SQL editor di Supabase.

CREATE OR REPLACE FUNCTION public.normalize_track_name(name TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
    SELECT regexp_replace(
        translate(
            lower(regexp_replace(coalesce(name, ''), '\s*\([A-Za-z]{2}\)\s*$', '')),
            'àáâäèéêëìíîïòóôöùúûü',
            'aaaaeeeeiiiioooouuuu'
        ),
        '[^a-z0-9]', '', 'g'
    );
$$;

CREATE TABLE IF NOT EXISTS public.track_aliases (
    alias_key  TEXT PRIMARY KEY,
    track_id   UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    raw_name   TEXT,
    source     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS track_aliases_track_id_idx ON public.track_aliases (track_id);

-- Lettura pubblica come tracks; scrittura solo con service_role (scraper,
-- che bypassa la RLS) o da SQL editor: nessuna policy di scrittura.
ALTER TABLE public.track_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Alias piste visibili a tutti" ON public.track_aliases;
CREATE POLICY "Alias piste visibili a tutti" ON public.track_aliases FOR SELECT USING (true);

-- Seed 1: ogni pista e' alias di se stessa. Se due piste hanno la stessa
-- chiave (es. "Orobi Kart" e "Orobikart" come righe separate) vince la
-- prima e l'altra viene saltata: sono doppioni di tracks da unire a mano.
INSERT INTO public.track_aliases (alias_key, track_id, raw_name, source)
SELECT public.normalize_track_name(t.name), t.id, t.name, 'canonical'
FROM public.tracks t
WHERE t.name IS NOT NULL
  AND public.normalize_track_name(t.name) <> ''
ORDER BY t.created_at, t.id
ON CONFLICT (alias_key) DO NOTHING;

-- Seed 2: varianti note che la normalizzazione non unisce. Si salta in
-- silenzio se la pista canonica non e' nella tabella tracks.
INSERT INTO public.track_aliases (alias_key, track_id, raw_name, source)
SELECT public.normalize_track_name(v.alias), t.id, v.alias, 'manual'
FROM (VALUES
    ('La Scaglia Circuit 2.0', 'La Scaglia'),
    ('MISANINO KCE (RN)',      'KCE Misanino'),
    ('Circuito di Siena',      'Pista Internazionale Siena'),
    ('Pista del Corallo',      'Pista Riviera del Corallo'),
    ('Kartodromo del Corallo', 'Pista Riviera del Corallo')
) AS v(alias, canonical)
JOIN public.tracks t ON lower(t.name) = lower(v.canonical)
ON CONFLICT (alias_key) DO NOTHING;
