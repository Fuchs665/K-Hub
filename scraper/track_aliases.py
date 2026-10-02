"""Risoluzione dei nomi pista tramite la tabella track_aliases (migration 011).

Modulo senza dipendenze pesanti (niente supabase/toolkit) cosi' la logica
e' testabile da sola. Il client Supabase viene passato dal chiamante.
"""
import re

_PROVINCE_SUFFIX = re.compile(r"\s*\([A-Za-z]{2}\)\s*$")
_ACCENTS = str.maketrans("àáâäèéêëìíîïòóôöùúûü", "aaaaeeeeiiiioooouuuu")


def normalize_track_name(name):
    """Specchio Python di public.normalize_track_name() (migration 011):
    stessa chiave di track_aliases.alias_key. Se cambia una, cambia l'altra."""
    text = _PROVINCE_SUFFIX.sub("", name or "").lower().translate(_ACCENTS)
    return re.sub(r"[^a-z0-9]", "", text)


def load_track_aliases(supabase):
    """Mappa alias_key -> {track_id, name, region} da track_aliases (+ tracks).
    Tabella assente o errore di lettura: avviso e mappa vuota (gli scraper
    continuano come prima, senza canonicalizzazione)."""
    if not supabase:
        return {}
    try:
        rows = (
            supabase.table("track_aliases")
            .select("alias_key, track_id, tracks(name, region)")
            .execute()
            .data
        ) or []
    except Exception as e:
        print(f"Avviso: lookup track_aliases fallito ({e}); nomi pista non canonicalizzati.")
        return {}
    aliases = {}
    for row in rows:
        track = row.get("tracks") or {}
        if row.get("alias_key") and track.get("name"):
            aliases[row["alias_key"]] = {
                "track_id": row.get("track_id"),
                "name": track["name"],
                "region": track.get("region"),
            }
    return aliases


def apply_track_aliases(events, aliases):
    """Canonicalizza in place gli eventi il cui nome pista e' un alias noto:
    track_name -> nome canonico di tracks, track_id valorizzato, region
    riempita solo se mancante (la region fisica gia' risolta non si tocca).
    Idempotente. "TBA"/vuoti si saltano. Ritorna i nomi pista NON risolti
    (con numero di eventi) per il report di fine run."""
    unresolved = {}
    for e in events:
        raw = (e.track_name or "").strip()
        if not raw or raw.upper() == "TBA":
            continue
        match = aliases.get(normalize_track_name(raw))
        if not match:
            unresolved[raw] = unresolved.get(raw, 0) + 1
            continue
        e.track_name = match["name"]
        e.track_id = match["track_id"]
        if not getattr(e, "region", None) and match.get("region"):
            e.region = match["region"]
    return unresolved


def report_unresolved(unresolved):
    if not unresolved:
        print("Tutti i nomi pista risolti tramite track_aliases.")
        return
    print(f"ATTENZIONE: {len(unresolved)} nomi pista senza alias in track_aliases "
          "(da censire in tracks / aggiungere come alias):")
    for name, count in sorted(unresolved.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  - {name} ({count} eventi)")
