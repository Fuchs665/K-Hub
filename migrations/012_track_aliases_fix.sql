-- ============================================================
-- Migration 012: alias piste mancanti, doppione Misanino, nuove piste
-- ============================================================
-- Esito dei controlli sul DB live (docs/test-run-scraper.md):
--  1. "KCE Misanino" e "MISANINO KCE (RN)" erano due righe di tracks per la
--     stessa pista, e l'alias manuale della 011 era stato saltato per
--     conflitto di chiave: si unificano su "KCE Misanino".
--  2. Le piste aggiunte dalle migration 007-009 non hanno alias (la 011
--     semina solo le piste esistenti in quel momento): backfill degli alias
--     "canonical" per tutte le piste.
--  3. Nomi pista visti dalle fonti senza pista in tracks (Orobikart, Extrema
--     Kart, Pomposa, Pontecorvo, Afragola, Varano, Limatola, Villarosa): nuove
--     piste con la regione che lo scraper gia' assegna agli eventi; citta'
--     solo dove il nome la contiene, altrimenti NULL (da verificare).
--  4. Varianti di nome note -> alias manuali.
-- Esclusa "Locarno-Magadino": e' in Svizzera, fuori dalle regioni italiane.
-- Idempotente. Da applicare a mano nel SQL editor di Supabase, DOPO 007-011.

-- 1. Unisce "MISANINO KCE (RN)" in "KCE Misanino" (solo se esistono entrambe).
UPDATE public.track_aliases
SET track_id = (SELECT id FROM public.tracks WHERE lower(name) = 'kce misanino')
WHERE track_id = (SELECT id FROM public.tracks WHERE lower(name) = 'misanino kce (rn)')
  AND EXISTS (SELECT 1 FROM public.tracks WHERE lower(name) = 'kce misanino');

UPDATE public.events
SET track_id = (SELECT id FROM public.tracks WHERE lower(name) = 'kce misanino')
WHERE track_id = (SELECT id FROM public.tracks WHERE lower(name) = 'misanino kce (rn)')
  AND EXISTS (SELECT 1 FROM public.tracks WHERE lower(name) = 'kce misanino');

DELETE FROM public.tracks t
WHERE lower(t.name) = 'misanino kce (rn)'
  AND EXISTS (SELECT 1 FROM public.tracks WHERE lower(name) = 'kce misanino')
  AND NOT EXISTS (SELECT 1 FROM public.events e WHERE e.track_id = t.id)
  AND NOT EXISTS (SELECT 1 FROM public.track_aliases a WHERE a.track_id = t.id);

-- 3. Nuove piste (prima degli alias, cosi' il backfill le copre).
INSERT INTO public.tracks (name, region, city)
SELECT v.name, v.region, v.city
FROM (VALUES
    ('Orobikart',                'Lombardia',      'Curno'),
    ('Extrema Kart',             'Emilia-Romagna', NULL),
    ('Circuito di Pomposa',      'Emilia-Romagna', NULL),
    ('Arena Pontecorvo Circuit', 'Lazio',          'Pontecorvo'),
    ('Kartodromo Napoli (Afragola)', 'Campania',   'Afragola'),
    ('Varano',                   'Emilia-Romagna', NULL),
    ('Limatola',                 'Campania',       'Limatola'),
    ('Villarosa',                'Sicilia',        'Villarosa')
) AS v(name, region, city)
WHERE NOT EXISTS (
    SELECT 1 FROM public.tracks t WHERE lower(t.name) = lower(v.name)
);

-- 2. Alias "canonical" per tutte le piste ancora senza (chiave gia' presa: salta).
INSERT INTO public.track_aliases (alias_key, track_id, raw_name, source)
SELECT public.normalize_track_name(t.name), t.id, t.name, 'canonical'
FROM public.tracks t
WHERE t.name IS NOT NULL
  AND public.normalize_track_name(t.name) <> ''
ORDER BY t.created_at, t.id
ON CONFLICT (alias_key) DO NOTHING;

-- 4. Varianti note -> pista canonica (saltate se la pista non esiste).
INSERT INTO public.track_aliases (alias_key, track_id, raw_name, source)
SELECT public.normalize_track_name(v.alias), t.id, v.alias, 'manual'
FROM (VALUES
    ('7Laghi Kart',                    '7Laghi'),
    ('X Bikes 2.0 Circuit Ferrara',    'X Bikes 2.0'),
    ('Misanino KCE Circuit',           'KCE Misanino'),
    ('MISANINO KCE (RN)',              'KCE Misanino'),
    ('Orobi Kart',                     'Orobikart'),
    ('Orobikart – Bergamo Circuit',    'Orobikart'),
    ('Pista Ronco Kart OMP – PG Corse', 'Pista Kart PG Corse')
) AS v(alias, canonical)
JOIN public.tracks t ON lower(t.name) = lower(v.canonical)
ON CONFLICT (alias_key) DO NOTHING;

-- Backfill region degli eventi senza region sulle nuove piste.
UPDATE public.events e
SET region = t.region
FROM public.tracks t
WHERE e.region IS NULL
  AND t.region IS NOT NULL
  AND lower(e.track_name) = lower(t.name);
