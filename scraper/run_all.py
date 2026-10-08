import sys
import os
from urllib.parse import urlparse
from toolkit.dedupe import find_duplicates
from scraper_base import supabase, insert_events_to_supabase, find_obsolete_events, delete_obsolete_events
from werace_scraper import scrape_werace_events
from xrace_scraper import scrape_xrace_events
from krm_scraper import scrape_krm_events
from rkc_asi_scraper import scrape_rkc_asi_events
from track_aliases import load_track_aliases, apply_track_aliases, report_unresolved

def report_cross_source_duplicates(events_list):
    """Segnala eventi con stessa data+pista provenienti da FONTI DIVERSE.
    Report-only: l'upsert resta su (source_url, event_date), quindi questi
    duplicati finirebbero comunque nel DB come righe distinte (debito noto:
    la dedup del vincolo UNIQUE non vede i cross-fonte). Qui li rendiamo
    almeno visibili a ogni run, senza decidere quale fonte vince."""
    dicts = [e.to_dict() for e in events_list]
    gruppi = find_duplicates(dicts, ["event_date", "track_name"])

    cross = []
    for indici in gruppi.values():
        domini = {urlparse(dicts[i].get("source_url") or "").netloc for i in indici}
        if len(domini) > 1:
            cross.append(indici)

    if not cross:
        print("Nessun duplicato cross-fonte rilevato (stessa data+pista).")
        return

    print(f"ATTENZIONE: {len(cross)} possibili duplicati cross-fonte (stessa data+pista):")
    for indici in cross:
        for i in indici:
            e = events_list[i]
            print(f"  - {e.event_date} | {e.track_name} | {e.title} | {e.source_url}")

def run_all_scrapers(dry_run=False, force_prune=False):
    print("=== INIZIO ESTRAZIONE DA TUTTE LE FONTI ===")
    
    all_events = []
    
    sources = [
        ("WeRace", scrape_werace_events),
        ("XRace", scrape_xrace_events),
        ("KRM", scrape_krm_events),
        ("RKC ASI", scrape_rkc_asi_events),  # calendario ufficiale campionati federali
    ]
    empty_sources = []
    for name, scrape in sources:
        try:
            found = scrape()
        except Exception as e:
            print(f"Errore fatale {name}: {e}")
            found = []
        if not found:
            empty_sources.append(name)
        all_events.extend(found)

    for name in empty_sources:
        # Annotazione visibile nel riepilogo di GitHub Actions; altrove e' una riga di testo.
        print(f"::warning::Fonte {name}: nessun evento estratto")

    print(f"\n=== FINE ESTRAZIONE: Totale {len(all_events)} eventi raccolti ===")

    if not all_events:
        print("Nessun evento da inserire.")
        return False

    # Prima del report duplicati: con i nomi canonici "Orobi Kart"/"Orobikart"
    # (o "La Scaglia"/"La Scaglia Circuit 2.0") risultano la stessa pista.
    report_unresolved(apply_track_aliases(all_events, load_track_aliases(supabase)))

    report_cross_source_duplicates(all_events)

    obsolete = find_obsolete_events(all_events)
    if obsolete:
        print(f"\n{len(obsolete)} eventi nel DB non piu' confermati dalla fonte (spostati o annullati):")
        for r in obsolete:
            print(f"  - {r['event_date']} | {r['title'][:60]} | {r['source_url']}")

    if dry_run:
        print("Dry-run: inserimento e rimozioni nel database SALTATI.")
        return True

    if supabase is None:
        print("Errore: credenziali Supabase mancanti (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).")
        return False

    print("Inizio inserimento nel database Supabase...")
    saved = insert_events_to_supabase(all_events)
    if saved is None:
        print("Inserimento fallito: nessuna rimozione eseguita.")
        return False
    delete_obsolete_events(obsolete, force=force_prune)
    print("Inserimento completato con successo!")
    return True

if __name__ == "__main__":
    # Codice di uscita != 0 se non si e' scritto nulla di utile: GitHub Actions segnala
    # il run come fallito e avvisa via email.
    ok = run_all_scrapers(dry_run="--dry-run" in sys.argv, force_prune="--force-prune" in sys.argv)
    sys.exit(0 if ok else 1)
