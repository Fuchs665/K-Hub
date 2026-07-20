from bs4 import BeautifulSoup
from datetime import datetime
import re
from toolkit.http import HttpClient, RateLimiter, RetryConfig
from scraper_base import KartingEvent

def scrape_werace_events():
    url = "https://we-race.it/eventi/"
    print(f"Scaricando eventi WeRace da: {url}")

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
        print(f"Errore WeRace HTTP: {e}")
        return []

    soup = BeautifulSoup(html, 'html.parser')
    events = []
    current_year = datetime.now().year
    
    months_it = {
        'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
        'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
        'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
    }

    event_links = soup.select('a[href*="/eventi/"]')
    
    seen_urls = set()
    unique_links = []
    for a in event_links:
        href = a.get('href')
        if href and href not in seen_urls and "categoria" not in href:
            seen_urls.add(href)
            unique_links.append(a)

    print(f"Trovati potenzialmente {len(unique_links)} eventi su WeRace.")

    for link in unique_links:
        event_url = link.get('href')
        title = link.text.strip()
        
        if not title:
            parent_h3 = link.find_parent(['h2', 'h3', 'h4'])
            if parent_h3:
                title = parent_h3.text.strip()
            else:
                title = event_url.strip('/').split('/')[-1].replace('-', ' ').title()

        garbage_titles = ["lista", "mappa", "?eventdisplay=past", "ottieni biglietti", "esporta il file .ics", "esporta file .ics di outlook", "pagina successiva \xbb", "pagina precedente \xab"]
        if not title or len(title) < 5 or "calendario" in title.lower() or "eventi" == title.lower() or any(g in title.lower() for g in garbage_titles):
            continue

        event_date_str = f"{current_year}-12-31"
        for month_name, month_num in months_it.items():
            if month_name in title.lower():
                year_match = re.search(r'202\d', title)
                year = year_match.group() if year_match else current_year
                event_date_str = f"{year}-{month_num}-01"
                break
                
        event_type = "Endurance" if "endurance" in title.lower() else "Sprint"
        
        track_name = "WeRace Track"
        if "milano" in title.lower() or "rozzano" in title.lower(): track_name = "Big Kart Rozzano"
        elif "roma" in title.lower() or "aprilia" in title.lower(): track_name = "Christel Village"
        elif "modena" in title.lower(): track_name = "Extrema Kart"
        elif "ferrara" in title.lower(): track_name = "X Bikes 2.0"
        elif "genova" in title.lower(): track_name = "Pista Ronco"

        event = KartingEvent(
            title=title,
            track_name=track_name,
            event_date=event_date_str,
            event_type=event_type,
            engine_type="Rental",
            price="Vedi sito",
            is_beginner_friendly=True,
            source_url=event_url
        )
        events.append(event)

    print(f"Estratti {len(events)} eventi WeRace.")
    return events

if __name__ == "__main__":
    events = scrape_werace_events()
    for e in events:
        print(f"{e.event_date} - {e.title} a {e.track_name}")
