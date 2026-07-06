import sys
import os
from scraper_base import insert_events_to_supabase
from werace_scraper import scrape_werace_events
from xrace_scraper import scrape_xrace_events
from krm_scraper import scrape_krm_events
from rkc_asi_scraper import scrape_rkc_asi_events

def run_all_scrapers():
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

    print("Inizio inserimento nel database Supabase...")
    insert_events_to_supabase(all_events)
    print("Inserimento completato con successo!")

if __name__ == "__main__":
    run_all_scrapers()
