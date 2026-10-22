# Piano di lancio K-Hub (ottobre 2026)

Nato dall'analisi della concorrenza del 22/10/2026. Studio completo (tempi,
costi, ricavi, decisioni col socio): doc "K-Hub — Piano di lancio, costi e
ricavi" su claude.ai. Qui solo i task operativi.

**Come si usa**: un task = una chat nuova. Si apre la chat col modello e
l'effort indicati e si scrive: `Esegui il task T03 di docs/piano-lancio.md`.
A fine task la chat aggiorna lo stato qui sotto e CLAUDE.md, poi apre una PR.

Date chiave: soft launch **17/11/2026** (amici e gruppi di piloti), lancio
pubblico **01/02/2027**, verifica a **30/04/2027** (sotto 50 click al mese su
"Iscriviti" si ripensa il progetto).

Criteri per il soft launch: almeno 30 gare future, scraper verde 7 giorni di
fila, email di permesso inviate, pulsante "Iscriviti" in ogni gara, nessuna
sezione vuota senza spiegazione, pagina privacy online.

| ID | Task | Modello | Effort | Ore | Dipende da | Stato |
| --- | --- | --- | --- | --- | --- | --- |
| T01 | Scraper giornaliero in CI + primo run reale | Sonnet 5.5 | medium | 2 | service role key nei secret | da fare |
| T02 | Messaggi di stato onesti | Sonnet 5.5 | low | 1 | — | da fare |
| T03 | Pulsanti "Iscriviti" e "Tempi live" | Sonnet 5.5 | medium | 3 | — | da fare |
| T04 | Email di permesso alle fonti + riga "Fonte" | Opus 5.5 | low | 1 | — | da fare |
| T05 | Privacy, note legali, analytics senza cookie | Sonnet 5.5 | medium | 2 | — | da fare |
| T06 | Dominio + spostamento su Cloudflare Pages | Sonnet 5.5 | low | 1,5 | dominio comprato | da fare |
| T07 | Ruolo organizzatore e RLS più stretta | Opus 5.5 | high | 3 | — | da fare |
| T08 | Contatti alle serie non coperte | Opus 5.5 | medium | 2 | T07 | da fare |
| T09 | SEO di base | Sonnet 5.5 | high | 3 | T06 | da fare |
| T10 | Etichetta "Adatta a chi inizia" | Sonnet 5.5 | medium | 2 | T03 | da fare |
| T11 | Feed iCal per regione | Sonnet 5.5 | medium | 2 | T01 | da fare |
| T12 | Conteggio click su "Iscriviti" | Sonnet 5.5 | medium | 1,5 | T03 | da fare |
| T13 | Nuovi scraper per le serie che danno il permesso | Sonnet 5.5 | high | 3 a fonte | T08 | da fare |
| T14 | Proposta codice sconto a WeRace e XRace | Opus 5.5 | medium | 1 | T12 | da fare |
| T15 | Controllo mensile | Haiku 5.5 | low | 0,5/mese | T12 | da fare |

Fuori scope finché gli organizzatori non caricano risultati: classifica
nazionale piloti e nuove statistiche (area pilota resta com'è).

---

## Fase A — Dati freschi (27/10 – 02/11)

### T01 — Scraper giornaliero in CI + primo run reale
Oggi `.github/workflows/scraper.yml` parte solo a mano e il DB ha 3 gare
future (ultimo inserimento 01/10/2026). Obiettivo: run reale automatico ogni
giorno.
- Prerequisito utente: `SUPABASE_SERVICE_ROLE_KEY` e gli altri secret del
  workflow presenti su GitHub. Se mancano, fermati e dimmi esattamente dove
  inserirli.
- Aggiungi `schedule` (una volta al giorno, orario notturno italiano) che
  esegue il run reale. Il job reale oggi usa l'Environment `scraper-prod`, che
  può avere "Required reviewers": un run schedulato resterebbe in attesa.
  Proponi la soluzione (es. environment separato senza reviewer per lo
  schedule, mantenendo l'approvazione per i run manuali con `force_prune`).
- Il primo run reale segue la checklist di `docs/test-run-scraper.md`.
- Se il job fallisce, deve risultare rosso (GitHub manda la mail): niente
  errori silenziosi.
- Fatto quando: un run schedulato è verde e le gare XRace del 31/10 e 07/11
  sono nel DB.

### T02 — Messaggi di stato onesti
- `RkcAsi.jsx`: quando non ci sono tappe future, messaggio "Calendario
  2026/27 non ancora pubblicato da RKC ASI" con data dell'ultimo controllo
  (max `updated_at`/`created_at` delle righe `series='rkc_asi'`, via
  `eventsRepository`). Riusa `components/kh/EmptyState.jsx`.
- Area statistiche pilota (`Dashboard.jsx`, link in header/home): se il DB non
  ha risultati, nasconderla dalla navigazione o mostrare uno stato vuoto che
  spiega che arriverà quando gli organizzatori caricano i risultati. Proponi
  la scelta prima di implementare.
- Fatto quando: nessuna pagina mostra una sezione vuota senza spiegazione.

### T03 — Pulsanti "Iscriviti" e "Tempi live"
- Migration `013`: colonne `events.registration_url` e `events.live_url`
  (text, nullable). Da applicare a mano dall'utente nel SQL editor.
- Scraper: `registration_url` = pagina evento della fonte (oggi `source_url`)
  per WeRace, RKC ASI, XRace; KRM ha iscrizione telefonica, lascia nullo.
- UI: in `EventDetails.jsx` e nelle card del calendario due pulsanti grandi
  stile Manifesto. "Iscriviti" ricade su `source_url` se `registration_url` è
  nullo; "Tempi live" appare solo se `live_url` c'è. Link esterni con
  `rel="noopener"`.
- `OrganizerDashboard.jsx`: due campi facoltativi nel form evento.
- Fatto quando: ogni gara futura ha un "Iscriviti" funzionante.

## Fase B — Fonti e regole (03/11 – 09/11)

### T04 — Email di permesso alle fonti + riga "Fonte"
- Scrivi 4 email brevi in italiano (WeRace, RKC ASI, XRace, KRM): chi siamo,
  cosa raccogliamo (data, pista, prezzo, link), che ogni gara rimanda a loro
  per l'iscrizione, che rimuoviamo su richiesta, proposta di collaborazione.
  Crea le bozze in Gmail se il connettore è disponibile, altrimenti in un file
  in `docs/`. Gli indirizzi li trovi sui siti delle fonti; se non li trovi,
  chiedili.
- In `EventDetails.jsx` aggiungi "Fonte: <nome sito>" con link.
- Niente descrizioni lunghe, foto o loghi copiati dalle fonti.

### T05 — Privacy, note legali, analytics senza cookie
- Pagina `/privacy` (route + link nel footer): dati raccolti da Supabase Auth
  (email), finalità, conservazione, contatto (`CONTACT_EMAIL` in
  `frontend/src/lib/contact.js`), nessun cookie di profilazione.
- Nota nel footer: dati delle gare da fonti pubbliche, iscrizione sempre sul
  sito dell'organizzatore.
- Analytics senza cookie (Cloudflare Web Analytics, gratuito): snippet nel
  build di produzione. Niente banner se non servono cookie.

### T06 — Dominio + spostamento su Cloudflare Pages
Il piano Hobby di Vercel vieta l'uso commerciale (affiliazioni, pubblicità,
pagamenti): va lasciato prima di monetizzare.
- Prerequisito utente: dominio comprato (es. k-hub.it).
- Configura Cloudflare Pages (build Vite in `frontend/`, fallback SPA per le
  route dirette, env `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` anche per le
  preview), dominio custom, URL di redirect in Supabase Auth.
- Verifica tutte le route da link diretto, poi spegni il deploy Vercel.

## Fase C — Organizzatori (10/11 – 16/11)

### T07 — Ruolo organizzatore e RLS più stretta
Debito noto n.1 in CLAUDE.md: oggi qualsiasi utente loggato può scrivere
risultati altrui. Prima di invitare organizzatori esterni:
- `profiles.role` (`pilot` | `organizer` | `admin`), assegnato solo da admin.
- RLS: solo organizer/admin inseriscono eventi; ognuno modifica solo gli
  eventi con `created_by = auth.uid()`; `race_results`/`lap_times` scrivibili
  solo dall'organizzatore dell'evento; le righe dello scraper (`created_by`
  nullo) restano intoccabili dal client.
- Migration da applicare a mano, con SQL di verifica e rollback. Mai scritture
  di test sul DB di produzione.
- `OrganizerDashboard.jsx`: accesso solo col ruolo giusto, messaggio chiaro
  agli altri.

### T08 — Contatti alle serie non coperte
- Serie: IRK Promotion, Futura Corse (Open Karting Rental Series), Romagna
  Rental Karting, Misanino Cup, Pomposa Endurance, Draft Cup (Kart&Go).
- Per ognuna: sito, contatto, come pubblica il calendario (pagina leggibile,
  API, solo social/WhatsApp) e se ha termini d'uso che vietano il riuso.
- Messaggio breve per ciascuna: inserimento gratuito dall'area organizzatore o
  raccolta automatica col loro permesso.
- Output: tabella in `docs/ricerca-fonti-copertura.md` + bozze messaggi.

### T09 — SEO di base
- Titolo e description per ogni route (estendi `useDocumentTitle.js`).
- `sitemap.xml` con piste e pagine regione; `robots.txt`.
- Dati strutturati JSON-LD `SportsEvent` in `EventDetails.jsx`.
- Valuta se serve prerendering per le pagine chiave (SPA Vite) e proponi la
  via gratuita più semplice.

## Fase D — Prima della stagione (dicembre – gennaio)

### T10 — Etichetta "Adatta a chi inizia"
- Campo `events.beginner_friendly` (boolean) e `events.price_eur` se non
  esiste già un costo strutturato. Scraper: vero per classi Rookie, "nessuna
  esperienza richiesta" (WeRace), "La tua prima gara" (XRace).
- Chip filtro in `Calendar.jsx` + etichetta sulla card + rimando a
  `GuidaRental.jsx` ("cosa portare").

### T11 — Feed iCal per regione
- URL `.ics` per regione da aggiungere a Google Calendar, generato dai dati
  esistenti a costo zero (Supabase Edge Function o file statici generati dallo
  scraper: proponi tu).
- Pulsante "Aggiungi al calendario" in `Calendar.jsx` quando c'è un filtro
  regione.

### T12 — Conteggio click su "Iscriviti"
- Tabella `outbound_clicks` (event_id, kind, created_at, nessun dato
  personale) con insert anonimo limitato via RLS, oppure parametri UTM se le
  fonti li leggono. Proponi tu.
- Query o vista con click per mese e per organizzatore: è il numero che
  decide se continuare (soglia 50/mese a fine aprile 2027).

### T13 — Nuovi scraper per le serie che danno il permesso
Uno per chat, solo per le serie che hanno risposto sì in T08. Stesso schema
delle fonti esistenti: `it-scraper-toolkit`, alias pista, `--dry-run`, test.

### T14 — Proposta codice sconto
Email a WeRace (programma affiliati) e XRace (sconto 10% prima gara): codice
"K-Hub" per la prima gara, con i numeri di T12. Niente commissioni al primo
giro: prima il dato.

## Dopo il lancio

### T15 — Controllo mensile
Ogni inizio mese: gare future in DB, run scraper falliti, click su
"Iscriviti" (T12), visitatori (analytics), organizzatori che pubblicano da
soli, nomi pista senza alias. Report di 10 righe, nessuna modifica al codice.
