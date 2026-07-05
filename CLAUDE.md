# K-Hub — Contesto Progetto

## Cos'è
K-Hub è una piattaforma web per aggregare eventi di rental karting in Italia e (in roadmap) tracciare le statistiche dei piloti a livello nazionale. Target: piloti rental, in particolare neofiti.

## Stack reale (NON Flutter — attenzione, vecchi prompt lo presumevano)
- **Frontend**: React 19 + Vite + Tailwind CSS v4, react-router-dom v7, lucide-react per le icone. Stile "brutalist/sportivo" con CSS custom in `frontend/src/index.css` (variabili tipo `--castrol-red`, classi `card-snappy`, `btn-snappy`).
- **Backend**: Supabase (PostgreSQL + Auth), RLS attiva. Schema base in `database_schema.sql`, esteso dalle migration in `migrations/` (001→004, applicate al DB live a mano via SQL editor: il CLI Supabase non ha access token su questa macchina — mai tentare scritture di test sul DB di produzione).
- **Scraper**: Python con Playwright + playwright-stealth + BeautifulSoup, 4 fonti: SWS (`scraper_base.py`, Chrome reale non-headless), WeRace/XRace/KRM (orchestrate da `run_all.py`). Scrive nella tabella `events` con upsert dedup su `(source_url, event_date)` e arricchisce region/format a scrape-time. Gira su Windows: attenzione all'encoding nelle print (evitare emoji/caratteri non-ASCII in output console).
- **Deploy/vincoli**: solo free tier Supabase e Vercel. Nessuna spesa.

## Stato attuale (luglio 2026 — Step 2 e 3 completati)
- DB live (ref `yiysqhbtmjdpooznsgbg`) allineato a `migrations/001→004`: `tracks`, `events` (+ region, format, created_by), `profiles`, `race_results`, `lap_times`, `regulations`; vista `v_pilot_leaderboard`; RPC `get_pilot_stats(p_pilot_id)` e `get_event_standings(p_event_id)`; indice UNIQUE completo su `events(source_url, event_date)`.
- Frontend: TUTTE le query dati passano dal layer repository in `frontend/src/lib/` (`eventsRepository`, `pilotsRepository`, `tracksRepository`, `resultsRepository`, cache TTL in `cache.js`); il client Supabase esiste solo in `lib/supabase.js` e le pagine lo usano direttamente solo per l'auth.
- Pagine React: Home, Calendar (filtri veri da DB + paginazione), TracksDirectory, RkcAsi, Leaderboard (classifica nazionale), Dashboard pilota (KPI + trend punti + storico), EventDetails (classifica + accordion tempi), OrganizerDashboard (inserimento eventi + risultati/tempi con import bulk), Auth.

## Problemi noti / debito tecnico
1. **RLS lasca su risultati**: le policy su `race_results`/`lap_times` sono `FOR ALL TO authenticated WITH CHECK (true)` — qualsiasi utente loggato può inserire/modificare risultati altrui. Accettato per l'MVP; in futuro serve un ruolo organizer.
2. **Scraper non testato post-refactor**: l'upsert dedup e l'arricchimento region/format non hanno ancora avuto un run reale contro il DB live.
3. **Nessuna UI di modifica/cancellazione risultati**: OrganizerDashboard permette solo l'inserimento; errori di battitura si correggono solo dal DB.
4. **Artefatti di debug tracciati in git**: `scraper/sws_races.html` + `sws_races_files/`, `debug_screenshot.png` — da pulire dopo aver verificato che l'HTML non serva come fixture.

## Convenzioni
- Lavorare in iterazioni: proporre → conferma → implementare.
- Query sui tempi/classifiche ottimizzate lato DB (viste o RPC Postgres), non aggregazioni in JS sul client.
- Gestire sempre dati incompleti (circuiti che non forniscono tutti i tempi).
- UI: look sportivo/tecnico, numeri leggibili, tabelle responsive anche su schermi stretti.
- Commit piccoli e descrittivi.

## Roadmap
- **Step 2 — Backend e logiche statistiche**: ✅ completato (luglio 2026) — schema esteso via migration 001→004, viste/RPC, layer repository con caching, deduplica scraper, fix RLS.
- **Step 3 — Frontend e data visualization**: ✅ completato (luglio 2026) — Dashboard Pilota, Leaderboard nazionale, EventDetails con classifiche/tempi, filtri veri da DB, inserimento risultati, fix region/format scraper. Grafici con CSS/SVG custom, nessuna lib aggiuntiva.
- **Possibili sviluppi futuri (non concordati)**: run periodico dello scraper, ruolo organizer con RLS più stretta, modifica/cancellazione risultati, deploy su Vercel.
