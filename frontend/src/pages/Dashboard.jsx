import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getPilotStats, getPilotRaceHistory } from '../lib/pilotsRepository';
import { parseEventDate } from '../lib/format';
import { cleanEventTitle, formatName } from '../lib/eventTitle';
import LapTime from '../components/kh/LapTime';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const EMPTY_STATS = { races_count: 0, podiums_count: 0, best_lap_ms: 0, avg_lap_ms: 0 };
const TREND_RACES = 10;

const shortDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

function dateLabel(formatter, dateStr) {
  const date = parseEventDate(dateStr);
  return date ? formatter.format(date).replace(/\./g, '') : '';
}

const isPodium = (position) => position > 0 && position <= 3;

function Dashboard() {
  useDocumentTitle('Dashboard pilota, K-Hub');
  const [state, setState] = useState({ status: 'loading' });
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      try {
        const userId = session.user.id;
        const [stats, races] = await Promise.all([getPilotStats(userId), getPilotRaceHistory(userId)]);
        if (alive) setState({ status: 'ready', stats: stats || EMPTY_STATS, races: races || [] });
      } catch (err) {
        console.error('Errore nel caricare la dashboard:', err);
        if (alive) setState({ status: 'error' });
      }
    }
    loadData();
    return () => { alive = false; };
  }, [navigate]);

  if (state.status === 'loading') {
    return <div className="kh-wrap" style={{ paddingBlock: 80 }}><p className="kh-muted">Caricamento dei tuoi risultati…</p></div>;
  }
  if (state.status === 'error') {
    return (
      <div className="kh-wrap kh-empty" style={{ paddingBlock: 80 }}>
        <h1 className="kh-title-2">Non riusciamo a caricare i tuoi risultati</h1>
        <p className="kh-muted">Ricarica la pagina tra qualche minuto.</p>
        <Link to="/calendar" className="kh-link-accent">Vai al calendario</Link>
      </div>
    );
  }

  const { stats, races } = state;
  // Ultime gare in ordine cronologico, dalla più vecchia alla più recente.
  const recent = [...races].reverse().slice(-TREND_RACES);
  const maxPoints = Math.max(...recent.map((r) => r.points || 0), 1);
  const hasPoints = recent.some((r) => r.points > 0);

  return (
    <>
      <header className="kh-wrap kh-dash-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h1 className="kh-display-1">Dashboard pilota</h1>
          <p className="kh-lede">Le tue gare, i podi e i tuoi tempi sul giro, in un posto solo.</p>
        </div>
      </header>

      <section className="kh-wrap kh-dash-kpi" aria-label="Le tue statistiche">
        <div className="kh-dash-stat">
          <span className="kh-count kh-dash-stat__n">{stats.races_count || 0}</span>
          <span className="kh-dash-stat__label">Gare disputate</span>
        </div>
        <div className="kh-dash-stat">
          <span className="kh-count kh-dash-stat__n">{stats.podiums_count || 0}</span>
          <span className="kh-dash-stat__label">Podi (primi tre)</span>
        </div>
        <div className="kh-dash-stat">
          <LapTime ms={stats.best_lap_ms || null} kind="pb" />
          <span className="kh-dash-stat__label">Miglior tempo sul giro</span>
        </div>
        <div className="kh-dash-stat">
          <LapTime ms={stats.avg_lap_ms ? Math.round(stats.avg_lap_ms) : null} />
          <span className="kh-dash-stat__label">Tempo medio sul giro</span>
        </div>
      </section>

      {hasPoints && (
        <section className="kh-section" aria-labelledby="dash-trend">
          <div className="kh-wrap">
            <div className="kh-section__head">
              <div>
                <h2 id="dash-trend" className="kh-title-2">Punti nelle ultime gare</h2>
                <p className="kh-muted">Dalla meno recente alla più recente, fino a {TREND_RACES} gare.</p>
              </div>
            </div>
            <ol className="kh-trend" aria-label="Punti per gara">
              {recent.map((r, i) => {
                const points = r.points || 0;
                const pct = Math.max((points / maxPoints) * 100, 4);
                const podium = isPodium(r.position);
                const name = cleanEventTitle(r.events?.title, r.events?.track_name) || 'Gara';
                return (
                  <li
                    key={r.id ?? i}
                    className="kh-trend__col"
                    title={`${name}: ${points} punti${r.position ? `, ${r.position}° posto` : ''}`}
                  >
                    <span className="kh-count kh-trend__val">{points}</span>
                    <span className="kh-trend__track" aria-hidden="true">
                      <span className={`kh-trend__bar${podium ? ' is-podium' : ''}`} style={{ height: `${pct}%` }} />
                    </span>
                    <span className="kh-trend__date">{dateLabel(shortDate, r.events?.event_date)}</span>
                    <span className="kh-sr">{name}, {points} punti{podium ? ', podio' : ''}</span>
                  </li>
                );
              })}
            </ol>
            <div className="kh-lap-legend kh-trend__legend">
              <span className="is-podium">Podio (primi tre)</span>
              <span className="is-other">Altre posizioni</span>
            </div>
          </div>
        </section>
      )}

      <section className="kh-section" aria-labelledby="dash-storico">
        <div className="kh-wrap">
          <div className="kh-section__head">
            <div>
              <h2 id="dash-storico" className="kh-title-2">Storico gare</h2>
              <p className="kh-muted">I tempi sul giro si inseriscono a mano dall'area organizzatori. L'import automatico dai servizi di cronometraggio è in valutazione.</p>
            </div>
          </div>

          {races.length === 0 ? (
            <div className="kh-empty" style={{ paddingTop: 0 }}>
              <h3 className="kh-title-3">Nessuna gara registrata</h3>
              <p className="kh-muted">I tuoi risultati appariranno qui dopo la prima gara con classifica caricata.</p>
              <Link to="/calendar" className="kh-btn kh-btn--primary">Trova una gara</Link>
            </div>
          ) : (
            <div className="kh-table-wrap">
              <table className="kh-results kh-history">
                <thead>
                  <tr>
                    <th scope="col">Pos.</th>
                    <th scope="col">Gara</th>
                    <th scope="col" className="kh-num">Punti</th>
                    <th scope="col"><span className="kh-sr">Classifica</span></th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race, i) => {
                    const ev = race.events;
                    const title = cleanEventTitle(ev?.title, ev?.track_name) || 'Gara';
                    const where = [dateLabel(fullDate, ev?.event_date), formatName(ev?.track_name)].filter(Boolean).join(', ');
                    return (
                      <tr key={race.id ?? i}>
                        <td className={`kh-results__pos${isPodium(race.position) ? ' kh-history__podium' : ''}`}>{race.position || '–'}</td>
                        <td>
                          <span className="kh-results__name">{title}</span>
                          {where && <span className="kh-small kh-history__where">{where}</span>}
                        </td>
                        <td className="kh-num"><span className="kh-results__pts">{race.points ?? 0}</span></td>
                        <td className="kh-results__toggle">
                          {ev?.id && (
                            <Link to={`/event/${ev.id}`} className="kh-btn kh-btn--secondary kh-btn--sm" aria-label={`Classifica di ${title}`}>
                              Classifica
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
