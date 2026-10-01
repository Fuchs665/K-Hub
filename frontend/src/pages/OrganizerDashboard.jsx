import React, { useEffect, useState } from 'react';
import { insertEvent, getEventsLite } from '../lib/eventsRepository';
import { getProfilesLite, insertRaceResults, insertLapTimes } from '../lib/resultsRepository';
import { parseTimeToMs } from '../lib/utils';
import { Plus, Trash2, CircleAlert, CircleCheck } from 'lucide-react';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const EMPTY_ROW = { pilot_name: '', position: '', points: '' };

function Notice({ kind, children }) {
  const ok = kind === 'success';
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <div className={`kh-notice ${ok ? 'is-success' : 'is-error'}`} role={ok ? 'status' : 'alert'}>
      <Icon size={20} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function OrganizerDashboard() {
  useDocumentTitle('Area organizzatori, K-Hub');
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
    <>
      <header className="kh-wrap kh-dash-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h1 className="kh-display-1">Area organizzatori</h1>
          <p className="kh-lede">Inserimento manuale degli eventi a calendario e dei risultati gara.</p>
        </div>
      </header>

      <div className="kh-wrap kh-org">
        {/* ---------- NUOVO EVENTO ---------- */}
        <section className="kh-section kh-org__panel" aria-labelledby="org-evento">
          <h2 className="kh-title-2" id="org-evento">Nuovo evento</h2>

          {successMsg && <Notice kind="success">{successMsg}</Notice>}
          {errorMsg && <Notice kind="error">{errorMsg}</Notice>}

          <form onSubmit={handleSubmit} className="kh-form">
            <div className="kh-field">
              <label htmlFor="ev-title">Nome evento / campionato</label>
              <input id="ev-title" className="kh-input" required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="es. 24h Endurance o Gara Sprint RKC" />
            </div>

            <div className="kh-form__pair">
              <div className="kh-field">
                <label htmlFor="ev-track">Pista</label>
                <input id="ev-track" className="kh-input" required type="text" name="track_name" value={formData.track_name} onChange={handleChange} placeholder="es. Kartodromo Cremona" />
              </div>
              <div className="kh-field">
                <label htmlFor="ev-date">Data evento</label>
                <input id="ev-date" className="kh-input" required type="date" name="event_date" value={formData.event_date} onChange={handleChange} />
              </div>
            </div>

            <div className="kh-form__pair">
              <div className="kh-field">
                <label htmlFor="ev-type">Tipo evento</label>
                <select id="ev-type" className="kh-select" name="event_type" value={formData.event_type} onChange={handleChange}>
                  <option value="Sprint">Sprint</option>
                  <option value="Endurance">Endurance</option>
                  <option value="Ironman">Ironman</option>
                </select>
              </div>
              <div className="kh-field">
                <label htmlFor="ev-engine">Kart</label>
                <select id="ev-engine" className="kh-select" name="engine_type" value={formData.engine_type} onChange={handleChange}>
                  <option value="Sodi">Sodi</option>
                  <option value="Birel">Birel</option>
                  <option value="CRG">CRG</option>
                  <option value="TBKart">TBKart</option>
                </select>
              </div>
            </div>

            <div className="kh-field">
              <label htmlFor="ev-price">Prezzo (opzionale)</label>
              <input id="ev-price" className="kh-input" type="text" name="price" value={formData.price} onChange={handleChange} placeholder="es. 60€ o Da definire" />
            </div>

            <div className="kh-field">
              <label htmlFor="ev-url">URL sito / iscrizioni</label>
              <input id="ev-url" className="kh-input" required type="url" name="source_url" value={formData.source_url} onChange={handleChange} placeholder="es. https://..." />
            </div>

            <div className="kh-form__actions">
              <button type="submit" disabled={loading} aria-busy={loading} className={`kh-btn kh-btn--primary${loading ? ' is-loading' : ''}`}>
                {loading ? 'Invio in corso…' : 'Inserisci a calendario'}
              </button>
            </div>
          </form>
        </section>

        {/* ---------- RISULTATI GARA ---------- */}
        <section className="kh-section kh-org__panel" aria-labelledby="org-risultati">
          <h2 className="kh-title-2" id="org-risultati">Risultati gara</h2>

          {resultsSuccessMsg && <Notice kind="success">{resultsSuccessMsg}</Notice>}
          {resultsErrorMsg && <Notice kind="error">{resultsErrorMsg}</Notice>}

          <form onSubmit={handleResultsSubmit} className="kh-form">
            <div className="kh-field">
              <label htmlFor="res-event">Evento</label>
              <select id="res-event" className="kh-select" required value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                <option value="">— Seleziona evento —</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_date} — {ev.title} ({ev.track_name})
                  </option>
                ))}
              </select>
              {events.length === 0 && (
                <p className="kh-small">Nessun evento disponibile: inserisci prima un evento qui sopra.</p>
              )}
            </div>

            <fieldset className="kh-fieldset">
              <legend className="kh-fieldset__legend">Classifica</legend>
              <p className="kh-small">
                Se il nome coincide con un utente registrato, la gara comparirà nella sua Dashboard.
              </p>

              <div className="kh-rows">
                {rows.map((row, idx) => (
                  <div key={idx} className="kh-row">
                    <div className="kh-field kh-row__name">
                      <label htmlFor={`row-name-${idx}`}>Pilota {idx + 1}</label>
                      <input
                        id={`row-name-${idx}`}
                        type="text"
                        list="profiles-list"
                        className="kh-input"
                        placeholder="Nome pilota"
                        value={row.pilot_name}
                        onChange={(e) => updateRow(idx, 'pilot_name', e.target.value)}
                      />
                    </div>
                    <div className="kh-field">
                      <label htmlFor={`row-pos-${idx}`}>Posizione</label>
                      <input
                        id={`row-pos-${idx}`}
                        type="number"
                        min="1"
                        inputMode="numeric"
                        className="kh-input"
                        placeholder="Pos"
                        value={row.position}
                        onChange={(e) => updateRow(idx, 'position', e.target.value)}
                      />
                    </div>
                    <div className="kh-field">
                      <label htmlFor={`row-pts-${idx}`}>Punti</label>
                      <input
                        id={`row-pts-${idx}`}
                        type="number"
                        step="any"
                        min="0"
                        inputMode="decimal"
                        className="kh-input"
                        placeholder="Punti"
                        value={row.points}
                        onChange={(e) => updateRow(idx, 'points', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      aria-label={`Rimuovi pilota ${idx + 1}`}
                      title="Rimuovi riga"
                      className="kh-btn kh-btn--secondary kh-row__remove"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                      <span className="kh-row__remove-text">Rimuovi</span>
                    </button>
                  </div>
                ))}
              </div>

              <datalist id="profiles-list">
                {profiles.map(p => <option key={p.id} value={p.display_name} />)}
              </datalist>

              <button type="button" onClick={addRow} className="kh-btn kh-btn--secondary kh-btn--sm kh-rows__add">
                <Plus size={16} aria-hidden="true" /> Aggiungi pilota
              </button>
            </fieldset>

            <div className="kh-field">
              <label htmlFor="res-laps">Tempi sul giro (opzionale)</label>
              <p className="kh-small" id="res-laps-hint">
                Una riga per pilota, tempi separati da spazi. I nomi devono coincidere con la classifica sopra.
              </p>
              <textarea
                id="res-laps"
                aria-describedby="res-laps-hint"
                rows={4}
                value={lapsText}
                onChange={(e) => setLapsText(e.target.value)}
                placeholder={'Mario Rossi: 1:02.345 1:01.998 1:02.110\nLuca Bianchi: 1:03.020 1:02.870'}
                className="kh-input kh-textarea"
              />
            </div>

            <div className="kh-form__actions">
              <button type="submit" disabled={resultsLoading} aria-busy={resultsLoading} className={`kh-btn kh-btn--primary${resultsLoading ? ' is-loading' : ''}`}>
                {resultsLoading ? 'Salvataggio…' : 'Salva risultati'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

export default OrganizerDashboard;
