import React from 'react';
import { NavLink, Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo-container">
          <span className="logo-k">K</span>
          <span className="logo-hub">Hub</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <NavLink 
            to="/calendar" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Calendario
          </NavLink>
          <NavLink 
            to="/tracks" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Le Piste
          </NavLink>
          <NavLink 
            to="/rkc-asi" 
            className={({ isActive }) => isActive ? "nav-link active rkc-link" : "nav-link rkc-link"}
          >
            RKC ASI
          </NavLink>
          <Link to="/auth" className="btn-snappy" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            LOGIN / REGISTRATI
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
