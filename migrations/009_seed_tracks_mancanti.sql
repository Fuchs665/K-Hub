-- ============================================================
-- Migration 009: piste mancanti (Piemonte, Liguria, Molise, Puglia, Sardegna, Veneto)
-- ============================================================
-- Fonti: elenco kartodromi omologati ACI Sport (Liguria, Molise, Puglia,
-- Sardegna) e directory pubbliche (pistekartitalia.it, paginebianche,
-- holidoit) per Piemonte e Veneto. Nome e comune vengono dalle fonti;
-- operativita' e apertura al noleggio vanno verificate a mano.
-- Restano senza piste Valle d'Aosta e Trentino-Alto Adige (solo ghiaccio
-- stagionale). Idempotente: gli INSERT saltano i nomi gia' presenti.
-- Da applicare a mano nel SQL editor di Supabase.

INSERT INTO public.tracks (name, region, city)
SELECT v.name, v.region, v.city
FROM (VALUES
    ('Pista Kart Bosco',                 'Piemonte',   'Bosco Marengo'),
    ('Pista Azzurra Borgo Ticino',       'Piemonte',   'Borgo Ticino'),
    ('Pista Kart PG Corse',              'Liguria',    'Genova'),
    ('Circuito Kart Carasco',            'Liguria',    'Carasco'),
    ('Pista Kart Vittoria',              'Liguria',    'Pontinvrea'),
    ('Kartodromo Paradiso',              'Molise',     'Isernia'),
    ('Pista Salentina',                  'Puglia',     'Ugento'),
    ('Pista Eurokart Torre Lapillo',     'Puglia',     'Porto Cesareo'),
    ('Circuito Internazionale La Conca', 'Puglia',     'Muro Leccese'),
    ('Kartodromo Touch&Go',              'Puglia',     'Martina Franca'),
    ('Pista Fanelli',                    'Puglia',     'Torricella'),
    ('Sardinia Circuit',                 'Sardegna',   'Tramatza'),
    ('Pista Riviera del Corallo',        'Sardegna',   'Alghero'),
    ('Pista Sestugo',                    'Sardegna',   'Sestu'),
    ('Vicenza Kart',                     'Veneto',     'Altavilla Vicentina'),
    ('Pista Verde',                      'Veneto',     'Altivole')
) AS v(name, region, city)
WHERE NOT EXISTS (
    SELECT 1 FROM public.tracks t WHERE lower(t.name) = lower(v.name)
);

-- Backfill: eventi gia' in tabella senza region su queste piste.
UPDATE public.events e
SET region = t.region
FROM public.tracks t
WHERE e.region IS NULL
  AND t.region IS NOT NULL
  AND lower(e.track_name) = lower(t.name);
