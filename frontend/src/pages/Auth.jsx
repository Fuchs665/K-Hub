import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useDocumentTitle from '../components/kh/useDocumentTitle';
import Notice from '../components/kh/Notice';

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
  useDocumentTitle('Accedi, K-Hub');
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
    <div className="kh-wrap kh-auth">
      <div className="kh-auth__card">
        <h1 className="kh-display-1 kh-auth__title">{isLogin ? 'Accedi' : 'Crea account'}</h1>

        <div className="kh-chips kh-auth__roles" role="group" aria-label="Tipo di account">
          <button type="button" className="kh-chip" aria-pressed={activeTab === 'pilota'} onClick={() => setActiveTab('pilota')}>
            Pilota
          </button>
          <button type="button" className="kh-chip" aria-pressed={activeTab === 'pista'} onClick={() => setActiveTab('pista')}>
            Pista
          </button>
        </div>

        <p className="kh-lede kh-auth__desc">
          {activeTab === 'pilota'
            ? 'Salva i tuoi eventi preferiti e ricevi newsletter personalizzate.'
            : "Accedi all'Area Organizzatori per inserire e gestire i tuoi eventi a calendario."}
        </p>

        {infoMsg && <Notice kind="success">{infoMsg}</Notice>}
        {errorMsg && <Notice kind="error">{errorMsg}</Notice>}

        <form onSubmit={handleSubmit} className="kh-form">
          <div className="kh-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="kh-input"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div className="kh-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="kh-input"
              type="password"
              name="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Almeno 6 caratteri"
            />
          </div>

          <div className="kh-form__actions">
            <button type="submit" disabled={loading} aria-busy={loading} className={`kh-btn kh-btn--primary ${loading ? 'is-loading' : ''}`.trim()}>
              {loading ? 'Attendi...' : (isLogin ? 'Accedi' : 'Crea account')}
            </button>
          </div>
        </form>

        <button type="button" onClick={() => setIsLogin(!isLogin)} className="kh-auth__switch">
          {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </button>
      </div>
    </div>
  );
}

export default Auth;
