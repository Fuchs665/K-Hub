-- ============================================================
-- Migration 007: seed piste Toscana
-- ============================================================
-- Prime piste censite per la Toscana (prima senza nessuna pista).
-- Fonti: sito ufficiale Pista Internazionale Siena e directory pubbliche
-- (pistekartitalia.it, news.superkart.it). Da verificare a mano che le
-- piste siano ancora operative prima di pubblicizzarle.
-- Nomi pensati per coincidere con events.track_name dello scraper
-- (lookup esatto case-insensitive in resolve_region).
-- Idempotente: gli INSERT saltano i nomi gia' presenti.
-- Da applicare a mano nel SQL editor di Supabase.

INSERT INTO public.tracks (name, region, city, website_url)
SELECT v.name, v.region, v.city, v.website_url
FROM (VALUES
    ('Pista Internazionale Siena', 'Toscana', 'Castelnuovo Berardenga', 'https://circuitodisiena.it/'),
    ('Kartodromo 2000',            'Toscana', 'Sovicille',              NULL),
    ('Pista del Mare',             'Toscana', 'Cecina',                 NULL)
) AS v(name, region, city, website_url)
WHERE NOT EXISTS (
    SELECT 1 FROM public.tracks t WHERE lower(t.name) = lower(v.name)
);

-- Backfill: eventi gia' in tabella senza region su queste piste.
UPDATE public.events e
SET region = t.region
FROM public.tracks t
WHERE e.region IS NULL
  AND t.region = 'Toscana'
  AND lower(e.track_name) = lower(t.name);
