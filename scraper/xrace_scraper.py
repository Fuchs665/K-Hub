from datetime import date, datetime, timedelta
import re
from toolkit.http import HttpClient, RateLimiter, RetryConfig
from scraper_base import KartingEvent

MONTHS_IT = {
    'gennaio': '01', 'gen': '01',
    'febbraio': '02', 'feb': '02',
    'marzo': '03', 'mar': '03',
    'aprile': '04', 'apr': '04',
    'maggio': '05', 'mag': '05',
    'giugno': '06', 'giu': '06',
    'luglio': '07', 'lug': '07',
    'agosto': '08', 'ago': '08',
    'settembre': '09', 'set': '09',
    'ottobre': '10', 'ott': '10',
    'novembre': '11', 'nov': '11',
    'dicembre': '12', 'dic': '12'
}

def parse_title_date(title, published_at):
    """Data dal titolo ("... - 18 Ottobre ..."). L'anno non c'e': si parte da
    quello di pubblicazione del prodotto e, se la data cadrebbe parecchio PRIMA
    della pubblicazione, e' la stagione dopo (es. pubblicato a dicembre per
    una gara di gennaio)."""
    match = re.search(r'(\d{1,2})\s*[-/]?\s*([a-zA-Z]+)', title)
    if not match:
        return None
    month = MONTHS_IT.get(match.group(2).lower())
    if not month:
        return None
    try:
        published = datetime.fromisoformat((published_at or '')[:10]).date()
    except ValueError:
        published = date.today()
    try:
        candidate = date(published.year, int(month), int(match.group(1)))
        if candidate < published - timedelta(days=60):
            candidate = candidate.replace(year=published.year + 1)
    except ValueError:
        return None  # giorno impossibile (es. 31 novembre)
    return candidate


def scrape_xrace_events():
    url = "https://xracemotorsport.com/products.json?limit=250"
    print(f"Scaricando eventi XRace API da: {url}")

    client = HttpClient(
        user_agent="K-Hub-Scraper/0.1",
        timeout=10.0,
        retry_config=RetryConfig(max_retries=2, backoff_factor=1.0),
        rate_limiter=RateLimiter(min_interval=1.0),
    )

    try:
        response = client.get(url)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Errore XRace API: {e}")
        return []

    events = []
    

    products = data.get('products', [])
    print(f"Trovati {len(products)} prodotti su XRace.")

    for p in products:
        title = p.get('title', '')
        handle = p.get('handle', '')
        
        # Filtra solo i prodotti che sembrano gare
        if "gara" not in title.lower() and "endurance" not in title.lower():
            continue

        price = "N/D"
        variants = p.get('variants', [])
        if variants:
            try:
                min_price = min([float(v['price']) for v in variants if v.get('price')])
                price = f"€{min_price:.2f}"
            except:
                price = "€" + str(variants[0].get('price', 'N/D'))

        # Il titolo riporta solo giorno e mese ("... - 18 Ottobre (Villarosa)"): senza
        # data riconoscibile (campionati, pacchetti stagionali) non e' una gara a
        # calendario e viene saltato, invece di finire al 31/12 come prima.
        event_date = parse_title_date(title, p.get('published_at'))
        if event_date is None:
            continue
        event_date_str = event_date.isoformat()

        # Estrai la pista dalle parentesi se presente
        track_match = re.search(r'\((.*?)\)', title)
        if track_match:
            track_name = track_match.group(1)
        else:
            parts = [part.strip() for part in title.replace('-', '|').split('|')]
            track_name = parts[-1] if len(parts) > 1 else "XRace Circuit"
            if re.search(r'\d', track_name) and len(parts) > 2:
                 track_name = parts[-2]

        event_url = f"https://xracemotorsport.com/products/{handle}"

        event = KartingEvent(
            title=title.strip(),
            track_name=track_name.strip(),
            event_date=event_date_str,
            event_type="Sprint/Endurance",
            engine_type="Rental",
            price=price,
            is_beginner_friendly=True,
            source_url=event_url
        )
        events.append(event)

    print(f"Estratti {len(events)} eventi XRace.")
    return events

if __name__ == "__main__":
    events = scrape_xrace_events()
    for e in events:
        print(f"{e.event_date} - {e.title} a {e.track_name} ({e.price})")
