import html
from datetime import date, timedelta
from toolkit.http import HttpClient, RateLimiter, RetryConfig
from scraper_base import KartingEvent, load_track_regions, resolve_physical_region

# Il sito WeRace usa il plugin WordPress "The Events Calendar" (come RKC ASI):
# l'API REST pubblica restituisce data, pista, indirizzo, costo e categorie
# reali di ogni evento. Prima si leggeva l'HTML dell'elenco e la data veniva
# ricavata dal mese nel titolo (sempre giorno 01, oppure 31/12 senza mese).
API_URL = "https://we-race.it/wp-json/tribe/events/v1/events"

# Quanto indietro nel tempo recuperare le gare gia' disputate.
LOOKBACK_DAYS = 120

# Sessioni di prova libera o noleggio pista: non sono gare, restano fuori dal calendario.
NON_RACE_MARKERS = ("free track", "freetrack", "free practice", "prove libere")


def is_race(title, category_names):
    text = f"{title} {' '.join(category_names)}".lower()
    return not any(marker in text for marker in NON_RACE_MARKERS)


def resolve_event_type(title, category_names):
    """Endurance / Ironman / Sprint dal vocabolario del filtro di Calendar.jsx.
    "WeRace Spartan" e' il formato individuale Ironman; tutto il resto
    (Rookies, Formula, 2 Tempi, GP) sono gare sprint."""
    text = f"{title} {' '.join(category_names)}".lower()
    if "endurance" in text:
        return "Endurance"
    if "spartan" in text or "ironman" in text:
        return "Ironman"
    return "Sprint"


def custom_field(raw_event, label):
    for field in (raw_event.get("custom_fields") or {}).values():
        if (field.get("label") or "").strip().lower() == label.lower():
            return html.unescape(str(field.get("value") or "")).strip()
    return ""


def fetch_all_events(start_date):
    raw_events = []
    url = f"{API_URL}?per_page=50&start_date={start_date.isoformat()}"
    client = HttpClient(
        user_agent="K-Hub-Scraper/0.1",
        timeout=20.0,
        retry_config=RetryConfig(max_retries=2, backoff_factor=1.0),
        rate_limiter=RateLimiter(min_interval=1.0),
    )
    # Tetto di iterazioni: guardia se l'API cambia forma e next_rest_url non finisce mai.
    for _ in range(10):
        try:
            response = client.get(url)
            response.raise_for_status()
            payload = response.json()
        except Exception as e:
            print(f"Errore WeRace API: {e}")
            break
        raw_events.extend(payload.get("events", []))
        url = payload.get("next_rest_url")
        if not url:
            break
    return raw_events


def scrape_werace_events():
    print("Scaricando calendario WeRace (API Events Calendar)...")
    raw_events = fetch_all_events(date.today() - timedelta(days=LOOKBACK_DAYS))
    print(f"Trovati {len(raw_events)} eventi su WeRace.")

    track_regions = load_track_regions()
    events = []
    skipped = 0

    for e in raw_events:
        title = html.unescape(e.get("title") or "").strip()
        event_date = (e.get("start_date") or "").split(" ")[0]
        if not title or not event_date:
            continue

        category_names = [html.unescape(c.get("name", "")) for c in (e.get("categories") or [])]
        if not is_race(title, category_names):
            skipped += 1
            continue

        venue = e.get("venue") or {}
        venue_name = html.unescape(venue.get("venue") or "TBA").strip()
        cost = html.unescape(e.get("cost") or "").strip()

        event = KartingEvent(
            title=title,
            track_name=venue_name,
            event_date=event_date,
            event_type=resolve_event_type(title, category_names),
            engine_type=custom_field(e, "Kart") or "Rental",
            price=cost if cost else "Vedi sito",
            is_beginner_friendly=True,
            source_url=e.get("url") or "https://we-race.it/eventi/",
        )
        event.region = resolve_physical_region(venue_name, html.unescape(venue.get("address") or ""), track_regions)
        events.append(event)

    print(f"Estratti {len(events)} eventi WeRace ({skipped} prove libere escluse).")
    return events


if __name__ == "__main__":
    events = scrape_werace_events()
    for e in events:
        print(f"{e.event_date} - {e.title} a {e.track_name} ({e.region or 'regione N/D'}) [{e.event_type}] {e.price}")
