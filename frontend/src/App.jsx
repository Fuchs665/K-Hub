import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
 * Wrapper di transizione route: fade/slide leggero (solo transform+opacity).
 * Con prefers-reduced-motion la transizione è disattivata (render immediato).
 */
function PageTransition({ children }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return children;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/calendar" element={<PageTransition><Calendar /></PageTransition>} />
        <Route path="/tracks" element={<PageTransition><TracksDirectory /></PageTransition>} />
        <Route path="/rkc-asi" element={<PageTransition><RkcAsi /></PageTransition>} />
        <Route path="/organizer" element={<PageTransition><OrganizerDashboard /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/event/:id" element={<PageTransition><EventDetails /></PageTransition>} />
        <Route path="/guida-rental" element={<PageTransition><GuidaRental /></PageTransition>} />
      </Routes>
    </AnimatePresence>
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
