import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getPilotStats, getPilotRaceHistory } from '../lib/pilotsRepository';
import { formatTimeMs } from '../lib/utils';
import { formatEventDate } from '../lib/format';
import { Trophy, Flag, Timer, ChevronRight, Gauge } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import HudFrame from '../components/HudFrame';
import SectionEyebrow from '../components/SectionEyebrow';

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
      <div className="rkc-page dsh-page">
        <div className="rkc-empty" style={{ padding: '180px 0' }}>// CARICAMENTO TELEMETRIA...</div>
      </div>
    );
  }

  // Calcolo trend grafico (ultime 10 gare max)
  const recentRaces = [...races].reverse().slice(-10);
  const maxPoints = Math.max(...recentRaces.map(r => r.points || 0), 1);

  return (
    <div className="rkc-page dsh-page">
      {/* ---------- HERO: header pilota ---------- */}
      <HudFrame className="rkc-hero dsh-hero" style={{ '--hud-size': '30px', '--hud-inset': '20px' }}>
        <div className="khub-bg" aria-hidden="true">
          <div className="khub-bg-grid" />
          <div className="khub-bg-speed" />
          <div className="khub-bg-grain" />
        </div>

        <div className="rkc-hero-inner">
          <SectionEyebrow className="rkc-hero-eyebrow">
            Career Hub · Season 2026
          </SectionEyebrow>
          <h1 className="rkc-title">Dashboard <em>Pilota</em></h1>
          <p className="rkc-subtitle">
            Le tue statistiche di gara e i record sul giro.
          </p>
        </div>
      </HudFrame>

      <section className="rkc-section container">
        {/* ---------- KPI ---------- */}
        <HudFrame className="dsh-kpi-frame" corners={['tl', 'br']}>
          <div className="dsh-kpi-grid">
            <div className="rkc-tile">
              <Flag size={28} />
              <b>{stats.races_count || 0}</b>
              <span>Gare Disputate</span>
            </div>
            <div className="rkc-tile is-podium">
              <Trophy size={28} />
              <b>{stats.podiums_count || 0}</b>
              <span>Podi (Top 3)</span>
            </div>
            <div className="rkc-tile is-lap">
              <Timer size={28} />
              <b>{stats.best_lap_ms ? formatTimeMs(stats.best_lap_ms) : '--:--.---'}</b>
              <span>Miglior Tempo Assoluto</span>
            </div>
            <div className="rkc-tile">
              <Gauge size={28} />
              <b>{stats.avg_lap_ms ? formatTimeMs(Math.round(stats.avg_lap_ms)) : '--:--.---'}</b>
              <span>Media sul Giro</span>
            </div>
          </div>
        </HudFrame>

        {/* ---------- Trend punti (grafico CSS) ---------- */}
        {recentRaces.length > 0 && (
          <div className="dsh-panel">
            <SectionEyebrow as="div" className="rkc-section-eyebrow">
              Trend punti · Ultime gare
            </SectionEyebrow>

            <div className="dsh-chart">
              {recentRaces.map((r, idx) => {
                const heightPct = Math.max((r.points / maxPoints) * 100, 5); // min 5% height
                const isPodium = r.position <= 3 && r.position > 0;
                return (
                  <div key={r.id || idx} className="dsh-chart-col">
                    <span className="dsh-chart-val">{r.points}</span>
                    <div
                      className={`dsh-bar ${isPodium ? 'is-podium' : ''}`.trim()}
                      style={{ height: `${heightPct}%` }}
                      title={`Pos: ${r.position} - Punti: ${r.points}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- Telemetria (placeholder import Racesense) ---------- */}
        <HudFrame className="dsh-telemetry" corners={['tl', 'br']}>
          <SectionEyebrow as="div" className="rkc-section-eyebrow">
            Telemetria
          </SectionEyebrow>
          <p className="dsh-telemetry-text">
            In arrivo: import automatico dei tempi sul giro da Racesense.
            I giri registrati appariranno qui con la loro sorgente.
          </p>
          <div className="dsh-telemetry-sources">
            <span className="dsh-source is-live">Manuale — attiva</span>
            <span className="dsh-source">Racesense</span>
            <span className="dsh-source">Telemetria</span>
          </div>
        </HudFrame>

        {/* ---------- Storico gare ---------- */}
        <div className="rkc-section-head" style={{ marginBottom: '16px' }}>
          <div>
            <SectionEyebrow className="rkc-section-eyebrow">Risultati</SectionEyebrow>
            <h2 className="rkc-section-title">Storico Gare</h2>
          </div>
        </div>

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
          <div className="dsh-history">
            {races.map(race => {
              const isPodium = race.position > 0 && race.position <= 3;
              return (
                <div key={race.id} className="dsh-row">
                  <span className={`rkc-pos ${isPodium ? 'is-podium' : ''}`.trim()}>
                    {race.position || '-'}
                  </span>
                  <span className="rkc-drv">
                    {race.events?.title}
                    <small>{formatEventDate(race.events?.event_date)} — {race.events?.track_name}</small>
                  </span>
                  <span className="rkc-val">
                    {race.points || '0'}
                    <small>PTS</small>
                  </span>
                  <Link to={`/event/${race.events?.id}`} className="cal-btn">
                    Classifica <ChevronRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
