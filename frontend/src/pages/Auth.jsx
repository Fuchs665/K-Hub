import React, { useState } from 'react';
import { User, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';

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
    <div className="rkc-page auth-page">
      <div className="khub-bg" aria-hidden="true">
        <div className="khub-bg-grid" />
        <div className="khub-bg-speed" />
        <div className="khub-bg-grain" />
      </div>

      <HudFrame className="auth-card" corners={['tl', 'br']} style={{ '--hud-size': '24px', '--hud-inset': '16px' }}>
        <SectionEyebrow className="auth-eyebrow" as="div">Area Riservata</SectionEyebrow>
        <h1 className="rkc-title auth-title">Accedi a <em>K-Hub</em></h1>

        {/* Tabs */}
        <div className="rkc-toggle auth-tabs">
          <button
            className={`rkc-toggle-btn ${activeTab === 'pilota' ? 'active' : ''}`.trim()}
            onClick={() => setActiveTab('pilota')}
          >
            <User size={16} /> Pilota
          </button>
          <button
            className={`rkc-toggle-btn ${activeTab === 'pista' ? 'active' : ''}`.trim()}
            onClick={() => setActiveTab('pista')}
          >
            <Shield size={16} /> Pista
          </button>
        </div>

        <p className="org-hint auth-desc">
          {activeTab === 'pilota' ?
            "Salva i tuoi eventi preferiti e ricevi newsletter personalizzate." :
            "Accedi all'Area Organizzatori per inserire e gestire i tuoi eventi a calendario."
          }
        </p>

        {infoMsg && <div className="org-msg is-success">{infoMsg}</div>}
        {errorMsg && <div className="org-msg is-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="brutalist-input-group is-dark">
            <label>EMAIL</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>

          <div className="brutalist-input-group is-dark">
            <label>PASSWORD</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="btn-snappy auth-submit">
            {loading ? 'ATTENDERE...' : (isLogin ? 'ACCEDI' : 'CREA ACCOUNT')} <ChevronRight size={18} />
          </button>
        </form>

        <div className="auth-switch">
          <button onClick={() => setIsLogin(!isLogin)} className="auth-switch-btn">
            {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </button>
        </div>
      </HudFrame>
    </div>
  );
}

export default Auth;
