import os
import re
from datetime import datetime
# pyrefly: ignore [missing-import]
from supabase import create_client, Client
from dotenv import load_dotenv
from toolkit.encoding import configure_stdio, read_text
from toolkit.normalize import parse_italian_date

# Stdout/stderr su utf-8 con degradazione controllata: le print con caratteri
# non-cp1252 (accenti nei titoli evento, ecc.) non crashano piu' su Windows.
# Eseguito a import-time come load_env(), cosi' vale per tutti gli scraper.
configure_stdio()

# Funzione per leggere dal file .env.local dello scraper (separato dal frontend:
# qui serve la service_role key, che deve restare fuori dalla dir frontend/).
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env.local')
    if os.path.exists(env_path):
        for line in read_text(env_path).splitlines():
            if '=' in line:
                key, value = line.strip().split('=', 1)
                if value:
                    os.environ[key] = value

load_env()

# Carica le variabili d'ambiente dal frontend
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', '.env.local')
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
else:
    print("ATTENZIONE: Variabili Supabase mancanti. Le operazioni DB verranno saltate.")

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

ITALIAN_REGIONS = [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
    "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
    "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto",
]

# Sigle provincia -> regione, per le piste che riportano solo la provincia
# nel nome (es. KRM: "MISANINO KCE (RN)").
PROVINCE_TO_REGION = {
    # Abruzzo
    "AQ": "Abruzzo", "CH": "Abruzzo", "PE": "Abruzzo", "TE": "Abruzzo",
    # Basilicata
    "MT": "Basilicata", "PZ": "Basilicata",
    # Calabria
    "CS": "Calabria", "CZ": "Calabria", "KR": "Calabria", "RC": "Calabria", "VV": "Calabria",
    # Campania
    "AV": "Campania", "BN": "Campania", "CE": "Campania", "NA": "Campania", "SA": "Campania",
    # Emilia-Romagna
    "BO": "Emilia-Romagna", "FC": "Emilia-Romagna", "FE": "Emilia-Romagna",
    "MO": "Emilia-Romagna", "PC": "Emilia-Romagna", "PR": "Emilia-Romagna",
    "RA": "Emilia-Romagna", "RE": "Emilia-Romagna", "RN": "Emilia-Romagna",
    # Friuli-Venezia Giulia
    "GO": "Friuli-Venezia Giulia", "PN": "Friuli-Venezia Giulia",
    "TS": "Friuli-Venezia Giulia", "UD": "Friuli-Venezia Giulia",
    # Lazio
    "FR": "Lazio", "LT": "Lazio", "RI": "Lazio", "RM": "Lazio", "VT": "Lazio",
    # Liguria
    "GE": "Liguria", "IM": "Liguria", "SP": "Liguria", "SV": "Liguria",
    # Lombardia
    "BG": "Lombardia", "BS": "Lombardia", "CO": "Lombardia", "CR": "Lombardia",
    "LC": "Lombardia", "LO": "Lombardia", "MB": "Lombardia", "MI": "Lombardia",
    "MN": "Lombardia", "PV": "Lombardia", "SO": "Lombardia", "VA": "Lombardia",
    # Marche
    "AN": "Marche", "AP": "Marche", "FM": "Marche", "MC": "Marche", "PU": "Marche",
    # Molise
    "CB": "Molise", "IS": "Molise",
    # Piemonte
    "AL": "Piemonte", "AT": "Piemonte", "BI": "Piemonte", "CN": "Piemonte",
    "NO": "Piemonte", "TO": "Piemonte", "VB": "Piemonte", "VC": "Piemonte",
    # Puglia
    "BA": "Puglia", "BR": "Puglia", "BT": "Puglia", "FG": "Puglia", "LE": "Puglia", "TA": "Puglia",
    # Sardegna
    "CA": "Sardegna", "NU": "Sardegna", "OR": "Sardegna", "SS": "Sardegna", "SU": "Sardegna",
    # Sicilia
    "AG": "Sicilia", "CL": "Sicilia", "CT": "Sicilia", "EN": "Sicilia", "ME": "Sicilia",
    "PA": "Sicilia", "RG": "Sicilia", "SR": "Sicilia", "TP": "Sicilia",
    # Toscana
    "AR": "Toscana", "FI": "Toscana", "GR": "Toscana", "LI": "Toscana", "LU": "Toscana",
    "MS": "Toscana", "PI": "Toscana", "PO": "Toscana", "PT": "Toscana", "SI": "Toscana",
    # Trentino-Alto Adige
    "BZ": "Trentino-Alto Adige", "TN": "Trentino-Alto Adige",
    # Umbria
    "PG": "Umbria", "TR": "Umbria",
    # Valle d'Aosta
    "AO": "Valle d'Aosta",
    # Veneto
    "BL": "Veneto", "PD": "Veneto", "RO": "Veneto", "TV": "Veneto", "VE": "Veneto",
    "VI": "Veneto", "VR": "Veneto",
}

def _normalize(text):
    """Minuscole, trattini come spazi, apostrofi uniformati: cosi'
    "Emilia Romagna" nel titolo matcha "Emilia-Romagna" della lista."""
    return text.lower().replace("-", " ").replace("’", "'")

def load_track_regions():
    """Mappa nome pista (lowercase) -> region dalla tabella tracks."""
    if not supabase:
        return {}
    try:
        response = supabase.table("tracks").select("name, region").execute()
        return {
            row["name"].strip().lower(): row["region"]
            for row in (response.data or [])
            if row.get("name") and row.get("region")
        }
    except Exception as e:
        print(f"Avviso: lookup tabella tracks fallito ({e}); region non popolata.")
        return {}

def resolve_region(track_name, title, track_regions):
    """Regione dell'evento, in ordine di affidabilita':
    1. match esatto sulla tabella tracks;
    2. nome regione dentro nome pista O titolo (molte fonti la mettono
       solo nel titolo, es. "Gara Kart in Lombardia - 25 Luglio");
    3. sigla provincia tra parentesi, es. "MISANINO KCE (RN)".
    None se non determinabile: dato incompleto ammesso."""
    if track_name:
        key = track_name.strip().lower()
        if key in track_regions:
            return track_regions[key]

    haystack = _normalize(f"{track_name or ''} {title or ''}")
    for region in ITALIAN_REGIONS:
        if _normalize(region) in haystack:
            return region

    for code in re.findall(r"\(([A-Za-z]{2})\)", f"{track_name or ''} {title or ''}"):
        region = PROVINCE_TO_REGION.get(code.upper())
        if region:
            return region

    return None

def resolve_format(title):
    """Stessa euristica del backfill della migration 001."""
    if title and ("campionato" in title.lower() or "championship" in title.lower()):
        return "campionato"
    return "gara_singola"

def insert_events_to_supabase(events_list):
    """Carica una lista di oggetti KartingEvent nella tabella Supabase.
    Usa upsert su (source_url, event_date) per evitare duplicati ad ogni run:
    gli eventi gia' presenti vengono aggiornati invece di generare errori
    sul vincolo UNIQUE events_source_url_event_date_key.
    Prima dell'upsert arricchisce ogni evento con region (lookup tracks +
    fallback euristico) e format, cosi' i filtri del Calendario vedono
    anche gli eventi scrapeati; vale per tutte le fonti (run_all incluso)."""
    data_to_insert = [e.to_dict() for e in events_list]

    track_regions = load_track_regions()
    for row in data_to_insert:
        if not row.get("region"):
            row["region"] = resolve_region(row.get("track_name"), row.get("title"), track_regions)
        if not row.get("format"):
            row["format"] = resolve_format(row.get("title"))

    try:
        response = (
            supabase.table("events")
            .upsert(data_to_insert, on_conflict="source_url,event_date")
            .execute()
        )
        print(f"Upsert completato! Caricati/aggiornati {len(response.data)} eventi nel database.")
        return response.data
    except Exception as e:
        print(f"Errore durante l'upsert: {e}")

def scrape_sws_events(html_file_path=None):
    import requests
    from bs4 import BeautifulSoup
    from datetime import datetime

    print("Avvio scraping eventi SWS...")
    html_content = ""

    if html_file_path and os.path.exists(html_file_path):
        print(f"Leggo l'HTML locale da: {html_file_path}")
        # read_text: utf-8 con fallback cp1252, non crasha su byte sporchi.
        html_content = read_text(html_file_path)
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
                # 1. Parsing Data (es. 01/07/2026 -> 2026-07-01); parse_italian_date
                # tollera anche varianti tipo 01-07-2026 o 1/7/2026.
                raw_date = tds[1].text.strip()
                date_obj = parse_italian_date(raw_date)
                if date_obj is None:
                    continue  # data non interpretabile: riga saltata
                event_date = date_obj.isoformat()
                
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
