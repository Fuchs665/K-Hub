import requests
from datetime import datetime
import re
from scraper_base import KartingEvent

def scrape_xrace_events():
    url = "https://xracemotorsport.com/products.json?limit=250"
    print(f"Scaricando eventi XRace API da: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Errore XRace API: {e}")
        return []

    events = []
    
    months_it = {
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

    products = data.get('products', [])
    print(f"Trovati {len(products)} prodotti su XRace.")

    current_year = datetime.now().year

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

        date_match = re.search(r'(\d{1,2})\s*[-/]?\s*([a-zA-Z]+)', title)
        event_date_str = f"{current_year}-12-31" # fallback
        
        if date_match:
            day = date_match.group(1).zfill(2)
            month_word = date_match.group(2).lower()
            month_num = months_it.get(month_word)
            if month_num:
                event_date_str = f"{current_year}-{month_num}-{day}"

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
