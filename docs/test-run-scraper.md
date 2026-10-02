# Test del primo run reale dello scraper (con track_aliases / track_id)

Checklist per il primo `run_all.py` reale dopo i merge di `track_aliases` (migration 011), scraper (#6) e frontend (#7, #8). Pensata per essere eseguita da te: la sessione di sviluppo non ha né la service role key né accesso al DB. **Nulla qui è stato eseguito**: SQL e comandi sono scritti leggendo il codice e vanno provati.

Cosa cambia al primo run: lo scraper riscrive `events.track_name` col nome canonico di `tracks` e valorizza `events.track_id` per ogni evento il cui nome pista ha un alias (`scraper/track_aliases.py`). Le righe esistenti si aggiornano via upsert su `(source_url, event_date)`, quindi gli `id` non cambiano.

## 0. Prerequisiti

- [ ] Migration 007-011 applicate sul DB live (la 011 risulta già applicata).
- [ ] `scraper/.env.local` con `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (oggi vuota). Con la sola anon key il run reale fallisce sulle scritture, il dry-run funziona.
- [ ] Dipendenze: `pip install -r scraper/requirements.txt` (il toolkit `it-scraper-toolkit` è un repo privato).
- [ ] Unit test: `cd scraper && python -m unittest test_track_aliases` (8 test, nessuna dipendenza di rete).

## 1. Controlli SQL prima del run (SQL editor, sola lettura)

La colonna `track_id` esiste? (Se la query non restituisce righe l'upsert fallirebbe: crearla prima.)

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'track_id';
```

Doppioni in `tracks` che la 011 non ha unito (stessa chiave normalizzata, es. Orobi Kart / Orobikart):

```sql
SELECT public.normalize_track_name(name) AS chiave, array_agg(name) AS nomi, count(*)
FROM public.tracks GROUP BY 1 HAVING count(*) > 1;
```

Se ci sono, unirli a mano **prima** del run (spostare gli eventi sulla pista che resta, poi cancellare l'altra), altrimenti il run assegna `track_id` a una sola delle due.

Alias seminati:

```sql
SELECT a.alias_key, a.raw_name, a.source, t.name AS pista
FROM public.track_aliases a JOIN public.tracks t ON t.id = a.track_id
ORDER BY t.name, a.alias_key;
```

Backup per il rollback (free tier: tabella piccola):

```sql
CREATE TABLE public.events_backup_pre_alias AS SELECT * FROM public.events;
SELECT count(*) FROM public.events_backup_pre_alias;
```

Fotografia dei nomi pista attuali, da confrontare dopo:

```sql
SELECT track_name, count(*) FROM public.events GROUP BY 1 ORDER BY 2 DESC;
```

## 2. Dry-run (nessuna scrittura)

```bash
python scraper/run_all.py --dry-run
```

Da leggere nell'output:

- [ ] Eventi raccolti per fonte (WeRace, XRace, KRM, RKC ASI): numeri sensati rispetto agli ultimi run.
- [ ] Riga `Tutti i nomi pista risolti tramite track_aliases.` oppure l'elenco `ATTENZIONE: N nomi pista senza alias`. Per ogni nome in elenco: o la pista manca da `tracks` (aggiungila con una migration di seed), o è una variante di una pista esistente (aggiungi un alias in `track_aliases`). `TBA` è escluso dal report.
- [ ] Report duplicati cross-fonte: ora lavora sui nomi canonici, quindi può mostrare duplicati che prima non vedeva. Non cancella nulla.
- [ ] Elenco `eventi nel DB non piu' confermati dalla fonte`: se ne ha più di 25, il run reale non li cancella senza `--force-prune`.
- [ ] Nessun avviso `lookup track_aliases fallito` (vorrebbe dire tabella non leggibile: nomi non canonicalizzati).

Non lanciare il run reale finché l'elenco dei nomi non risolti non è accettabile.

## 3. Run reale

```bash
python scraper/run_all.py
```

- [ ] `Upsert completato! Caricati/aggiornati N eventi` senza `Errore durante l'upsert` (un errore qui di solito è la colonna `track_id` mancante o la service role key sbagliata).
- [ ] Eventuali rimozioni di righe obsolete coerenti con quelle viste nel dry-run.

## 4. Controlli SQL dopo il run

Coerenza `track_id` / nome canonico (atteso: 0 righe):

```sql
SELECT e.id, e.track_name, t.name AS nome_canonico
FROM public.events e JOIN public.tracks t ON t.id = e.track_id
WHERE e.track_name <> t.name;
```

Righe ancora senza `track_id` (atteso: solo `TBA`, piste estere o non censite, eventi inseriti a mano):

```sql
SELECT track_name, count(*), count(*) FILTER (WHERE created_by IS NOT NULL) AS manuali
FROM public.events WHERE track_id IS NULL GROUP BY 1 ORDER BY 2 DESC;
```

Cosa è stato riscritto rispetto al backup:

```sql
SELECT b.track_name AS prima, e.track_name AS dopo, count(*)
FROM public.events e JOIN public.events_backup_pre_alias b USING (id)
WHERE b.track_name IS DISTINCT FROM e.track_name
GROUP BY 1, 2 ORDER BY 3 DESC;
```

Atteso, tra gli altri: `MISANINO KCE (RN)` → `KCE Misanino`, `La Scaglia Circuit 2.0` → `La Scaglia`. Se compare qualcosa di inatteso (due piste diverse unite), vedi rollback.

Regione e formato non peggiorati:

```sql
SELECT count(*) FILTER (WHERE region IS NULL) AS senza_regione, count(*) AS totale FROM public.events;
```

(confrontare con lo stesso conteggio su `events_backup_pre_alias`).

## 5. Controlli sul sito

- [ ] `/piste/kce-misanino`: elenco gare presente e tracciato disegnato; stesso per le altre due piste con tracciato (Rozzano, Martinsicuro).
- [ ] `/piste/la-scaglia`: compaiono le gare che le fonti chiamano "La Scaglia Circuit 2.0".
- [ ] Calendario: nessuna gara sparita; le gare di Misanino hanno di nuovo il disegno del tracciato nelle liste.
- [ ] Home: i conteggi "gare in arrivo" sulle card delle piste con tracciato sono sensati.
- [ ] Una pagina evento a caso per fonte: link alla pista corretto.

## 6. Rollback

Solo se il run ha unito piste diverse o rotto qualcosa. Ripristina i nomi e azzera `track_id` (la tabella `events_backup_pre_alias` è quella creata al §1):

```sql
UPDATE public.events e
SET track_name = b.track_name, track_id = NULL
FROM public.events_backup_pre_alias b
WHERE e.id = b.id;
```

Poi correggere gli alias sbagliati (`DELETE FROM public.track_aliases WHERE alias_key = '...'`) e rifare dry-run + run. Righe create *dopo* il backup non sono nel backup e restano com'erano. A verifica finita: `DROP TABLE public.events_backup_pre_alias;`.

## Note

- Il run reale **rimuove** righe create dallo scraper (`created_by` nullo) che la fonte non conferma più: max 25 per run, oltre serve `--force-prune`. Gli eventi inseriti a mano (con `created_by`) non vengono toccati.
- La prima volta conviene lanciarlo in un momento in cui puoi controllare subito il sito (§5).
