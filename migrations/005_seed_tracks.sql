-- ============================================================
-- Migration 005: seed tabella tracks + backfill region eventi
-- ============================================================
-- La tabella tracks era vuota: censimento delle piste viste dagli
-- scraper (nomi ESATTI come compaiono in events.track_name, perche'
-- resolve_region dello scraper fa lookup esatto case-insensitive).
-- Popola anche la pagina "Le Piste".
-- Idempotente: gli INSERT saltano i nomi gia' presenti.
-- Da applicare a mano nel SQL editor di Supabase.

INSERT INTO public.tracks (name, region, city)
SELECT v.name, v.region, v.city
FROM (VALUES
    ('7Laghi',                   'Lombardia',        'Castelletto di Branduzzo'),
    ('Big Kart Rozzano',         'Lombardia',        'Rozzano'),
    ('Christel Village',         'Lazio',            'Aprilia'),
    ('KART INDOOR MONIGA (BS)',  'Lombardia',        'Moniga del Garda'),
    ('KART SHOW (PU)',           'Marche',           NULL),
    ('KCE Misanino',             'Emilia-Romagna',   'Misano Adriatico'),
    ('MISANINO KCE (RN)',        'Emilia-Romagna',   'Misano Adriatico'),
    ('KZR MARTINSICURO (TE)',    'Abruzzo',          'Martinsicuro'),
    ('La Scaglia',               'Lazio',            'Viterbo'),
    ('PGK CAMERANO (AN)',        'Marche',           'Camerano'),
    ('Pista Caudina',            'Campania',         NULL),
    ('PUNTO KART MAROTTA (PU)',  'Marche',           'Marotta'),
    ('X Bikes 2.0',              'Emilia-Romagna',   'Ferrara'),
    ('Kart&Go Montano Lucino',   'Lombardia',        'Montano Lucino')
) AS v(name, region, city)
WHERE NOT EXISTS (
    SELECT 1 FROM public.tracks t WHERE lower(t.name) = lower(v.name)
);

-- Backfill: gli eventi gia' in tabella senza region la ereditano dalla
-- pista appena censita (stesso lookup esatto che fara' lo scraper sui
-- run futuri). Restano NULL solo TBA, piste estere e piste ignote.
UPDATE public.events e
SET region = t.region
FROM public.tracks t
WHERE e.region IS NULL
  AND t.region IS NOT NULL
  AND lower(e.track_name) = lower(t.name);
