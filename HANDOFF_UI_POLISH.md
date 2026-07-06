Copia da qui in giù nella nuova chat per lo STEP 4:

Continuiamo K-Hub. Leggi CLAUDE.md per il contesto generale e la Roadmap (Step 2 e 3 CHIUSI e verificati — non ricontrollare da zero). Questa chat = **Step 4 — Rimozione Classifica nazionale + guida neofiti**.

## COSA FARE (Step 4, frontend only, nessuna migration)
Decisione presa con l'utente il 2026-07-06: la **Leaderboard nazionale va TOLTA**. Motivo: K-Hub è un aggregatore, con organizzatori/format/piste diversi i punti non sono confrontabili → una classifica nazionale è fuorviante. Al suo posto: una **guida "Come iniziare col rental"** per i neofiti (target primario del progetto).

Sotto-task:
1. Rimuovere la voce navbar "Classifica" (`frontend/src/components/Navbar.jsx`), la route `/leaderboard` (`frontend/src/App.jsx`) e l'import di `Leaderboard`.
2. Decidere con l'utente se la pagina `Leaderboard.jsx` va cancellata o solo scollegata. NON toccare il DB: lasciare `getLeaderboard` in `pilotsRepository` e la vista `v_pilot_leaderboard` intatti, così la classifica resta recuperabile in futuro.
3. Creare la guida neofiti (nuova pagina es. `GuidaRental.jsx` o sezione): contenuti utili per chi inizia (cos'è il rental, tipi di format Sprint/Endurance/Ironman, come leggere un calendario, come prenotare una pista, glossario base). Stile "brutalist/sportivo" esistente (`card-snappy`, `--castrol-red` in `frontend/src/index.css`). Proporre la struttura dei contenuti all'utente PRIMA di scrivere tanto testo.
4. Wiring: link alla guida dalla navbar (riusa lo slot liberato) e/o dalla Home.

## STATO ATTUALE (verificato, non ricontrollare da zero)
- DB Supabase live (`yiysqhbtmjdpooznsgbg`) su migrations 001→004 applicate. **Migration 005_seed_tracks.sql pronta ma NON ancora applicata** (serve per lo Step 5, non per questo). CLI Supabase senza access token: mai scritture di test dirette sul DB di produzione.
- Scraper multi-fonte (SWS/WeRace/XRace/KRM) testato con run reale. Scheduling deliberatamente NON implementato (manuale: `python scraper/run_all.py`).
- Frontend: layer repository completo in `frontend/src/lib/`. Pagine: Home, Calendar, TracksDirectory, RkcAsi, Leaderboard (DA RIMUOVERE), Dashboard pilota, EventDetails, OrganizerDashboard, Auth.
- Deploy: `frontend/vercel.json` + `frontend/public/_redirects` pronti, non ancora deployato (Step 8).

## VINCOLI
- Solo free tier Supabase e Vercel, niente nuove dipendenze pesanti (niente lib di grafici/mappe).
- Verificare `npm run build` in `frontend/` prima di committare; controllare visivamente col dev server (`npm run dev`).
- Commit piccoli e descrittivi. Lavorare in iterazioni: proporre → conferma → implementare.

## PROSSIMI STEP (una chat ciascuno, vedi Roadmap in CLAUDE.md)
- Step 5 — Piste: mappa SVG Italia cliccabile (applicare prima migration 005).
- Step 6 — Calendario: filtri a chip + lista per data + toggle vista mese.
- Step 7 — RKC ASI: scraper dedicato da https://www.rkcasikarting.it/ + flag DB.
- Step 8 — Deploy su Vercel.
