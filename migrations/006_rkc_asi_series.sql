-- Migration 006: flag per le tappe ufficiali RKC ASI (Step 7).
-- Idempotente: eseguibile più volte senza errori su un DB già migrato.
-- Da applicare a mano nel SQL editor di Supabase (nessun access token CLI
-- su questa macchina, vedi CLAUDE.md).
--
-- Niente colonna dedicata per il "gruppo regionale" RKC ASI (es. "Sicilia 1",
-- "Emilia Romagna 1 - Marche 1"): la struttura dei coordinatori RKC ASI e'
-- frammentata e non coincide con le 20 regioni amministrative, quindi le
-- tappe usano la region FISICA gia' esistente (stessa colonna/euristica di
-- Calendar/TracksDirectory).

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series TEXT
    CHECK (series IS NULL OR series IN ('rkc_asi'));

CREATE INDEX IF NOT EXISTS idx_events_series ON public.events (series);
