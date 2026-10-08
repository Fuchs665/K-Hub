import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRkcAsiEvents } from '../lib/eventsRepository';
import { groupEventsByBucket, groupByMonth } from '../lib/eventBuckets';
import { EventGroups } from '../components/kh/EventRow';
import EmptyState from '../components/kh/EmptyState';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const OFFICIAL_SITE = 'https://www.rkcasikarting.it/';

// Regione e periodo vivono nell'URL, come nel calendario:
// /rkc-asi?regione=Lombardia&quando=disputate
// La regione è quella fisica della pista (events.region), non il gruppo
// regionale del campionato: una tappa "RKC ASI Toscana" corsa a Pomposa sta
// sotto Emilia-Romagna.
function RkcAsi() {
  useDocumentTitle('RKC ASI — K-Hub');
  const [params, setParams] = useSearchParams();
  const region = params.get('regione') || 'ALL';
  const past = params.get('quando') === 'disputate';

  const [state, setState] = useState({ status: 'loading', events: [] });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    getRkcAsiEvents({ when: past ? 'past' : 'upcoming' })
      .then((events) => { if (!cancelled) setState({ status: 'ready', events }); })
      .catch((error) => {
        console.error('Errore nel caricare le tappe RKC ASI:', error);
        if (!cancelled) setState({ status: 'error', events: [] });
      });
    return () => { cancelled = true; };
  }, [past]);

  const update = (next) => {
    const merged = { regione: region, quando: past ? 'disputate' : 'programma', ...next };
    const out = new URLSearchParams();
    if (merged.regione !== 'ALL') out.set('regione', merged.regione);
    if (merged.quando === 'disputate') out.set('quando', 'disputate');
    setParams(out, { replace: true });
  };

  // Regioni con almeno una tappa nel periodo scelto, in ordine alfabetico.
  // Quella selezionata resta tra i chip anche se vuota, per poterla togliere.
  const regions = useMemo(() => {
    const counts = new Map();
    for (const e of state.events) if (e.region) counts.set(e.region, (counts.get(e.region) || 0) + 1);
    if (region !== 'ALL' && !counts.has(region)) counts.set(region, 0);
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, 'it'));
  }, [state.events, region]);

  const visible = useMemo(
    () => (region === 'ALL' ? state.events : state.events.filter((e) => e.region === region)),
    [state.events, region],
  );
  const groups = useMemo(() => (past ? groupByMonth(visible) : groupEventsByBucket(visible)), [visible, past]);

  const ready = state.status === 'ready';
  const regionsCount = regions.filter(([, n]) => n > 0).length;
  let countLabel = past ? 'tappe disputate' : 'tappe in programma';
  if (ready && region === 'ALL' && regionsCount > 0) countLabel += ` in ${regionsCount} ${regionsCount === 1 ? 'regione' : 'regioni'}`;
  if (ready && region !== 'ALL') countLabel += ` in ${region}`;
  if (ready && visible.length === 1) countLabel = countLabel.replace('tappe', 'tappa').replace('disputate', 'disputata');

  return (
    <>
      <section className="kh-wrap kh-cal-head">
        <div>
          <h1 className="kh-display-1">RKC ASI</h1>
          <p className="kh-lede" style={{ marginTop: 16 }}>
            Il Rental Kart Championship di ASI: tappe regionali su kart a noleggio che portano alle finali nazionali.
            Qui trovi le date regione per regione; iscrizioni, classifiche e tempi li gestisce il campionato.
          </p>
        </div>
        <div className="kh-stat kh-cal-count" aria-live="polite">
          <span className="kh-count">{ready ? visible.length : '–'}</span>
          <span>{countLabel}</span>
        </div>
      </section>

      <section className="kh-wrap kh-cal-tools" aria-label="Filtri delle tappe">
        <div className="kh-cal-row">
          <div className="kh-chips kh-chips--wrap" role="group" aria-label="Regione">
            <button type="button" className="kh-chip" aria-pressed={region === 'ALL'} onClick={() => update({ regione: 'ALL' })}>
              Tutte le regioni
            </button>
            {regions.map(([name, n]) => (
              <button
                key={name}
                type="button"
                className="kh-chip kh-chip--count"
                aria-pressed={region === name}
                onClick={() => update({ regione: region === name ? 'ALL' : name })}
              >
                {name} <span className="kh-chip__n">{n}</span>
              </button>
            ))}
          </div>
          <div className="kh-seg" role="group" aria-label="Periodo">
            <button type="button" aria-pressed={!past} onClick={() => update({ quando: 'programma' })}>In programma</button>
            <button type="button" aria-pressed={past} onClick={() => update({ quando: 'disputate' })}>Disputate</button>
          </div>
        </div>
      </section>

      <section className="kh-wrap kh-cal-body" aria-label={past ? 'Tappe disputate' : 'Tappe in programma'}>
        {state.status === 'loading' ? (
          <div className="kh-event-list" aria-label="Caricamento delle tappe">
            {[0, 1, 2].map((i) => (
              <div className="kh-skel-row" key={i} aria-hidden="true">
                <span className="kh-skel" style={{ width: 72, height: 78 }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <span className="kh-skel" style={{ width: '55%', height: 20 }} />
                  <span className="kh-skel" style={{ width: '30%', height: 14 }} />
                </span>
              </div>
            ))}
          </div>
        ) : state.status === 'error' ? (
          <div className="kh-empty">
            <h2 className="kh-title-3">Non riusciamo a caricare le tappe</h2>
            <p className="kh-muted">Controlla la connessione e riprova tra poco.</p>
            <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={() => window.location.reload()}>
              Riprova
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            as="h2"
            title={region !== 'ALL'
              ? `Nessuna tappa ${past ? 'disputata' : 'in programma'} in ${region}`
              : `Nessuna tappa ${past ? 'disputata' : 'in programma'} al momento`}
            region={region !== 'ALL' ? region : undefined}
            suggestTrack={region !== 'ALL'}
            organizers={region !== 'ALL'}
          >
            {region !== 'ALL'
              ? 'Il campionato non ha (ancora) tappe qui: le date appaiono appena RKC ASI le pubblica.'
              : past ? 'Le tappe compaiono qui dopo la data di gara.' : 'Le nuove date appaiono qui appena il campionato le pubblica.'}
            <span className="kh-empty-state__actions">
              {region !== 'ALL' && (
                <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={() => update({ regione: 'ALL' })}>
                  Mostra tutte le regioni
                </button>
              )}
              {!past && (
                <button type="button" className="kh-btn kh-btn--secondary kh-btn--sm" onClick={() => update({ quando: 'disputate' })}>
                  Guarda le tappe disputate
                </button>
              )}
            </span>
          </EmptyState>
        ) : (
          <EventGroups groups={groups} register={!past} />
        )}
      </section>

      {/* Classifiche e tempi restano sul circuito ufficiale (Apex Timing): solo link, nessuna copia. */}
      <section className="kh-band" aria-labelledby="rkc-results">
        <div className="kh-wrap kh-band__grid kh-band__grid--solo">
          <div className="kh-band__copy">
            <h2 id="rkc-results" className="kh-title-2">Classifiche e tempi</h2>
            <p style={{ fontSize: 18 }}>
              La classifica di campionato e i tempi giro di ogni tappa li pubblica RKC ASI, con il cronometraggio
              live di Apex Timing. Per vederli si va sul sito ufficiale.
            </p>
            <ul className="kh-band__list">
              <li>Iscrizione dal bottone di ogni tappa</li>
              <li>Classifica di campionato sul sito RKC ASI</li>
              <li>Tempi giro su Apex Timing</li>
            </ul>
            <a href={OFFICIAL_SITE} target="_blank" rel="noreferrer" className="kh-btn kh-btn--secondary">
              Vai al sito RKC ASI<span className="kh-sr"> (si apre in una nuova scheda)</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default RkcAsi;
