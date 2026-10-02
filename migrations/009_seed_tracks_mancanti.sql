-- ============================================================
-- Migration 009: piste mancanti (Piemonte, Liguria, Puglia, Sardegna, Veneto)
-- ============================================================
-- Fonti: elenco kartodromi omologati ACI Sport (Liguria, Molise, Puglia,
-- Sardegna) e directory pubbliche (pistekartitalia.it, paginebianche,
-- holidoit) per Piemonte e Veneto. Nome e comune vengono dalle fonti;
-- operativita' e apertura al noleggio vanno verificate a mano.
-- Rimosse dopo la ricerca in docs/ricerca-fonti-copertura.md: Kartodromo
-- Paradiso, Eurokart Torre Lapillo, Pista Sestugo (non trovate), Sardinia
-- Circuit (supermoto), Pista Fanelli (ultima attivita' nota 2019); vedi 010.
-- Restano senza piste Molise, Valle d'Aosta e Trentino-Alto Adige (solo ghiaccio
-- stagionale). Idempotente: gli INSERT saltano i nomi gia' presenti.
-- Da applicare a mano nel SQL editor di Supabase.

INSERT INTO public.tracks (name, region, city)
SELECT v.name, v.region, v.city
FROM (VALUES
    ('Pista Kart Bosco',                 'Piemonte',   'Bosco Marengo'),
    ('Pista Azzurra Borgo Ticino',       'Piemonte',   'Borgo Ticino'),
    ('Pista Kart PG Corse',              'Liguria',    'Ronco Scrivia'),
    ('Circuito Kart Carasco',            'Liguria',    'Carasco'),
    ('Pista Kart Vittoria',              'Liguria',    'Pontinvrea'),
    ('Pista Salentina',                  'Puglia',     'Ugento'),
    ('Circuito Internazionale La Conca', 'Puglia',     'Muro Leccese'),
    ('Kartodromo Touch&Go',              'Puglia',     'Martina Franca'),
    ('Pista Riviera del Corallo',        'Sardegna',   'Alghero'),
    ('Vicenza Kart Indoor',              'Veneto',     'Altavilla Vicentina'),
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
