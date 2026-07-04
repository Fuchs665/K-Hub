-- 004 — Indice UNIQUE completo per la dedup dello scraper.
--
-- La 001 creava l'indice come parziale (WHERE source_url IS NOT NULL), ma
-- PostgREST non puo' usare indici parziali come arbitri di ON CONFLICT:
-- l'upsert dello scraper (.upsert(on_conflict="source_url,event_date"))
-- fallirebbe con "no unique or exclusion constraint matching".
-- L'indice completo ha semantica identica: i NULL restano distinti di
-- default, quindi gli eventi manuali senza source_url non collidono mai.
-- Idempotente: rieseguibile senza effetti collaterali.

DROP INDEX IF EXISTS public.events_source_url_event_date_key;

-- Dedup preventiva (stessa logica della 001), nel caso siano comparsi
-- duplicati tra l'applicazione della 001 e questa migration.
DELETE FROM public.events a
    USING public.events b
    WHERE a.source_url IS NOT NULL
    AND a.source_url = b.source_url
    AND a.event_date = b.event_date
    AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS events_source_url_event_date_key
    ON public.events (source_url, event_date);
