# K-Hub — Contesto Progetto

## Cos'è
K-Hub è una piattaforma web per aggregare eventi di rental karting in Italia e (in roadmap) tracciare le statistiche dei piloti a livello nazionale. Target: piloti rental, in particolare neofiti.

## Stack reale (NON Flutter — attenzione, vecchi prompt lo presumevano)
- **Frontend**: React 19 + Vite + Tailwind CSS v4, react-router-dom v7, lucide-react per le icone. Stile "brutalist/sportivo" con CSS custom in `frontend/src/index.css` (variabili tipo `--castrol-red`, classi `card-snappy`, `btn-snappy`).
- **Backend**: Supabase (PostgreSQL + Auth), RLS attiva. Schema in `database_schema.sql`.
- **Scraper**: Python (`scraper/scraper_base.py`) con Playwright + playwright-stealth + BeautifulSoup; ingerisce le gare SWS italiane da sodiwseries.com nella tabella `events`. Gira su Windows: attenzione all'encoding nelle print (evitare emoji/caratteri non-ASCII in output console).
- **Deploy/vincoli**: solo free tier Supabase e Vercel. Nessuna spesa.

## Stato attuale
- DB: solo due tabelle — `tracks` (id, name, region, city, website_url) ed `events` (id, title, track_id FK, track_name denormalizzato, event_date, event_type, engine_type, price, is_beginner_friendly, source_url, scraped_at, created_at).
- Pagine React: Home, Calendar (lista eventi + filtri), TracksDirectory, RkcAsi, OrganizerDashboard (inserimento manuale eventi), Auth.
- Scraper SWS funzionante (Playwright non-headless con Chrome reale dell'utente).

## Problemi noti / debito tecnico (da analisi architetturale)
1. **Manca del tutto il layer statistiche**: nessuna tabella per piloti, risultati, tempi sul giro, classifiche. È il prossimo grande blocco di lavoro.
2. **Query e filtri inefficienti**: `Calendar.jsx` fa `select('*')` senza paginazione e filtra in JavaScript; i filtri regione/formato sono mockati sul titolo. Servono colonne dedicate (region, format), indici su `event_date`/`event_type`, e filtri spostati nelle query Supabase.
3. **Client Supabase duplicato**: ogni pagina crea il proprio client con `createClient`. Esiste `frontend/src/lib/supabase.js` — usare SOLO quello ovunque.
4. **RLS troppo permissiva**: la policy INSERT su `events` è `WITH CHECK (true)` — chiunque con la anon key può inserire. Nessuna deduplica lato scraper (rischio eventi duplicati a ogni run).
5. **Date non uniformi**: `OrganizerDashboard` accetta la data come testo libero (es. "15-08-2026") mentre il DB ha `event_date DATE` e lo scraper scrive YYYY-MM-DD. Uniformare con input type="date".

## Convenzioni
- Lavorare in iterazioni: proporre → conferma → implementare.
- Query sui tempi/classifiche ottimizzate lato DB (viste o RPC Postgres), non aggregazioni in JS sul client.
- Gestire sempre dati incompleti (circuiti che non forniscono tutti i tempi).
- UI: look sportivo/tecnico, numeri leggibili, tabelle responsive anche su schermi stretti.
- Commit piccoli e descrittivi.

## Roadmap concordata
- **Step 2 — Backend e logiche statistiche**: estendere lo schema (pilots/profiles, results, lap_times, regulations legati agli eventi), scrivere migration SQL, viste/RPC per medie, best lap e classifiche, layer di servizio JS (repository) con caching leggero, deduplica scraper, fix RLS.
- **Step 3 — Frontend e data visualization**: Dashboard Pilota (gare disputate, podi, best lap), Hub Eventi migliorato (filtri veri da DB), tabelle classifiche/tempi responsive. Palette motorsport, grafici leggeri (fl_chart NON esiste in React: usare widget custom o una lib leggera solo se necessario).
