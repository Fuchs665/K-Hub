-- ============================================================
-- Migration 008: seed piste in altre regioni senza copertura
-- ============================================================
-- Veneto, Friuli-Venezia Giulia, Umbria, Calabria, Sicilia.
-- Rimossa dopo la ricerca (docs/ricerca-fonti-copertura.md): Kartodromo Palazzo
-- (Trecchina), pista riservata ai soci di un'ASD; vedi 010.
-- Fonti: directory pubbliche (yumping, turismofvg, livetheworld, milazzo.life):
-- nome e comune sono confermati, ma operativita' e orari vanno verificati
-- a mano prima di pubblicizzare le piste. Restano scoperte Piemonte, Valle
-- d'Aosta, Liguria, Trentino-Alto Adige (solo piste su ghiaccio stagionali),
-- Molise, Puglia, Sardegna: nessuna pista verificata con nome+comune certi.
-- Idempotente: gli INSERT saltano i nomi gia' presenti.
-- Da applicare a mano nel SQL editor di Supabase.

INSERT INTO public.tracks (name, region, city)
SELECT v.name, v.region, v.city
FROM (VALUES
    ('Affi Kart Indoor',               'Veneto',                'Affi'),
    ('Lignano Circuit',                'Friuli-Venezia Giulia', 'Precenicco'),
    ('Kartodromo Le Querce',           'Umbria',                'Cascia'),
    ('Pista Karting Arcobaleno',       'Umbria',                'Trevi'),
    ('Kartodromo del Sole',            'Calabria',              'Palmi'),
    ('Circuito Kartodromo di Avola',   'Sicilia',               'Avola'),
    ('Kartodromo Lascari',             'Sicilia',               'Lascari'),
    ('Miniautodromo Il Lombrico',      'Sicilia',               'Milazzo')
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
