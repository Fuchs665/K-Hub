import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const location = useLocation();

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
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo-container" onClick={closeMenu}>
          <span className="logo-k">K</span>
          <span className="logo-hub">Hub</span>
        </Link>

        {/* Mobile menu button */}
        <div style={{ display: 'flex' }} className="md-hidden">
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {isOpen ? <X size={28} color="var(--text-main)" /> : <Menu size={28} color="var(--text-main)" />}
          </button>
        </div>

        {/* Desktop & Mobile Menu */}
        <div style={{
          display: isOpen ? 'flex' : 'none',
          flexDirection: 'column',
          position: 'absolute',
          top: '72px',
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '20px',
          borderBottom: '2px solid var(--text-main)',
          gap: '20px',
          alignItems: 'center'
        }} className="md-flex md-static md-row md-bg-transparent md-border-none md-p-0 md-gap-4">
          <NavLink to="/calendar" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Calendario</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Classifica</NavLink>
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
