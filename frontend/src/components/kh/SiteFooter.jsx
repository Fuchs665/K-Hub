import React from 'react';
import { Link } from 'react-router-dom';

function SiteFooter() {
  return (
    <footer className="kh-footer">
      <div className="kh-wrap kh-footer__grid">
        <div className="kh-footer__brand">
          <Link to="/" className="kh-wordmark" aria-label="K-Hub, pagina iniziale">k-hub</Link>
          <span className="kh-muted">Il calendario del rental karting in Italia.</span>
          <span className="kh-small">
            Gare raccolte dai siti di SWS, WeRace, XRace, KRM e RKC ASI.<br />
            Tracciati © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.
          </span>
        </div>
        <nav className="kh-footer__col" aria-labelledby="kh-footer-explore">
          <h2 id="kh-footer-explore">Esplora</h2>
          <Link to="/calendar">Calendario</Link>
          <Link to="/tracks">Piste</Link>
          <Link to="/rkc-asi">RKC ASI</Link>
          <Link to="/guida-rental">Guida rental</Link>
        </nav>
        <nav className="kh-footer__col" aria-labelledby="kh-footer-org">
          <h2 id="kh-footer-org">Organizzatori</h2>
          <Link to="/organizer">Pubblica una gara</Link>
          <Link to="/auth">Accedi</Link>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;
