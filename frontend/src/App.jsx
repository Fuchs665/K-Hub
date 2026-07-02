import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import TracksDirectory from './pages/TracksDirectory';
import RkcAsi from './pages/RkcAsi';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Auth from './pages/Auth';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tracks" element={<TracksDirectory />} />
        <Route path="/rkc-asi" element={<RkcAsi />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
}

export default App;
