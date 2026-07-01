import os
from datetime import datetime
from supabase import create_client, Client

# Funzione per leggere dal file .env.local
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    """Carica una lista di oggetti KartingEvent nella tabella Supabase."""
    data_to_insert = [e.to_dict() for e in events_list]
    try:
        response = supabase.table("events").insert(data_to_insert).execute()
        print(f"Inserimento completato! Caricati {len(response.data)} eventi nel database.")
        return response.data
    except Exception as e:
        print(f"Errore durante l'inserimento: {e}")

def run_test_insert():
    print("Test di connessione a Supabase in corso...")
    test_event = KartingEvent(
        title="SWS Sprint Cup - Test",
        track_name="Circuito di Test (MI)",
        event_date="2026-12-01",
        event_type="Sprint",
        engine_type="4 Tempi",
        price="50€",
        is_beginner_friendly=True,
        source_url="https://test.com"
    )
    insert_events_to_supabase([test_event])

if __name__ == "__main__":
    print("Hub Rental Karting - Scraper Engine")
    print("-----------------------------------")
    run_test_insert()
