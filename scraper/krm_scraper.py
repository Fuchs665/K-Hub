from bs4 import BeautifulSoup
import re
from toolkit.http import HttpClient, RateLimiter, RetryConfig
from toolkit.normalize import parse_italian_date
from scraper_base import KartingEvent

def scrape_krm_events():
    url = "https://www.kartingrentalmaster.it/calendario/"
    print(f"Scaricando eventi Karting Rental Master da: {url}")

    client = HttpClient(
        user_agent="K-Hub-Scraper/0.1",
        timeout=15.0,
        retry_config=RetryConfig(max_retries=2, backoff_factor=1.0),
        rate_limiter=RateLimiter(min_interval=1.0),
    )

    try:
        response = client.get(url)
        response.raise_for_status()
        html = response.text
    except Exception as e:
        print(f"Errore KRM HTTP: {e}")
        return []

    soup = BeautifulSoup(html, 'html.parser')
    text = soup.get_text(separator=' ')
    
    # Puliamo il testo per evitare problemi con i vari tipi di trattini e spazi
    text = text.replace('\xa0', ' ').replace('\u2013', '-').replace('\u2014', '-')

    # Cerca il pattern DD/MM/YYYY seguito dal nome della pista fino al prossimo DD/MM/YYYY o newline
    # Usiamo re.finditer per trovare tutte le occorrenze
    pattern = r'(\d{2}/\d{2}/\d{4})\s*[-]?\s*(.*?)(?=\d{2}/\d{2}/\d{4}|\n|$)'
    matches = re.finditer(pattern, text)

    events = []
    seen_events = set()

    for match in matches:
        date_str_ita = match.group(1).strip()
        track_raw = match.group(2).strip()
        
        # Pulizia della pista: prendiamo solo testo, fermiamoci a eventuali parole estranee
        # Siccome ci sono ripetizioni nella pagina, un set eviterà duplicati
        if "DA DEFINIRE" in track_raw.upper():
            track_name = "TBA"
        else:
            track_name = track_raw
            # Tronca se trova la parola CALENDARIO o altro
            if "CALENDARIO" in track_name:
                track_name = track_name.split("CALENDARIO")[0].strip()

        # Evita match completamente rotti
        if not track_name or len(track_name) > 50:
            continue
            
        unique_key = f"{date_str_ita}-{track_name}"
        if unique_key in seen_events:
            continue
        seen_events.add(unique_key)

        # Converti DD/MM/YYYY in YYYY-MM-DD
        date_obj = parse_italian_date(date_str_ita)
        if date_obj is None:
            continue # Data invalida
        event_date_str = date_obj.isoformat()

        event = KartingEvent(
            title=f"KRM Sprint - {track_name}",
            track_name=track_name,
            event_date=event_date_str,
            event_type="Sprint",
            engine_type="Rental",
            price="Vedi sito",
            is_beginner_friendly=True,
            source_url=url
        )
        events.append(event)

    print(f"Estratti {len(events)} eventi Karting Rental Master.")
    return events

if __name__ == "__main__":
    events = scrape_krm_events()
    for e in events:
        print(f"{e.event_date} - {e.title} a {e.track_name}")
