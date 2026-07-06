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

### Fase rifinitura UX pre-deploy (concordata luglio 2026 — una chat per Step)
Decisioni prese con l'utente il 2026-07-06. Ogni Step è pensato per essere una sessione/chat autonoma (aprire una chat nuova per ognuno, così si risparmiano token e si mantiene alta la qualità). Ordine deciso: prima le 3 rifiniture UI (quick win testabili dagli amici), RKC ASI per ultimo perché tocca schema+scraper.

- **Step 4 — Rimozione Classifica nazionale + guida neofiti** (frontend only): la Leaderboard nazionale va TOLTA. Motivo: K-Hub è un aggregatore, con organizzatori/format/piste diversi i punti non sono confrontabili → una classifica nazionale è fuorviante, non solo disordinata. Rimuovere pagina `Leaderboard.jsx`, route `/leaderboard`, voce navbar "Classifica". Al suo posto: una sezione/pagina guida "Come iniziare col rental" pensata per i neofiti (target primario). Valutare se riusare lo slot navbar o solo linkarla dalla Home. NON rimuovere `getLeaderboard`/`v_pilot_leaderboard` dal DB (nessuna migration): solo scollegare la UI, così resta recuperabile.
- **Step 5 — Piste: mappa SVG Italia cliccabile** (frontend + applicazione seed): sostituire la griglia di riquadri in `TracksDirectory.jsx` con una mappa SVG dell'Italia con regioni cliccabili (nessuna libreria esterna tipo Leaflet/Google Maps: pesanti, tile esterni, chiavi/costi → contro i vincoli free tier). Click regione → filtra le piste sotto; regioni con piste evidenziate (rosso Castrol), vuote in grigio. PRECONDIZIONE: applicare a mano `migrations/005_seed_tracks.sql` nel SQL editor Supabase PRIMA, altrimenti la mappa è quasi vuota. Le piste hanno già il campo `region`.
- **Step 6 — Calendario: filtri a chip + vista dinamica** (frontend only): in `Calendar.jsx` sostituire il pannello con 4 `<select>` sempre aperti con una barra sottile a chip + "Filtri avanzati" collassabile e chip filtri attivi rimovibili. Aggiungere raggruppamento eventi per data (es. "Questo weekend", "Prossima settimana", "Luglio"…) + toggle a vista calendario mensile (griglia mese con eventi sui giorni). Attenzione al responsive su mobile per la vista mese.
- **Step 7 — RKC ASI: sorgente dati reale** (schema + scraper + frontend, il più pesante): fonte trovata = https://www.rkcasikarting.it/ — organizzato per campionato (Sprint Outdoor/Indoor, Endurance) e stagione, con coordinatori regionali e pagine "RISULTATI & LIVE-TIMING" per location, NON una semplice tabella regione→gare. Sotto-task: (a) discovery della struttura URL reale del sito; (b) campo DB dedicato per marcare le tappe ufficiali (es. `events.is_rkc_asi boolean` o `events.series text`) via nuova migration da applicare a mano — NIENTE più match euristico sul titolo (vedi memoria `rkc-asi-scope`); (c) scraper Python dedicato che scrive le tappe col flag; (d) wiring di `RkcAsi.jsx` per interrogare solo gli eventi marcati, per regione. Da concordare schema/scraper con l'utente prima di toccarli.
- **Step 8 — Deploy su Vercel** (dopo le rifiniture): `frontend/vercel.json` e `_redirects` già pronti. Mettere online per far testare agli amici e raccogliere feedback.

- **Possibili sviluppi futuri (non concordati)**: run periodico dello scraper, ruolo organizer con RLS più stretta, modifica/cancellazione risultati.
