import html
from toolkit.http import HttpClient, RateLimiter, RetryConfig
from scraper_base import KartingEvent, load_track_regions, resolve_physical_region

API_URL = "https://www.rkcasikarting.it/wp-json/tribe/events/v1/events"


def resolve_event_type(title, category_names):
    """Sprint/Endurance/Indoor/Ironman da titolo + categorie Tribe Events.
    "Ironman" allineato al vocabolario gia' usato dal filtro di Calendar.jsx."""
    text = f"{title} {' '.join(category_names)}".lower()
    has_iron = "iron" in text
    has_indoor = "indoor" in text
    has_endurance = "endurance" in text
    has_sprint = "sprint" in text or has_iron

    if has_iron:
        return "Ironman"
    if has_indoor:
        return "Indoor"
    if has_endurance and has_sprint:
        return "Sprint/Endurance"
    if has_endurance:
        return "Endurance"
    return "Sprint"


def fetch_all_events():
    """Pagina finche' l'API restituisce next_rest_url. Oggi il calendario RKC
    ASI conta poche decine di tappe (una richiesta con per_page=50 basta gia'
    a coprirle tutte); il loop e' solo una guardia per stagioni future piu'
    affollate, con un tetto di iterazioni per non girare all'infinito se
    l'API cambia forma."""
    raw_events = []
    url = f"{API_URL}?per_page=50"

    # Rate limit sul loop di paginazione: max 1 richiesta al secondo verso il
    # sito RKC ASI; retry/backoff su timeout e 429/503 gestiti dal client.
    client = HttpClient(
        user_agent="K-Hub-Scraper/0.1",
        timeout=15.0,
        retry_config=RetryConfig(max_retries=2, backoff_factor=1.0),
        rate_limiter=RateLimiter(min_interval=1.0),
    )

    for _ in range(10):
        try:
            response = client.get(url)
            response.raise_for_status()
            payload = response.json()
        except Exception as e:
            print(f"Errore RKC ASI API: {e}")
            break

        raw_events.extend(payload.get("events", []))
        url = payload.get("next_rest_url")
        if not url:
            break

    return raw_events


def scrape_rkc_asi_events():
    print("Scaricando calendario ufficiale RKC ASI...")
    raw_events = fetch_all_events()
    print(f"Trovate {len(raw_events)} tappe RKC ASI in calendario.")

    track_regions = load_track_regions()
    events = []

    for e in raw_events:
        title = html.unescape(e.get("title") or "").strip()
        start_date = e.get("start_date") or ""
        event_date = start_date.split(" ")[0] if start_date else None
        if not title or not event_date:
            continue

        venue = e.get("venue") or {}
        track_name = html.unescape(venue.get("venue") or "TBA").strip()
        category_names = [c.get("name", "") for c in (e.get("categories") or [])]
        cost = (e.get("cost") or "").strip()

        event = KartingEvent(
            title=title,
            track_name=track_name,
            event_date=event_date,
            event_type=resolve_event_type(title, category_names),
            engine_type="N/D",  # non esposto dall'API
            price=cost if cost else "Vedi sito",
            is_beginner_friendly=False,  # tappe di campionato federale, non turni rental walk-in
            source_url=e.get("url") or "https://www.rkcasikarting.it/",
        )
        event.series = "rkc_asi"
        event.format = "campionato"  # ogni tappa RKC ASI e' un round di un campionato stagionale
        event.region = resolve_physical_region(venue.get("venue"), venue.get("address"), track_regions)
        events.append(event)

    print(f"Estratte {len(events)} tappe RKC ASI.")
    return events


if __name__ == "__main__":
    events = scrape_rkc_asi_events()
    for e in events:
        print(f"{e.event_date} - {e.title} a {e.track_name} ({e.region or 'regione N/D'}) [{e.event_type}] {e.price}")
