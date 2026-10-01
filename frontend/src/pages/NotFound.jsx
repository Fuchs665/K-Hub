import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../components/kh/useDocumentTitle';

function NotFound() {
  useDocumentTitle('Pagina non trovata, K-Hub');
  return (
    <div className="kh-wrap kh-notfound">
      <h1 className="kh-display-1">Pagina non trovata</h1>
      <p className="kh-lede">L'indirizzo che hai aperto non esiste o è stato spostato. Riparti dal calendario delle gare.</p>
      <div className="kh-notfound__actions">
        <Link to="/calendar" className="kh-btn kh-btn--primary">Vai al calendario</Link>
        <Link to="/" className="kh-btn kh-btn--secondary">Pagina iniziale</Link>
      </div>
    </div>
  );
}

export default NotFound;
