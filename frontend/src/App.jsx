import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from './components/Navbar';
import SiteHeader from './components/kh/SiteHeader';
import SiteFooter from './components/kh/SiteFooter';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import TracksDirectory from './pages/TracksDirectory';
import Track from './pages/Track';
import RkcAsi from './pages/RkcAsi';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import GuidaRental from './pages/GuidaRental';
import './index.css';
import './styles/manifesto.css';

// Pagine già migrate alla direzione Manifesto (design system K-Hub): usano
// testata e piè di pagina nuovi e lo stile di styles/manifesto.css. Le altre
// restano sul vecchio tema scuro finché non vengono ridisegnate, una alla volta.
const MANIFESTO_ROUTES = [/^\/$/, /^\/tracks\/?$/, /^\/calendar\/?$/, /^\/piste\/[^/]+\/?$/, /^\/event\/[^/]+\/?$/, /^\/rkc-asi\/?$/, /^\/guida-rental\/?$/, /^\/dashboard\/?$/, /^\/organizer\/?$/, /^\/auth\/?$/];
const DEFAULT_TITLE = 'K-Hub — Rental Karting Italia';

/**
 * Transizioni di route con Framer Motion — solo animazione d'ENTRATA.
 * Il motion.div è keyato sul pathname: a ogni cambio route React lo rimonta e
 * l'animazione initial→animate riparte (fade/slide leggero).
 *
 * Niente AnimatePresence/exit di proposito: sotto React 19 StrictMode
 * l'exit con mode="wait" può non completare e bloccare il cambio pagina.
 * L'entrata è sufficiente per il "fade/slide tra pagine" del brief ed è
 * a prova di deadlock. Con prefers-reduced-motion l'entrata è neutra.
 */
function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tracks" element={<TracksDirectory />} />
        <Route path="/piste/:slug" element={<Track />} />
        <Route path="/rkc-asi" element={<RkcAsi />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/guida-rental" element={<GuidaRental />} />
      </Routes>
    </motion.div>
  );
}

function Shell() {
  const { pathname, hash } = useLocation();
  const manifesto = MANIFESTO_ROUTES.some((r) => r.test(pathname));

  // Ogni nuova pagina parte dall'alto (salvo link a un'ancora).
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    document.body.classList.toggle('kh-body', manifesto);
    if (!manifesto) document.title = DEFAULT_TITLE;
  }, [manifesto, pathname]);

  if (manifesto) {
    return (
      <div className="kh-theme">
        <SiteHeader />
        <main className="kh-main">
          <AnimatedRoutes />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <AnimatedRoutes />
    </>
  );
}

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;
