import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const location = useLocation();
  // Navbar dark sulle pagine gia migrate al look "Rally Game Menu";
  // le altre pagine restano chiare finche non vengono ridisegnate.
  const isDark = ['/', '/rkc-asi', '/calendar', '/tracks', '/dashboard', '/organizer'].includes(location.pathname)
    || location.pathname.startsWith('/event/');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={isDark ? 'navbar navbar-home' : 'navbar'}>
      <div className="container nav-content">
        <Link to="/" className="logo-container" onClick={closeMenu}>
          <span className="logo-k">K</span>
          <span className="logo-hub">Hub</span>
        </Link>

        {/* Hamburger — visibile solo su mobile via CSS */}
        <button
          className="nav-burger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop: riga inline — Mobile: dropdown sotto la navbar */}
        <div className={isOpen ? 'nav-menu open' : 'nav-menu'}>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Calendario</NavLink>
          <NavLink to="/guida-rental" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Guida Rental</NavLink>
          <NavLink to="/tracks" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Le Piste</NavLink>
          <NavLink to="/rkc-asi" className={({ isActive }) => isActive ? "nav-link active rkc-link" : "nav-link rkc-link"} onClick={closeMenu}>RKC ASI</NavLink>
          
          {session && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Dashboard</NavLink>
          )}

          {!session ? (
            <Link to="/auth" className="btn-snappy" onClick={closeMenu} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>LOGIN / REGISTRATI</Link>
          ) : (
            <button 
              onClick={() => { supabase.auth.signOut(); closeMenu(); }}
              className="btn-outline-snappy"
              style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              ESCI
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
