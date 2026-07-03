import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([formData]);

      if (error) throw error;

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
    } catch (err) {
      console.error(err);
      setErrorMsg('ERRORE DURANTE L\'INSERIMENTO: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>Area Organizzatori</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Inserimento manuale degli eventi a calendario.
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
              <input required type="text" name="event_date" value={formData.event_date} onChange={handleChange} placeholder="es. 15-08-2026" />
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
    </div>
  );
}

export default OrganizerDashboard;
