import os
from datetime import datetime
# pyrefly: ignore [missing-import]
from supabase import create_client, Client

# Funzione per leggere dal file .env.local dello scraper (separato dal frontend:
# qui serve la service_role key, che deve restare fuori dalla dir frontend/).
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    if value:
                        os.environ[key] = value

load_env()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# La RLS su events richiede owner-check sull'INSERT (auth.uid()): la service_role key
# bypassa RLS, necessaria perché lo scraper non è un utente autenticato.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class KartingEvent:
    def __init__(self, title, track_name, event_date, event_type, engine_type, price, is_beginner_friendly, source_url):
        self.title = title
        self.track_name = track_name
        self.event_date = event_date # Formato YYYY-MM-DD
        self.event_type = event_type
        self.engine_type = engine_type
        self.price = price
        self.is_beginner_friendly = is_beginner_friendly
        self.source_url = source_url
        self.scraped_at = datetime.now().isoformat()

    def to_dict(self):
        return self.__dict__

def insert_events_to_supabase(events_list):
    """Carica una lista di oggetti KartingEvent nella tabella Supabase.
    Usa upsert su (source_url, event_date) per evitare duplicati ad ogni run."""
    data_to_insert = [e.to_dict() for e in events_list]
    try:
        response = supabase.table("events").upsert(
            data_to_insert,
            on_conflict="source_url,event_date"
        ).execute()
        print(f"Upsert completato! Caricati/aggiornati {len(response.data)} eventi nel database.")
        return response.data
    except Exception as e:
        print(f"Errore durante l'inserimento: {e}")

def scrape_sws_events(html_file_path=None):
    import requests
    from bs4 import BeautifulSoup
    from datetime import datetime

    print("Avvio scraping eventi SWS...")
    html_content = ""

    if html_file_path and os.path.exists(html_file_path):
        print(f"Leggo l'HTML locale da: {html_file_path}")
        with open(html_file_path, "r", encoding="utf-8") as f:
            html_content = f.read()
    else:
        url = "https://www.sodiwseries.com/it-it/races/"
        print(f"Effettuo navigazione con Playwright a {url}")
        try:
            from playwright.sync_api import sync_playwright
            from playwright_stealth import Stealth
            
            with sync_playwright() as p:
                # Proviamo a usare l'eseguibile di Google Chrome reale dell'utente per massima affidabilità (ha cookie/trust migliori)
                chrome_path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                chrome_path_x86 = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
                executable = None
                
                if os.path.exists(chrome_path):
                    executable = chrome_path
                elif os.path.exists(chrome_path_x86):
                    executable = chrome_path_x86

                browser = p.chromium.launch(
                    headless=False,
                    executable_path=executable,
                    ignore_default_args=["--enable-automation"]
                )
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    locale="it-IT",
                    viewport={"width": 1280, "height": 720}
                )
                page = context.new_page()
                Stealth().apply_stealth_sync(page)

                try:
                    page.goto(url, timeout=90000)
                    page.wait_for_selector("table#race-listing-table", timeout=90000)
                    html_content = page.content()
                except Exception as inner_e:
                    print(f"Eccezione Playwright (inner): {inner_e}")
                    page.screenshot(path="debug_screenshot.png")
                    print("Screenshot di debug salvato.")
                    html_content = page.content() # Salviamo comunque l'HTML
                finally:
                    browser.close()
                    
        except Exception as e:
            import traceback
            print(f"Errore generale: {e}")
            traceback.print_exc()
            return []

    print("Parsing dell'HTML con BeautifulSoup...")
    soup = BeautifulSoup(html_content, 'html.parser')
    events = []

    table = soup.find('table', id='race-listing-table')
    if not table:
        print("Errore: Impossibile trovare la tabella delle gare nell'HTML.")
        return events

    tbody = table.find('tbody')
    if not tbody:
        print("Errore: Impossibile trovare tbody nella tabella delle gare.")
        return events

    race_rows = tbody.find_all("tr")
    print(f"Trovate {len(race_rows)} righe di gara nella tabella.")
    
    for row in race_rows:
        try:
            tds = row.find_all("td")
            if len(tds) < 8: continue

            # Controllo se è una gara in Italia
            flag_span = tds[2].find('span', class_='country-flag')
            country_class = flag_span['class'][1] if flag_span and len(flag_span['class']) > 1 else ''
            
            if 'country-flag-it' in country_class:
                # 1. Parsing Data (es. 01/07/2026 -> 2026-07-01)
                raw_date = tds[1].text.strip()
                date_obj = datetime.strptime(raw_date, '%d/%m/%Y')
                event_date = date_obj.strftime('%Y-%m-%d')
                
                # 2. Parsing Tipo Gara
                logo_span = tds[0].find('span', class_='table-category-logo')
                event_type = logo_span['data-original-title'] if logo_span and logo_span.has_attr('data-original-title') else 'SWS'
                
                # 3. Altri dettagli
                circuit = tds[4].text.strip()
                kart_model = tds[6].text.strip()
                title = tds[7].text.strip()
                
                # 4. URL
                url = row['data-rowlink'] if row.has_attr('data-rowlink') else 'https://www.sodiwseries.com'
                
                if title and circuit:
                    event = KartingEvent(
                        title=title,
                        track_name=circuit,
                        event_date=event_date,
                        event_type=event_type,
                        engine_type=kart_model,
                        price="N/D", # Non fornito
                        is_beginner_friendly=True if "Sprint" in event_type else False,
                        source_url=url
                    )
                    events.append(event)
        except Exception as e:
            print(f"Errore durante il parsing di una riga: {e}")

    print(f"Scraping completato: trovati {len(events)} eventi in ITALIA.")
    return events

if __name__ == "__main__":
    print("Hub Rental Karting - Scraper Engine")
    print("-----------------------------------")
    
    # Eseguiamo lo scraping in modalità autonoma con Playwright
    scraped_events = scrape_sws_events()
    
    if scraped_events:
        insert_events_to_supabase(scraped_events)
    else:
        print("Nessun evento estratto, inserimento saltato.")
