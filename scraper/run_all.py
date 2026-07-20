import sys
import os
from urllib.parse import urlparse
from toolkit.dedupe import find_duplicates
from scraper_base import insert_events_to_supabase
from werace_scraper import scrape_werace_events
from xrace_scraper import scrape_xrace_events
from krm_scraper import scrape_krm_events
from rkc_asi_scraper import scrape_rkc_asi_events

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

def run_all_scrapers(dry_run=False):
    print("=== INIZIO ESTRAZIONE DA TUTTE LE FONTI ===")
    
    all_events = []
    
    # 1. WeRace
    try:
        werace_events = scrape_werace_events()
        all_events.extend(werace_events)
    except Exception as e:
        print(f"Errore fatale WeRace: {e}")

    # 2. XRace
    try:
        xrace_events = scrape_xrace_events()
        all_events.extend(xrace_events)
    except Exception as e:
        print(f"Errore fatale XRace: {e}")

    # 3. Karting Rental Master
    try:
        krm_events = scrape_krm_events()
        all_events.extend(krm_events)
    except Exception as e:
        print(f"Errore fatale KRM: {e}")

    # 4. RKC ASI (calendario ufficiale campionati federali)
    try:
        rkc_asi_events = scrape_rkc_asi_events()
        all_events.extend(rkc_asi_events)
    except Exception as e:
        print(f"Errore fatale RKC ASI: {e}")

    print(f"\n=== FINE ESTRAZIONE: Totale {len(all_events)} eventi raccolti ===")

    if not all_events:
        print("Nessun evento da inserire.")
        return

    report_cross_source_duplicates(all_events)

    if dry_run:
        print("Dry-run: inserimento nel database SALTATO.")
        return

    print("Inizio inserimento nel database Supabase...")
    insert_events_to_supabase(all_events)
    print("Inserimento completato con successo!")

if __name__ == "__main__":
    run_all_scrapers(dry_run="--dry-run" in sys.argv)
