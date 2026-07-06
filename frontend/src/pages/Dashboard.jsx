import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getPilotStats, getPilotRaceHistory } from '../lib/pilotsRepository';
import { formatTimeMs } from '../lib/utils';
import { formatEventDate } from '../lib/format';
import { Trophy, Flag, Timer, ChevronRight, Activity, Gauge } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      try {
        const userId = session.user.id;
        const [pilotStats, raceHistory] = await Promise.all([
          getPilotStats(userId),
          getPilotRaceHistory(userId)
        ]);

        // Default stats if none exist
        setStats(pilotStats || {
          races_count: 0,
          podiums_count: 0,
          best_lap_ms: 0,
          avg_lap_ms: 0
        });
        setRaces(raceHistory || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container main-content font-mono" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        // CARICAMENTO TELEMETRIA...
      </div>
    );
  }

  // Calcolo trend grafico (ultime 10 gare max)
  const recentRaces = [...races].reverse().slice(-10); 
  const maxPoints = Math.max(...recentRaces.map(r => r.points || 0), 1);

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '8px' }}>DASHBOARD PILOTA</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Le tue statistiche di gara e i record sul giro.
        </p>
      </div>

      {/* Widget KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card-snappy" style={{ borderBottomColor: 'var(--text-main)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Flag size={40} style={{ color: 'var(--text-main)', marginBottom: '10px' }} />
            <div style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1' }}>{stats.races_count || 0}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Gare Disputate</div>
          </div>
        </div>

        <div className="card-snappy" style={{ borderBottomColor: 'var(--castrol-green)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Trophy size={40} style={{ color: 'var(--castrol-green)', marginBottom: '10px' }} />
            <div style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1' }}>{stats.podiums_count || 0}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Podi (Top 3)</div>
          </div>
        </div>

        <div className="card-snappy" style={{ borderBottomColor: 'var(--castrol-red)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Timer size={40} style={{ color: 'var(--castrol-red)', marginBottom: '10px' }} />
            <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: '1', margin: '6px 0' }}>
              {stats.best_lap_ms ? formatTimeMs(stats.best_lap_ms) : '--:--.---'}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Miglior Tempo Assoluto</div>
          </div>
        </div>

        <div className="card-snappy" style={{ borderBottomColor: 'var(--text-muted)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Gauge size={40} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
            <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: '1', margin: '6px 0' }}>
              {stats.avg_lap_ms ? formatTimeMs(Math.round(stats.avg_lap_ms)) : '--:--.---'}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Media sul Giro</div>
          </div>
        </div>
      </div>

      {/* Grafico Trend CSS Custom */}
      {recentRaces.length > 0 && (
        <div className="card-snappy" style={{ marginBottom: '40px', padding: '20px', borderBottomWidth: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Activity size={20} />
            <h3 style={{ margin: 0 }}>Trend Punti (Ultime Gare)</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '8px', borderBottom: '2px solid var(--text-main)', paddingBottom: '10px' }}>
            {recentRaces.map((r, idx) => {
              const heightPct = Math.max((r.points / maxPoints) * 100, 5); // min 5% height
              const isPodium = r.position <= 3 && r.position > 0;
              return (
                <div key={r.id || idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  <span className="font-mono" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{r.points}</span>
                  <div 
                    title={`Pos: ${r.position} - Punti: ${r.points}`}
                    style={{ 
                      width: '100%', 
                      background: isPodium ? 'var(--castrol-green)' : 'var(--text-main)', 
                      height: `${heightPct}%`,
                      transition: 'height 0.3s ease'
                    }} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Storico Gare */}
      <h2 style={{ marginBottom: '20px' }}>Storico Gare</h2>
      {races.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 0 }}>
          <Flag size={40} />
          <h3>Nessuna gara registrata</h3>
          <p>I tuoi risultati appariranno qui dopo la prima gara con classifica caricata.</p>
          <Link to="/calendar" className="btn-snappy" style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            Trova una gara
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {races.map(race => (
            <div key={race.id} style={{ background: 'white', border: '2px solid var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {formatEventDate(race.events?.event_date)} — {race.events?.track_name}
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase' }}>
                  {race.events?.title}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Posizione</span>
                  <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '900', color: race.position <= 3 ? 'var(--castrol-green)' : 'var(--text-main)' }}>
                    {race.position || '-'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Punti</span>
                  <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: '900' }}>
                    {race.points || '0'}
                  </span>
                </div>

                <Link to={`/event/${race.events?.id}`} className="btn-outline-snappy" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Classifica <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Dashboard;
