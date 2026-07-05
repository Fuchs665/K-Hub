import React, { useEffect, useState } from 'react';
import { insertEvent, getEventsLite } from '../lib/eventsRepository';
import { getProfilesLite, insertRaceResults, insertLapTimes } from '../lib/resultsRepository';
import { parseTimeToMs } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const EMPTY_ROW = { pilot_name: '', position: '', points: '' };

function OrganizerDashboard() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    track_name: '',
    event_date: '',
    event_type: 'Sprint',
    engine_type: 'Sodi',
    source_url: '',
    price: ''
  });

  // --- Stato sezione risultati ---
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [lapsText, setLapsText] = useState('');
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsSuccessMsg, setResultsSuccessMsg] = useState('');
  const [resultsErrorMsg, setResultsErrorMsg] = useState('');

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [eventsData, profilesData] = await Promise.all([
          getEventsLite(),
          getProfilesLite()
        ]);
        setEvents(eventsData);
        setProfiles(profilesData);
      } catch (err) {
        console.error('Error loading reference data:', err);
      }
    }
    loadReferenceData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await insertEvent(formData);

      setSuccessMsg('EVENTO INSERITO CON SUCCESSO!');
      setFormData({
        title: '',
        track_name: '',
        event_date: '',
        event_type: 'Sprint',
        engine_type: 'Sodi',
        source_url: '',
        price: ''
      });
      setEvents(await getEventsLite());
    } catch (err) {
      console.error(err);
      setErrorMsg('ERRORE DURANTE L\'INSERIMENTO: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Logica sezione risultati ---

  const updateRow = (index, field, value) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (index) => {
    setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  // Formato: una riga per pilota -> "Nome Pilota: 1:02.345 1:01.998 58.9"
  // Ritorna { laps: Map(nomeLowercase -> [time_ms]), error }
  const parseLapLines = (text, validNames) => {
    const laps = new Map();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      const sepIdx = line.indexOf(':');
      if (sepIdx <= 0) {
        return { error: `Riga tempi non valida (manca "Nome:"): "${line}"` };
      }
      const name = line.slice(0, sepIdx).trim().toLowerCase();
      if (!validNames.has(name)) {
        return { error: `"${line.slice(0, sepIdx).trim()}" non è tra i piloti inseriti nei risultati.` };
      }
      if (laps.has(name)) {
        return { error: `Pilota ripetuto nelle righe tempi: "${line.slice(0, sepIdx).trim()}".` };
      }

      const tokens = line.slice(sepIdx + 1).split(/[\s;]+/).map(t => t.replace(/,+$/, '')).filter(Boolean);
      if (tokens.length === 0) {
        return { error: `Nessun tempo indicato per "${line.slice(0, sepIdx).trim()}".` };
      }
      const times = [];
      for (const token of tokens) {
        const ms = parseTimeToMs(token);
        if (ms === null) {
          return { error: `Tempo non riconosciuto: "${token}" (usa il formato 1:02.345).` };
        }
        times.push(ms);
      }
      laps.set(name, times);
    }
    return { laps };
  };

  const handleResultsSubmit = async (e) => {
    e.preventDefault();
    setResultsSuccessMsg('');
    setResultsErrorMsg('');

    const validRows = rows
      .map(r => ({ ...r, pilot_name: r.pilot_name.trim() }))
      .filter(r => r.pilot_name);

    if (!selectedEventId) {
      setResultsErrorMsg('Seleziona un evento.');
      return;
    }
    if (validRows.length === 0) {
      setResultsErrorMsg('Inserisci almeno un pilota.');
      return;
    }

    const namesLower = validRows.map(r => r.pilot_name.toLowerCase());
    if (new Set(namesLower).size !== namesLower.length) {
      setResultsErrorMsg('Ci sono piloti duplicati nei risultati.');
      return;
    }

    // Validazione tempi PRIMA di scrivere qualsiasi cosa
    const { laps, error: lapsError } = parseLapLines(lapsText, new Set(namesLower));
    if (lapsError) {
      setResultsErrorMsg(lapsError);
      return;
    }

    setResultsLoading(true);
    try {
      // Collega pilot_id se il nome coincide con un profilo registrato
      const payload = validRows.map(r => {
        const profile = profiles.find(p => p.display_name?.trim().toLowerCase() === r.pilot_name.toLowerCase());
        return {
          pilot_name: r.pilot_name,
          pilot_id: profile?.id || null,
          position: r.position === '' ? null : parseInt(r.position, 10),
          points: r.points === '' ? null : parseFloat(r.points),
        };
      });

      const inserted = await insertRaceResults(selectedEventId, payload);

      const lapsPayload = [];
      for (const [nameLower, times] of laps) {
        const result = inserted.find(r => r.pilot_name.toLowerCase() === nameLower);
        if (!result) continue;
        times.forEach((time_ms, i) => {
          lapsPayload.push({ race_result_id: result.id, lap_number: i + 1, time_ms });
        });
      }
      await insertLapTimes(selectedEventId, lapsPayload);

      setResultsSuccessMsg(`SALVATI ${inserted.length} RISULTATI${lapsPayload.length ? ` E ${lapsPayload.length} TEMPI` : ''}!`);
      setRows([{ ...EMPTY_ROW }]);
      setLapsText('');
    } catch (err) {
      console.error(err);
      setResultsErrorMsg('ERRORE DURANTE IL SALVATAGGIO: ' + err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>Area Organizzatori</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Inserimento manuale degli eventi a calendario e dei risultati gara.
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '30px', border: '4px solid var(--text-main)', maxWidth: '700px' }}>
        <h2 style={{ borderBottom: '4px solid var(--castrol-red)', paddingBottom: '10px', marginBottom: '20px' }}>
          NUOVO EVENTO
        </h2>

        {successMsg && (
          <div style={{ background: 'var(--castrol-green)', color: 'white', padding: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'var(--castrol-red)', color: 'white', padding: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="brutalist-input-group">
            <label>NOME EVENTO / CAMPIONATO</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="es. 24h Endurance o Gara Sprint RKC" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="brutalist-input-group">
              <label>PISTA</label>
              <input required type="text" name="track_name" value={formData.track_name} onChange={handleChange} placeholder="es. Kartodromo Cremona" />
            </div>

            <div className="brutalist-input-group">
              <label>DATA EVENTO</label>
              <input required type="date" name="event_date" value={formData.event_date} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="brutalist-input-group">
              <label>TIPO EVENTO</label>
              <select name="event_type" value={formData.event_type} onChange={handleChange}>
                <option value="Sprint">Sprint</option>
                <option value="Endurance">Endurance</option>
                <option value="Ironman">Ironman</option>
              </select>
            </div>

            <div className="brutalist-input-group">
              <label>KART</label>
              <select name="engine_type" value={formData.engine_type} onChange={handleChange}>
                <option value="Sodi">Sodi</option>
                <option value="Birel">Birel</option>
                <option value="CRG">CRG</option>
                <option value="TBKart">TBKart</option>
              </select>
            </div>
          </div>

          <div className="brutalist-input-group">
            <label>PREZZO (Opzionale)</label>
            <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="es. 60€ o Da definire" />
          </div>

          <div className="brutalist-input-group">
            <label>URL SITO / ISCRIZIONI</label>
            <input required type="url" name="source_url" value={formData.source_url} onChange={handleChange} placeholder="es. https://..." />
          </div>

          <button type="submit" disabled={loading} className="btn-snappy" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            {loading ? 'INVIO IN CORSO...' : 'INSERISCI A CALENDARIO'}
          </button>
        </form>
      </div>

      {/* ============ SEZIONE RISULTATI GARA ============ */}
      <div style={{ background: 'var(--bg-card)', padding: '30px', border: '4px solid var(--text-main)', maxWidth: '700px', marginTop: '40px' }}>
        <h2 style={{ borderBottom: '4px solid var(--castrol-red)', paddingBottom: '10px', marginBottom: '20px' }}>
          RISULTATI GARA
        </h2>

        {resultsSuccessMsg && (
          <div style={{ background: 'var(--castrol-green)', color: 'white', padding: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
            {resultsSuccessMsg}
          </div>
        )}

        {resultsErrorMsg && (
          <div style={{ background: 'var(--castrol-red)', color: 'white', padding: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
            {resultsErrorMsg}
          </div>
        )}

        <form onSubmit={handleResultsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="brutalist-input-group">
            <label>EVENTO</label>
            <select required value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              <option value="">— Seleziona evento —</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_date} — {ev.title} ({ev.track_name})
                </option>
              ))}
            </select>
          </div>

          <div className="brutalist-input-group">
            <label>CLASSIFICA</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Se il nome coincide con un utente registrato, la gara comparirà nella sua Dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rows.map((row, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 70px 70px 40px', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    list="profiles-list"
                    placeholder="Nome pilota"
                    value={row.pilot_name}
                    onChange={(e) => updateRow(idx, 'pilot_name', e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Pos"
                    value={row.position}
                    onChange={(e) => updateRow(idx, 'position', e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Punti"
                    value={row.points}
                    onChange={(e) => updateRow(idx, 'points', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    title="Rimuovi riga"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--castrol-red)', padding: '4px' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <datalist id="profiles-list">
              {profiles.map(p => <option key={p.id} value={p.display_name} />)}
            </datalist>

            <button
              type="button"
              onClick={addRow}
              className="btn-outline-snappy"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Aggiungi Pilota
            </button>
          </div>

          <div className="brutalist-input-group">
            <label>TEMPI SUL GIRO (Opzionale)</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Una riga per pilota, tempi separati da spazi. I nomi devono coincidere con la classifica sopra.
            </p>
            <textarea
              rows={4}
              value={lapsText}
              onChange={(e) => setLapsText(e.target.value)}
              placeholder={'Mario Rossi: 1:02.345 1:01.998 1:02.110\nLuca Bianchi: 1:03.020 1:02.870'}
              className="font-mono"
              style={{ width: '100%', padding: '10px', border: '2px solid var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <button type="submit" disabled={resultsLoading} className="btn-snappy" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            {resultsLoading ? 'SALVATAGGIO...' : 'SALVA RISULTATI'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
