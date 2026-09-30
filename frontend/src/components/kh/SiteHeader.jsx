import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const LINKS = [
  { to: '/calendar', label: 'Calendario' },
  { to: '/tracks', label: 'Piste' },
  { to: '/rkc-asi', label: 'RKC ASI' },
  { to: '/guida-rental', label: 'Guida rental' },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  // Chiude il menu su telefono a ogni cambio pagina.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const linkClass = ({ isActive }) => (isActive ? 'is-active' : undefined);
  const onPiste = location.pathname.startsWith('/piste/');

  return (
    <header className="kh-header">
      <div className="kh-wrap kh-header__bar">
        <Link to="/" className="kh-wordmark" aria-label="K-Hub, pagina iniziale">k-hub</Link>
        <nav id="kh-nav" className={`kh-nav ${open ? 'is-open' : ''}`.trim()} aria-label="Principale">
          <div className="kh-nav__links">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={l.to === '/tracks' && onPiste ? () => 'is-active' : linkClass}
              >
                {l.label}
              </NavLink>
            ))}
            {session && <NavLink to="/dashboard" className={linkClass}>Il mio profilo</NavLink>}
          </div>
          <div className="kh-nav__actions">
            {session ? (
              <button type="button" className="kh-nav__plain" onClick={() => supabase.auth.signOut()}>Esci</button>
            ) : (
              <Link to="/auth" className="kh-nav__plain">Accedi</Link>
            )}
            <Link to="/organizer" className="kh-btn kh-btn--secondary kh-btn--sm">Area organizzatori</Link>
          </div>
        </nav>
        <button
          type="button"
          className="kh-nav-toggle"
          aria-expanded={open}
          aria-controls="kh-nav"
          aria-label={open ? 'Chiudi il menu' : 'Apri il menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

export default SiteHeader;
