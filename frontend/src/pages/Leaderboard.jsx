import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../lib/pilotsRepository';
import { formatTimeMs } from '../lib/utils';
import { Trophy, Medal } from 'lucide-react';

function Leaderboard() {
  const [pilots, setPilots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await getLeaderboard();
        setPilots(data);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError('Impossibile caricare la classifica. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="container main-content font-mono" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        // CALCOLO CLASSIFICA NAZIONALE...
      </div>
    );
  }

  return (
    <div className="container main-content">
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1.1', marginBottom: '8px' }}>
          CLASSIFICA <span style={{ color: 'var(--castrol-red)' }}>PILOTI</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem' }}>
          Ranking nazionale rental — punti, podi e best lap aggregati su tutte le gare
        </p>
      </div>

      {error && (
        <div className="card-snappy" style={{ padding: '30px', textAlign: 'center', color: 'var(--castrol-red)', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      {!error && (
        <div className="card-snappy" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'var(--text-main)', color: 'white', borderBottom: 'none' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
              <Trophy size={24} /> Leaderboard Nazionale
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-light)', borderBottom: '2px solid var(--text-main)', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  <th style={{ padding: '16px', width: '60px', textAlign: 'center' }}>Pos</th>
                  <th style={{ padding: '16px' }}>Pilota</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Gare</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Podi</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Best Lap</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Punti</th>
                </tr>
              </thead>
              <tbody>
                {pilots.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                      Nessun pilota in classifica: la leaderboard si popola quando vengono caricati i primi risultati gara.
                    </td>
                  </tr>
                ) : (
                  pilots.map((pilot, idx) => {
                    const rank = idx + 1;
                    const isPodium = rank <= 3;
                    return (
                      <tr key={pilot.pilot_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '900', fontSize: '1.2rem', color: isPodium ? 'var(--castrol-green)' : 'var(--text-main)' }}>
                          {isPodium ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Medal size={18} /> {rank}
                            </span>
                          ) : (
                            rank
                          )}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                          {pilot.display_name || 'Pilota sconosciuto'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }} className="font-mono">
                          {pilot.races_count}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }} className="font-mono">
                          {pilot.podiums_count}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }} className="font-mono">
                          {pilot.best_lap_ms ? formatTimeMs(pilot.best_lap_ms) : '--:--.---'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', fontSize: '1.2rem' }} className="font-mono">
                          {pilot.total_points}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
