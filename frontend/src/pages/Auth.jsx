import React, { useState } from 'react';
import { User, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

async function ensureProfile(userId, role) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('profiles').insert([{ id: userId, role }]);
  }
}

function Auth() {
  const [activeTab, setActiveTab] = useState('pilota'); // 'pilota' o 'pista'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const navigate = useNavigate();

  const role = activeTab === 'pista' ? 'organizer' : 'pilot';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { data, error } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.session) {
        await ensureProfile(data.user.id, role);
        navigate(role === 'organizer' ? '/organizer' : '/');
      } else {
        setInfoMsg('Controlla la tua email per confermare la registrazione, poi accedi.');
        setIsLogin(true);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div style={{ background: 'var(--bg-card)', padding: '40px', border: '4px solid var(--text-main)', width: '100%', maxWidth: '500px', position: 'relative' }}>

        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2rem' }}>ACCEDI A K-HUB</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '30px', border: '2px solid var(--text-main)' }}>
          <button
            style={{ flex: 1, padding: '12px', background: activeTab === 'pilota' ? 'var(--text-main)' : 'transparent', color: activeTab === 'pilota' ? 'white' : 'var(--text-main)', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => setActiveTab('pilota')}
          >
            <User size={18} /> Pilota
          </button>
          <button
            style={{ flex: 1, padding: '12px', background: activeTab === 'pista' ? 'var(--text-main)' : 'transparent', color: activeTab === 'pista' ? 'white' : 'var(--text-main)', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderLeft: '2px solid var(--text-main)' }}
            onClick={() => setActiveTab('pista')}
          >
            <Shield size={18} /> Pista
          </button>
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {activeTab === 'pilota' ?
            "Salva i tuoi eventi preferiti e ricevi newsletter personalizzate." :
            "Accedi all'Area Organizzatori per inserire e gestire i tuoi eventi a calendario."
          }
        </div>

        {infoMsg && (
          <div style={{ background: 'var(--castrol-green)', color: 'white', padding: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
            {infoMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'var(--castrol-red)', color: 'white', padding: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="brutalist-input-group">
            <label>EMAIL</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>

          <div className="brutalist-input-group">
            <label>PASSWORD</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="btn-snappy" style={{ width: '100%', padding: '14px', justifyContent: 'center', marginTop: '10px' }}>
            {loading ? 'ATTENDERE...' : (isLogin ? 'ACCEDI' : 'CREA ACCOUNT')} <ChevronRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--castrol-red)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Auth;
