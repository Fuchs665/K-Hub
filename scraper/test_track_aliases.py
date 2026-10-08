import unittest
from track_aliases import normalize_track_name, apply_track_aliases, load_track_aliases


class Ev:
    def __init__(self, track_name, region=None):
        self.track_name, self.region = track_name, region


ALIASES = {
    "orobikart": {"track_id": "t1", "name": "Orobikart", "region": "Lombardia"},
    "lascaglia": {"track_id": "t2", "name": "La Scaglia", "region": "Lazio"},
    "lascaglia" + "circuit20": {"track_id": "t2", "name": "La Scaglia", "region": "Lazio"},
    "misanino" + "kce": {"track_id": "t3", "name": "KCE Misanino", "region": "Emilia-Romagna"},
}


class Normalize(unittest.TestCase):
    def test_spazi_e_punteggiatura(self):
        self.assertEqual(normalize_track_name("Orobi Kart"), normalize_track_name("Orobikart"))
        self.assertEqual(normalize_track_name("La Scaglia Circuit 2.0"), "lascaglia" + "circuit20")

    def test_provincia_finale_e_accenti(self):
        self.assertEqual(normalize_track_name("MISANINO KCE (RN)"), "misaninokce")
        self.assertEqual(normalize_track_name("Pista Perù"), "pistaperu")

    def test_vuoti(self):
        self.assertEqual(normalize_track_name(None), "")


class Apply(unittest.TestCase):
    def test_canonicalizza_e_imposta_track_id(self):
        evs = [Ev("Orobi Kart"), Ev("La Scaglia Circuit 2.0"), Ev("MISANINO KCE (RN)", region="Emilia-Romagna")]
        unresolved = apply_track_aliases(evs, ALIASES)
        self.assertEqual([e.track_name for e in evs], ["Orobikart", "La Scaglia", "KCE Misanino"])
        self.assertEqual([e.track_id for e in evs], ["t1", "t2", "t3"])
        self.assertEqual(evs[0].region, "Lombardia")
        self.assertEqual(unresolved, {})

    def test_region_fisica_non_sovrascritta(self):
        e = Ev("La Scaglia", region="Toscana")
        apply_track_aliases([e], ALIASES)
        self.assertEqual(e.region, "Toscana")

    def test_non_risolti_e_tba(self):
        evs = [Ev("Pista Ignota"), Ev("Pista Ignota"), Ev("TBA"), Ev("")]
        self.assertEqual(apply_track_aliases(evs, ALIASES), {"Pista Ignota": 2})
        self.assertFalse(hasattr(evs[0], "track_id"))

    def test_idempotente(self):
        e = Ev("Orobi Kart")
        apply_track_aliases([e], ALIASES)
        apply_track_aliases([e], ALIASES)
        self.assertEqual((e.track_name, e.track_id), ("Orobikart", "t1"))


class Load(unittest.TestCase):
    def test_senza_client_o_con_errore(self):
        self.assertEqual(load_track_aliases(None), {})

        class Boom:
            def table(self, _): raise RuntimeError("relation does not exist")
        self.assertEqual(load_track_aliases(Boom()), {})


if __name__ == "__main__":
    unittest.main()
