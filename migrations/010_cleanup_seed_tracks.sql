-- ============================================================
-- Migration 010: pulizia seed piste 007-009
-- ============================================================
-- Esito della ricerca in docs/ricerca-fonti-copertura.md (§B):
--  * rimuove piste non trovate o non-kart: Sardinia Circuit (circuito
--    supermoto), Kartodromo Paradiso, Pista Eurokart Torre Lapillo,
--    Pista Sestugo (nessuna evidenza), Pista Fanelli (ultima attivita'
--    nota 2019), Kartodromo 2000, Kartodromo Palazzo;
--  * corregge citta'/nome incoerenti con le fonti: Lignano Circuit ha
--    sede a Precenicco (UD), PG Corse a Ronco Scrivia (GE), "Vicenza
--    Kart" e' "Vicenza Kart Indoor".
-- Rimuove anche Kartodromo 2000 (omonimo di Lucera, nessuna evidenza
-- recente) e Kartodromo Palazzo (pista riservata ai soci di un'ASD).
-- Idempotente e sicuro sia che 007-009 siano gia' applicate sia che no:
-- i DELETE non toccano piste referenziate da eventi (events.track_id).
-- NB: le stesse modifiche sono ora anche dentro 008/009, quindi su un DB
-- nuovo questa migration e' un no-op; serve solo dove 008/009 erano gia'
-- state applicate nella versione precedente.
-- Da applicare a mano nel SQL editor di Supabase, DOPO 007-009.

DELETE FROM public.tracks t
WHERE lower(t.name) IN (
    'sardinia circuit',
    'kartodromo paradiso',
    'pista eurokart torre lapillo',
    'pista sestugo',
    'pista fanelli',
    'kartodromo 2000',
    'kartodromo palazzo'
)
AND NOT EXISTS (SELECT 1 FROM public.events e WHERE e.track_id = t.id);

UPDATE public.tracks SET city = 'Precenicco'
WHERE lower(name) = 'lignano circuit' AND city IS DISTINCT FROM 'Precenicco';

UPDATE public.tracks SET city = 'Ronco Scrivia'
WHERE lower(name) = 'pista kart pg corse' AND city IS DISTINCT FROM 'Ronco Scrivia';

-- Rinomina solo se il nome nuovo non esiste gia' (evita duplicati).
UPDATE public.tracks SET name = 'Vicenza Kart Indoor'
WHERE lower(name) = 'vicenza kart'
  AND NOT EXISTS (SELECT 1 FROM public.tracks x WHERE lower(x.name) = 'vicenza kart indoor');
