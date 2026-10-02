# Ricerca fonti e copertura — Toscana e altre regioni

Data: 2026-10-02 · Branch: `docs/ricerca-fonti-toscana` · Solo ricerca: nessuna modifica a codice, scraper o DB.

## 0. Limiti di questa ricerca (leggere prima)

- **Nessun sito è stato aperto direttamente.** Il proxy di rete della sessione blocca ogni dominio fuori allowlist (`circuitodisiena.it`, `futuracorse.it`, `pistadelmare.com`, `ivanorganizza.it`, `openkartingrentalseries.altervista.org`, `yumping.com`, `rkcasikarting.it`, `tkart.it`, `acisport.it`: tutti `403 EGRESS_BLOCKED` sia con `curl` sia con WebFetch).
- **Di conseguenza non ho potuto verificare**: `robots.txt`, condizioni d'uso, presenza di `wp-json/tribe/events/v1/events`, formato tecnico reale, data dell'ultimo evento visibile. Nelle tabelle questi campi sono marcati **non verificato** e il formato è solo un'ipotesi.
- Tutto il resto viene dagli **snippet della ricerca web**. Le schede directory (yumping, holidoit, expedia) dicono che una pista *esiste*, non che oggi sia aperta: dove l'unica prova è una scheda senza data lo scrivo.
- Prima di implementare qualsiasi scraper serve rifare i controlli tecnici da una macchina senza questo proxy (comandi al §6).

Legenda fattibilità: **alta** = API/WordPress pubblica (stile rkcasikarting.it); **media** = HTML statico da parsare; **bassa** = social/PDF/WhatsApp/solo directory.

---

## A. Fonti di gare per la Toscana

### A.1 Candidati trovati

| # | Candidato | URL | Cosa espone (da snippet) | Formato tecnico | Aggiornamento | robots / ToS | Fattibilità / sforzo |
|---|---|---|---|---|---|---|---|
| 1 | **Campionato Karting Toscana** (Futura Corse) | https://futuracorse.it/campionato-karting-toscana/ | Campionato **rental** solo in Toscana/Umbria, 2 formule (STAR / ROOKIE), età 15+, nessuna quota d'iscrizione. Il sito indica **4 round: 2 a Siena, 2 a Cecina**. Date/costi/link iscrizione non visti | **non verificato** (sito web aziendale; WordPress possibile ma non provato) | Non verificato: stagione e ultimo evento non visibili | non verificato | **Media**. È l'unico calendario rental toscano trovato, ma sono ~4 date/anno: **inserimento manuale** (migration o OrganizerDashboard) costa meno di uno scraper. Scraper solo se il sito ha una pagina calendario strutturata |
| 2 | **Circuito di Siena** (Pista Internazionale) | https://circuitodisiena.it/ | Pista 1.037 m, omologata ACI, 50 kart a noleggio, ospita Campionato Italiano ACI Karting (round a Siena, ultimo nello snippet: giugno 2024), Campionato Regionale Toscana ([vroomkart](https://www.vroomkart.it/news/37390/in-toscana-il-karting-riparte-con-il-campionato-regionale-al-circuito-di-siena)) | non verificato (il seed 007 lo cita come sito ufficiale) | non verificato | non verificato | **Media/bassa**: probabile che gli eventi nazionali stiano sui calendari ACI Sport, non qui. Sono gare agonistiche (non rental): fuori target K-Hub salvo la tappa del #1 |
| 3 | **Pista del Mare** (Cecina) | https://www.pistadelmare.com/ | Kartodromo di 1.080 m, noleggio singolo/aziendale/gruppi, sede dei 2 round Cecina del #1 | non verificato | non verificato | non verificato | **Bassa**: sito di pista (probabile vetrina). Utile solo per confermare le date del #1 |
| 4 | **Open Karting Rental Series** | http://openkartingrentalseries.altervista.org/ | Serie rental su piste di **Emilia-Romagna, Veneto e Toscana**, settembre-aprile, domeniche. Il sito si chiama "23/24": **stagione probabilmente non aggiornata** | Altervista (hosting gratuito con editor visuale: HTML statico, **non** WordPress/Events Calendar) | Ultima stagione nel titolo: 23/24 (verificare se esiste 25/26) | non verificato | **Bassa**: HTML a mano, probabile abbandono. Da ricontrollare solo se ha una stagione 2026/27 |
| 5 | **ivanorganizza.it** — "Calendario gare kart rental in Italia" | https://www.ivanorganizza.it/calendario-gare-kart-in-italia/ | Dal titolo: aggregatore nazionale di gare kart rental (possibile concorrente diretto di K-Hub). Contenuto e regioni non visti | non verificato | non verificato | non verificato | **Da ispezionare per prima**: se espone un calendario strutturato copre più regioni con un solo scraper. Se è un aggregatore manuale vale anche contattarlo |
| 6 | **Toscano Racing** | https://www.toscanoracing.it/ | Appare nei risultati su "campionato regionale Toscana" e kart; ruolo (team? organizzatore?) **non chiaro** | non verificato | non verificato | non verificato | Non valutabile senza aprire il sito |
| 7 | **Elenco kartodromi omologati ACI Sport** | [acisport.it, elenco 2024](https://www.acisport.it/it/CIK/notizie/2024/119153/l'elenco-aggiornato-dei-kartodromi-omologati-in-italia-nbsp;/evento) | Elenco piste omologate (non gare) | non verificato (probabile PDF) | 2024 | non verificato | Utile solo per il censimento piste (Parte B/D), non come calendario |
| 8 | **Calendari ACI Karting / CSAI** | https://www.acisport.it/karting · [calendario 2026](https://tkart.it/en/news/features/2026-aci-karting-italian-championship-dates) | Campionato Italiano ACI Karting 2026 (apertura a Lonato). Gare **agonistiche**, non rental | HTML/notizie | 2026 | non verificato | **Bassa** per il target rental neofiti. Non consigliato come prima fonte |

### A.2 Piste toscane trovate (anagrafica, non calendari)

Già nel seed 007: Siena, Kartodromo 2000 (Sovicille), Pista del Mare (Cecina). Altre citate dai risultati ma **non** nel seed:

| Pista | Dove | Fonte | Stato |
|---|---|---|---|
| Mini Autodromo di Massa / Club del Miniautodromo | Massa (MS) | [yumping](https://www.yumping.com/en/karting/club-del-miniautodromo--e19682185) | scheda directory, gara GP da 1 h, età 14+; attività non datata |
| Planet Kart (indoor) | Prato | elenco forum motoclub-tingavert; una ricerca dedicata **non** l'ha confermata (ha trovato solo Planet Kart a Conselice e Serre) | non verificata |
| Hangar 42 | Calenzano (FI) | citata in un risultato; ricerca dedicata senza esito | non verificata |
| Pergolandia | vicino Forte dei Marmi (LU) | solo elenco forum | non verificata |

### A.3 Piattaforme di calendario già coperte

WeRace e RKC ASI sono già scrapate. Con le ricerche fatte **non ho trovato** tappe WeRace/RKC ASI in Toscana (la Toscana resta senza gare perché le piste toscane non compaiono su queste fonti). Da ricontrollare con una chiamata reale all'API `tribe` di WeRace filtrando per venue toscana.

### A.4 Test `wp-json/tribe/events/v1/events`

**Non eseguibile** da questa sessione (403 del proxy su tutti i domini toscani). Da eseguire a mano, vedi §6, sui domini #1, #2, #3, #5.

---

## B. Verifica piste seed 007-009

Criteri: **confermata** = fonte indipendente con attività/evento o sito ufficiale che la descrive come operativa; **dubbia** = solo scheda directory senza data, o dato incoerente col seed; **non trovata** = nessun risultato pertinente. "Non verificata" = non ho evidenza oltre la scheda.
Nessuna conferma è una verifica di apertura *oggi*: sono evidenze da ricerca, con data solo dove indicata.

### Migration 007 — Toscana

| Pista (seed) | Esito | Evidenza | Note |
|---|---|---|---|
| Pista Internazionale Siena | **confermata** | Round ACI Karting a Siena (giugno 2024 nello snippet) e noleggio 50 kart ([yumping](https://www.yumping.com/it/kart/circuito-di-siena--e17571), [tkart](https://tkart.it/en/news/features/massive-turnout-in-siena-for-the-second-round-of-the-italian-aci-karting-championship)) | Nome noto come "Circuito di Siena": possibile alias, vedi §C |
| Kartodromo 2000 (Sovicille) | **dubbia** | Solo scheda con indirizzo (aeroporto di Ampugnano) e telefono/fax, senza data | **Omonimia**: esiste anche un "Kartodromo 2000" a Lucera (Puglia) ([livetheworld](https://www.livetheworld.com/activities/italy/kartodromo-2000-lucera)). Con il match a sottostringa di `resolve_physical_region` rischia di assegnare la regione sbagliata |
| Pista del Mare (Cecina) | **confermata** | Sito ufficiale ([pistadelmare.com](https://www.pistadelmare.com/)) e sede dei round di Campionato Karting Toscana secondo il sito Futura Corse | Pista di 1.080 m, noleggio |

### Migration 008 — Veneto, FVG, Umbria, Basilicata, Calabria, Sicilia

| Pista (seed) | Esito | Evidenza | Note |
|---|---|---|---|
| Affi Kart Indoor | **dubbia** | Scheda directory: indoor su due piani, ASD dal 2013, prezzi €17-35 ([yumping](https://www.yumping.com/en/karting/affi-kart-indoor--e19745043)) | Nessuna data di attività. Pista indoor: ok per rental ma non per gare "da calendario" |
| Lignano Circuit | **confermata** | [turismofvg](https://www.turismofvg.it/it/mare/lignano-circuit): attiva dal 2008, 30 kart, "oltre 100 eventi l'anno" (endurance, sprint, 24H); la 24 Ore Karting 2026 è tornata a Lignano ([kartxpress](https://www.kartxpress.com/ReadMore/tag/crg-centurion)) | **Il comune è Precenicco (UD)**, non Lignano Sabbiadoro. Correggere `city` |
| Kartodromo Le Querce (Cascia) | **dubbia** | Scheda: 1.250 m, omologata federazione, noleggio, località Avendita ([yumping](https://www.yumping.com/en/karting/kartodromo-le-querce--e17274)) | Senza data |
| Pista Karting Arcobaleno (Trevi) | **dubbia** | Scheda: 950 m, San Lorenzo di Trevi ([yumping](https://yumping.com/en/karting/pista-karting-arcobaleno--e17427)) | Senza data; un risultato su Promorace Cup a Trevi non è chiaramente la stessa pista |
| Kartodromo Palazzo (Trecchina) | **dubbia** | 670 m, ma **riservata ai soci ASD MotoArt** ([yumping](https://yumping.com/en/karting/kartodromo-palazzo--e19745123)) | Non è noleggio aperto al pubblico in senso pieno |
| Kartodromo del Sole (Palmi) | **dubbia** | Aperta sab/dom/festivi 9-18:30, noleggio kart/minimoto ([livetheworld](https://www.livetheworld.com/activities/italy/pista-go-kart-kartodromo-del-sole-palmi)) | Senza data |
| Circuito Kartodromo di Avola | **dubbia** | 620 m, kart SODI RT8, pacchetti da €15, Via Risicone ([yumping](https://www.yumping.com/en/karting/circuito-kartodromo-di-avola--e19765158)) | Senza data |
| Kartodromo Lascari | **dubbia** | 700 m, attiva dal 1995, noleggio kart e pista ([yumping](https://www.yumping.com/en/karting/kartodromo-lascari--e17307)) | Senza data |
| Miniautodromo Il Lombrico (Milazzo) | **dubbia** | Descritto da [milazzo.life](https://milazzo.life/?p=2827) come attivo dal 1999, ristrutturato 2009, ha ospitato campionati ACI Sicilia | Fonte locale non datata |

### Migration 009 — Piemonte, Liguria, Molise, Puglia, Sardegna, Veneto

| Pista (seed) | Esito | Evidenza | Note |
|---|---|---|---|
| Pista Kart Bosco (Bosco Marengo) | **confermata** | Aperta nel 2023 ([Il Piccolo](https://www.ilpiccolo.net/2023/07/27/bosco-apre-la-nuova-pista-kart-della-famiglia-percivale)); **gare Endurance** (4ª prova nel giugno 2024, [Il Piccolo](https://acquinews.ilpiccolo.net/2024/06/18/pista-kart-bosco-sabato-la-quarta-gara-endurance)) | Pista outdoor 370 m + indoor elettrica. Fonte di gare plausibile per il Piemonte |
| Pista Azzurra Borgo Ticino | **dubbia** | Scheda: Via Sempione 94, fondata 1962, kart 200 cc a noleggio ([yumping](https://www.yumping.com/en/karting/kartodromo-pista-azzurra--e17270)) | Senza data |
| Pista Kart PG Corse | **confermata, ma città sbagliata** | PG Corse gestisce la pista di **Ronco Scrivia (GE)**, aperta tutto l'anno; organizza il PG Corse Championship (7ª edizione, [tkart](https://tkart.it/en/news/events/registration-open-for-the-7th-edition-of-the-pg-corse-championships)) | Il seed dice "Genova": è Ronco Scrivia. Correggere `city`. Anno dell'ultima edizione non verificato |
| Circuito Kart Carasco | **dubbia** | Scheda: 400 m, 10 kart Honda, Via Piani Nuovi 10 ([yumping](https://www.yumping.com/en/karting/circuito-kart-carasco-s-a-s--e19733572)); costruita 1998-99 | Senza data |
| Pista Kart Vittoria (Pontinvrea) | **dubbia** | Scheda: 637 m, noleggio 200 cc, aperta fino alle 22:30 d'estate ([yumping](https://www.yumping.com/en/karting/pista-kart-vittoria--e19625560)) | Senza data (listata "da 15 anni") |
| Kartodromo Paradiso (Isernia) | **non trovata** | Nessun risultato pertinente | Non verificata |
| Pista Salentina (Ugento) | **confermata** | Apertura Campionato Italiano ACI Karting **2025** a Ugento con 237 piloti ([acisport](https://www.acisport.it/en/CIK/news/2025/123705/the-opening-race-of-the-italian-aci-karting-2025-championship-is-at-the-start-in-ugento-with-237-drivers-on-track)) | Pista agonistica, noleggio non verificato |
| Pista Eurokart Torre Lapillo | **non trovata** | Solo risultati turistici su Torre Lapillo | Non verificata |
| Circuito Internazionale La Conca (Muro Leccese) | **confermata** | Circuito CIK-FIA di 1.250 m, aperto dal 1998, ospita campionati italiani ACI ([Wikipedia](https://en.wikipedia.org/wiki/World_Circuit_La_Conca), [tkart](https://tkart.it/en/news/events/record-presence-in-la-conca-over-220-entered-drivers-for-the-italian-aci-karting-championship)) | Pista da gara di livello mondiale; noleggio non verificato |
| Kartodromo Touch&Go (Martina Franca) | **dubbia** | Scheda: 830 m, noleggio, endurance con Honda, gare interregionali, Grand Prix €45 ([yumping](https://www.yumping.com/en/karting/kartodromo-touch-go--e19745350)) | Senza data, ma è rental con eventi: buon candidato |
| Pista Fanelli (Torricella) | **dubbia** | Unica evidenza: gara nazionale "Coppa dei Campioni" del **marzo 2019** ([iltaccodibacco](https://iltaccodibacco.it/puglia/eventi/208495.html)) | Nessuna attività più recente trovata |
| Sardinia Circuit (Tramatza) | **dubbia → da togliere** | Risulta un circuito **supermoto** (FIM S1GP, 1.600 m con tratto sterrato), non un kartodromo ([S1GP](https://www.supermotos1gp.com/?p=8705)) | Probabile errore del seed |
| Pista Riviera del Corallo (Alghero) | **confermata** | "Pista del Corallo" ospita una prova del campionato sardo ACI Sport kart, con categoria rental ([Unione Sarda](https://www.unionesarda.it/sport/motori/kart-la-pista-di-alghero-ospita-la-terza-prova-del-campionato-sardo-aci-sport-wrgpiwi1)); organizza 4 Mori Karting | Il nome nella fonte è "Pista del Corallo" / "Kartodromo del Corallo": alias |
| Pista Sestugo (Sestu) | **non trovata** | Nessun risultato pertinente | Non verificata |
| Vicenza Kart | **dubbia** | È **Vicenza Kart Indoor** (Altavilla Vicentina, Via Verona 74), aperta 18-02, 15+ ([yumping](https://www.yumping.com/en/karting/vicenza-kart-indoor--e19626657)) | Rinominare; indoor; senza data |
| Pista Verde (Altivole) | **dubbia** | Scheda in un risultato di ricerca (holidoit): attiva dal 1988, 750 m, Altivole (TV); link diretto non conservato | Senza data; il nome è generico: rischio collisione a sottostringa |

### Righe da togliere dal seed

| Azione | Righe | Motivo |
|---|---|---|
| **Togliere** | `Sardinia Circuit` (009) | Circuito supermoto, non kart |
| **Togliere** (non trovate) | `Kartodromo Paradiso` (009), `Pista Eurokart Torre Lapillo` (009), `Pista Sestugo` (009) | Nessuna evidenza che esistano o siano operative |
| **Togliere o rimandare** | `Pista Fanelli` (009) | Ultima attività nota 2019 |
| **Valutare** | `Kartodromo Palazzo` (008) | Riservata ai soci di un'ASD |
| **Correggere, non togliere** | `Lignano Circuit` → city `Precenicco`; `Pista Kart PG Corse` → city `Ronco Scrivia`; `Vicenza Kart` → `Vicenza Kart Indoor` | Dati incoerenti con le fonti |
| **Tenere con riserva** | `Kartodromo 2000` (007) | Omonimia con Lucera: tenerla solo con regola di match più stretta (§C), oppure rinominare in `Kartodromo 2000 Sovicille` |

Il seed è idempotente (`WHERE NOT EXISTS`), quindi togliere righe da 008/009 prima di applicarle non ha costi; se già applicate serve un `DELETE` esplicito. Le piste "dubbie" non vanno cancellate per forza: sono schede directory plausibili, ma mostrarle come "operative" in UI è un rischio di credibilità.

---

## C. Doppioni di nomi pista

### Come funziona oggi (letto da codice)

| Livello | Cosa fa | File |
|---|---|---|
| `events.track_name` | Testo libero **denormalizzato**, preso così com'è dalla fonte (WeRace/RKC: nome venue; XRace: parentesi nel titolo; KRM: regex sul testo) | `scraper/*_scraper.py` |
| `events.track_id` | Esiste nello schema (FK a `tracks`) ma **nessuno scraper lo valorizza** | `database_schema.sql:17` |
| Regione | `resolve_region`: match **esatto** lowercase su `tracks.name`. `resolve_physical_region`: match **a sottostringa in entrambe le direzioni** su `tracks.name` | `scraper/scraper_base.py` |
| Dedup cross-fonte | `find_duplicates` su `(event_date, track_name)` **esatto**: "Orobi Kart" ≠ "Orobikart", quindi il doppione non viene segnalato | `scraper/run_all.py:18` |
| Pagina pista / evento | `getEventsAtTrack`: `ilike 'nome%'` (prefisso). Funziona per "La Scaglia" → "La Scaglia Circuit 2.0", **non** per "Orobi Kart" ↔ "Orobikart" (non è prefisso). Alias manuali solo per 3 piste in `frontend/src/data/trackLayouts.js` (`names`) | `eventsRepository.js:170-200`, `EventDetails.jsx:30` |

Quindi i doppioni nascono perché il nome è una stringa non canonicalizzata e ogni livello usa una regola di confronto diversa. I nomi "Orobi Kart" / "Orobikart" e "La Scaglia" / "La Scaglia Circuit 2.0" **non compaiono in nessun file del repo** (solo in `005` c'è `La Scaglia`): vengono dal DB live o dalle fonti, quindi non ho potuto confermare in quali righe di `tracks`/`events` stiano. Da controllare con una query in sola lettura (§6).
Nota: la mia ricerca ha trovato "Orobikart" a Curno (BG), ma non ha chiarito se "Orobi Kart" sia un nome diverso della stessa pista; per "La Scaglia" una ricerca ha trovato una scheda "La Scaglia Kart" collocata a Civitavecchia, mentre il seed dice Viterbo: **la città del seed va verificata**.

### Proposta minima (non implementata)

1. **Tabella alias** (una riga per ogni scrittura nota):

   ```sql
   CREATE TABLE public.track_aliases (
     alias_key  TEXT PRIMARY KEY,                      -- nome normalizzato (vedi 2)
     track_id   UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
     raw_name   TEXT,                                  -- forma originale vista
     source     TEXT,                                  -- werace / rkc_asi / xrace / krm / manual
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```
   `tracks.name` resta il nome canonico (quello mostrato). Seed iniziale: `Orobi Kart` e `Orobikart` → stessa pista; `La Scaglia` e `La Scaglia Circuit 2.0` → stessa pista; `KCE Misanino` / `MISANINO KCE (RN)`; `Circuito di Siena` → `Pista Internazionale Siena`; `Pista del Corallo` → `Pista Riviera del Corallo`.

2. **Funzione di normalizzazione** (solo generatore di chiave, non fonte di verità): minuscolo, senza accenti e punteggiatura, via spazi e sigla provincia `(XX)`; rimozione di parole generiche in coda/testa (`circuit`, `kart`, `kartodromo`, `pista`, `2.0`, `srl`). Es.: `Orobi Kart` e `Orobikart` → `orobi`; `La Scaglia Circuit 2.0` → `lascaglia`. Rischio: collisioni ("Kart Show" → "show", "Pista Verde" → "verde"), quindi la chiave **non** sostituisce l'alias: serve solo a proporre candidati.

3. **Risoluzione nello scraper**, in ordine: (a) match in `track_aliases` sulla chiave; (b) match esatto su `tracks.name`; (c) altrimenti nessuna regione "per sottostringa" (sostituisce il match bidirezionale di `resolve_physical_region`, che oggi collide ad esempio su `Kartodromo 2000`) e il nome finisce in un **elenco "piste non risolte"** stampato a fine run, accanto al report dei duplicati cross-fonte già esistente. Quando risolto, lo scraper scrive `events.track_id` e (opzionale) `track_name` canonico.

4. **Frontend**: `getEventsAtTrack` filtra per `track_id` invece di prefisso sul testo, e `trackLayouts.js` `names` si può eliminare.

Costo stimato: migration + seed alias (~1 h), modifica a `scraper_base.py` + 3 scraper (~3-4 h), backfill `track_id` degli eventi esistenti (SQL, ~1 h), frontend (~1-2 h). Si può fare **in due tempi**: tabella + seed + backfill dei soli doppioni noti subito; il resto dopo.

---

## D. Altre regioni senza gare

Regioni coperte oggi: Lombardia, Emilia-Romagna, Marche, Lazio, Abruzzo, Campania. Per le altre, la fonte più promettente **trovata dalla ricerca** (formato tecnico per tutte **non verificato**):

| Regione | Fonte più promettente | Perché | Fattibilità |
|---|---|---|---|
| Toscana | Campionato Karting Toscana (Futura Corse), vedi §A | 4 round rental (Siena, Cecina) | media; inserimento manuale più sensato dello scraper |
| Friuli-Venezia Giulia | **Lignano Circuit** (sito di pista, calendario proprio) | "Oltre 100 eventi l'anno" (sprint, endurance, 24H): il volume maggiore trovato | da verificare: dipende dal sito (CMS, calendario) |
| Piemonte | **Pista Kart Bosco** | Serie Endurance 2024 con più prove; stessa famiglia di PG Corse | bassa/media: probabile social/sito di pista |
| Liguria | **PG Corse** (Ronco Scrivia) | PG Corse Championship (7 edizioni), kart a noleggio tutto l'anno | bassa/media |
| Puglia | **Touch&Go** (Martina Franca); **Pista Salentina** per le gare ACI | Endurance rental e gare interregionali | bassa (directory) |
| Sardegna | **4 Mori Karting** / campionato sardo ACI Sport (Pista del Corallo, Alghero) | Prove con categoria rental | bassa: notizie di stampa locale |
| Sicilia | Miniautodromo Il Lombrico (ACI Sicilia, Trofeo Città di Milazzo), Avola | Calendari locali | bassa |
| Veneto | Open Karting Rental Series (E-R/Veneto/Toscana), Vicenza Kart Indoor | Serie rental multiregione, ma sito forse non aggiornato (stagione 23/24) | bassa |
| Umbria | Campionato Karting Toscana (copre anche l'Umbria) | Round in Umbria non confermati | bassa |
| Molise, Basilicata, Calabria | **nessuna fonte trovata** | Solo schede di piste (Basilicata: pista riservata ai soci; Molise: pista non trovata) | non applicabile |
| Valle d'Aosta, Trentino-AA | **nessuna fonte trovata** | Nessuna pista kart censita (solo ghiaccio) | non applicabile |

Osservazione trasversale: il vero collo di bottiglia non è lo scraper ma l'**assenza di un calendario strutturato**. Per la maggior parte di queste piste le gare vivono su social, WhatsApp o PDF (non scrapeabili): un **form di segnalazione/inserimento da parte degli organizzatori** (già parzialmente previsto da `contact.js` e OrganizerDashboard) è probabilmente più economico che sei scraper su sorgenti instabili.

---

## 6. Controlli tecnici da fare fuori dal proxy (10-15 min, richieste leggere)

Con user-agent onesto (`K-Hub-Scraper/0.1`), una richiesta per host:

```bash
UA="K-Hub-Scraper/0.1"
for d in futuracorse.it circuitodisiena.it www.pistadelmare.com www.ivanorganizza.it www.lignanocircuit.com; do
  echo "== $d"
  curl -s -A "$UA" -m 20 https://$d/robots.txt | head -15
  curl -s -A "$UA" -m 20 -o /dev/null -w "tribe: %{http_code}\n" "https://$d/wp-json/tribe/events/v1/events?per_page=1"
  curl -s -A "$UA" -m 20 -o /dev/null -w "wp-json: %{http_code}\n" "https://$d/wp-json/"
done
```

E, sola lettura sul DB, per i doppioni (§C):

```sql
SELECT track_name, count(*), min(event_date), max(event_date)
FROM events GROUP BY 1 ORDER BY lower(track_name);
SELECT name, city, region FROM tracks ORDER BY lower(name);
```

---

## 7. Raccomandazione finale (ordine di esecuzione)

| # | Cosa | Costo | Perché prima |
|---|---|---|---|
| 1 | **Controlli §6** sui 5 domini (robots, `tribe`, struttura calendario). Ispezione di **ivanorganizza.it** e della pagina Futura Corse | ~15 min, nessun codice | Senza questi la fattibilità è un'ipotesi: decide cosa fare ai punti 3-4 |
| 2 | **Ripulire il seed 007-009** (§B: togliere 4-5 righe, correggere 3 città/nomi) prima di applicarlo al DB live | ~30 min, solo SQL | Costo quasi zero e evita di mostrare piste non esistenti come operative |
| 3 | **Toscana: inserire a mano i 4 round del Campionato Karting Toscana** (2 Siena, 2 Cecina) come eventi con `created_by` valorizzato, **non** da scraper | ~1 h una tantum | Porta la Toscana da 0 a qualche gara con il minimo sforzo. Attenzione: la riconciliazione dello scraper cancella le righe con `created_by` nullo, quindi gli eventi manuali devono avere `created_by` |
| 4 | **Tabella alias** minima + seed dei doppioni noti (§C, primo tempo) | ~2 h | Risolve i doppioni visibili e prepara tutte le nuove piste |
| 5 | **Scraper Lignano Circuit** (FVG), solo se §6 mostra un calendario strutturato | 2-4 h se HTML/WordPress, non fattibile se social | Volume più alto trovato (>100 eventi/anno) e nuova regione |
| 6 | Scraper per il Campionato Toscana / aggregatore ivanorganizza | dipende da §6 | Solo se espongono dati strutturati; altrimenti restare al punto 3 |
| 7 | Contattare gli organizzatori (Futura Corse, Lignano Circuit, PG Corse, Pista Kart Bosco) per un feed o per usare l'inserimento organizer | ~1 h, una mail ciascuno | Spesso più affidabile di scrapare social; porta dati ufficiali con consenso |

Non conviene, con le evidenze attuali, investire in scraper per Molise, Basilicata, Calabria, Valle d'Aosta e Trentino-AA (nessuna fonte) né per i calendari ACI nazionali (gare agonistiche, fuori target).
