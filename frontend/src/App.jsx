import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import TracksDirectory from './pages/TracksDirectory';
import RkcAsi from './pages/RkcAsi';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import GuidaRental from './pages/GuidaRental';
import './index.css';

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

function App() {
  return (
    <Router>
      <Navbar />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
