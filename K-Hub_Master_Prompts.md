# K-Hub — Master Prompts per Claude Code
(Versione adattata allo stack reale: React + Vite + Supabase + scraper Python. Gli originali di Gemini presumevano Flutter/Dart.)

> Come usarli: apri il terminale nella cartella del progetto K-Hub, lancia `claude`, e incolla un prompt alla volta. Il file CLAUDE.md nella root del progetto fornisce già tutto il contesto: non serve incollare albero file o schema.

---

## STEP 1 — Verifica contesto (rapido, il CLAUDE.md fa il grosso)

Leggi CLAUDE.md e ispeziona il progetto (database_schema.sql, frontend/src, scraper/). Non scrivere codice. Rispondi solo con "CONTESTO ACQUISITO" e conferma in massimo 3 righe di aver individuato: (1) l'assenza del layer statistiche, (2) i filtri mockati in Calendar.jsx, (3) i problemi di RLS/deduplica dello scraper.

---

## STEP 2 — Backend e logiche statistiche

PROCEDI STEP 2 - BACKEND E LOGICHE STATISTICHE

# OBIETTIVO
Estendere K-Hub con il layer dati e la logica di business per i risultati delle gare e le statistiche dei piloti, in modo efficiente e nei limiti del free tier Supabase.

# REQUISITI DA SVILUPPARE
1. **Schema esteso (migration SQL)**: crea in una nuova migration le tabelle `pilots` (o profiles legata ad auth.users), `race_results` (evento, pilota, posizione, punti), `lap_times` (risultato, numero giro, tempo in millisecondi) e `regulations` (regolamento per evento: zavorre, format qualifica, note) con FK, indici appropriati (event_date, event_type, pilot_id) e RLS corretta (lettura pubblica, scrittura solo autenticata/owner). Correggi anche la policy INSERT troppo permissiva su events.
2. **Motore statistiche lato DB**: viste o funzioni RPC Postgres per best lap, media tempi, gare disputate, podi e classifiche per pilota — le aggregazioni NON vanno fatte in JavaScript sul client.
3. **Aggregazione eventi e filtri veri**: aggiungi le colonne mancanti (region, format) a events, e sposta i filtri di Calendar.jsx dentro le query Supabase (con paginazione).
4. **Layer di servizio frontend**: crea repository/service JS in frontend/src/lib (usando il client unico di lib/supabase.js) con caching in memoria leggero per ridurre le chiamate.
5. **Scraper**: aggiungi deduplica (upsert su chiave naturale tipo source_url + event_date) per evitare duplicati a ogni run.

# REGOLE DI OUTPUT
- Query ottimizzate, gestione errori e dati incompleti (gare senza tutti i tempi).
- Migration SQL in file separati e idempotenti dove possibile.
- Non rompere le pagine esistenti; refactor del client Supabase duplicato incluso.
- Procedi in iterazioni: prima proponi lo schema, attendi conferma, poi implementa.

---

## STEP 3 — Frontend, dashboard e data visualization

PROCEDI STEP 3 - FRONTEND E DATA VISUALIZATION

# OBIETTIVO
Costruire l'interfaccia "da pilota" di K-Hub: sportiva, tecnica, altamente leggibile, coerente con lo stile brutalist già presente in index.css.

# REQUISITI DA SVILUPPARE
1. **Dashboard Pilota** (nuova route /dashboard, protetta da Auth): statistiche personali chiave a colpo d'occhio — gare disputate, podi, best lap assoluti — con widget d'impatto e grafici leggeri.
2. **Hub Eventi**: migliora Calendar.jsx con i filtri veri lato DB (regione, formato, tipo, kart), paginazione e card evento con circuito, data e format.
3. **Classifiche e tempi**: tabelle responsive per lap times e leaderboard post-gara, numeri incolonnati perfettamente (font mono), leggibili anche su schermi stretti.

# REGOLE DI OUTPUT
- Codice React pronto per la produzione, coerente con la palette e le classi esistenti (card-snappy, btn-snappy, variabili --castrol-*).
- Librerie di grafici solo se strettamente necessarie (valuta prima widget custom in SVG/CSS; se serve una lib, una leggera tipo recharts — NON fl_chart, che è Flutter).
- Tipografia motorsport: tecnica e contrastata, font mono per i tempi.
- Procedi in iterazioni: mockup/struttura → conferma → implementazione.
