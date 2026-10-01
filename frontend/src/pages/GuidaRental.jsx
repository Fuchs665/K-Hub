import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import useDocumentTitle from '../components/kh/useDocumentTitle';

const FORMATS = [
  {
    name: 'Sprint',
    desc: 'Gara breve, in genere 10-15 giri o pochi minuti a testa. Ogni pilota corre da solo sul proprio kart: conta il tempo o la posizione al traguardo. È il formato più adatto a chi inizia.'
  },
  {
    name: 'Endurance',
    desc: 'Gara a squadre di durata prolungata (da 1 a più ore), con cambi pilota obbligatori durante la gara. Conta la costanza e la gestione dei cambi, non solo il giro veloce.'
  },
  {
    name: 'Ironman',
    desc: 'Come l\'endurance ma senza cambio pilota: un solo pilota guida per tutta la durata della gara. Mette alla prova la resistenza fisica oltre alla velocità.'
  }
];

const GLOSSARY = [
  { term: 'Giro', def: 'Un giro completo del tracciato, dalla linea del traguardo al traguardo successivo.' },
  { term: 'Settore', def: 'Porzione di pista in cui viene suddiviso il giro per confrontare i tempi parziali tra piloti.' },
  { term: 'Best lap', def: 'Il giro più veloce fatto registrare da un pilota durante una sessione o gara.' },
  { term: 'Griglia di partenza', def: 'L\'ordine di partenza dei kart, di solito deciso da una prova cronometrata (qualifica).' },
  { term: 'Penalità', def: 'Secondi aggiunti al tempo finale o posizioni perse in griglia per contatti, false partenze o altre infrazioni.' },
  { term: 'Format', def: 'La tipologia di gara (Sprint, Endurance, Ironman): definisce durata, cambi pilota e modalità di punteggio.' }
];

const FAQ = [
  {
    q: 'Serve la patente per guidare un kart da rental?',
    a: 'No, per il rental karting non serve la patente. Basta avere l\'età minima richiesta dal circuito (di solito 14-16 anni per i kart adulti) e, per i minorenni, il consenso di un genitore.'
  },
  {
    q: 'Devo portare il mio casco o l\'attrezzatura?',
    a: 'Nella maggior parte dei circuiti rental caschi e sottocasco usa e getta sono inclusi nel prezzo. È comunque consigliato portare il proprio casco se ne possiedi uno, per igiene e comfort. Guanti da kart sono sempre una buona idea.'
  },
  {
    q: 'Quanto costa mediamente partecipare a una gara?',
    a: 'Varia molto in base a circuito, format e durata: si va indicativamente da 30-40€ per una gara sprint a 60-100€ o più a testa per un endurance a squadre. Controlla sempre il dettaglio nella pagina dell\'evento.'
  },
  {
    q: 'Posso iscrivermi da solo o serve un team?',
    a: 'Per le gare Sprint e Ironman puoi iscriverti anche da solo. Per l\'Endurance normalmente serve un team (2-4 piloti): molti organizzatori aiutano ad abbinare piloti singoli ad altri equipaggi in cerca di compagni.'
  },
  {
    q: 'Come faccio a sapere se sono pronto per la mia prima gara?',
    a: 'Non serve essere già veloci: la maggior parte dei circuiti organizza gare pensate anche per chi guida per la prima volta in pista. Il modo migliore per iniziare è fare qualche sessione libera sul circuito che ti interessa prima di iscriverti a un evento ufficiale.'
  }
];

const TOC = [
  { id: 'cose', label: 'Cos\'è il rental karting' },
  { id: 'formati', label: 'I formati di gara' },
  { id: 'dal-calendario', label: 'Dal calendario alla pista' },
  { id: 'glossario', label: 'Glossario base' },
  { id: 'faq', label: 'Domande frequenti' }
];

function GuidaRental() {
  useDocumentTitle('Guida rental — K-Hub');

  return (
    <>
      <header className="kh-wrap kh-guide-head">
        <h1 className="kh-display-1">Come iniziare col rental</h1>
        <p className="kh-lede" style={{ marginTop: 16 }}>
          La guida essenziale per chi si affaccia per la prima volta alle gare di rental karting.
        </p>
      </header>

      <div className="kh-wrap kh-guide">
        <nav className="kh-guide__toc" aria-label="In questa guida">
          <p className="kh-guide__toc-title">In questa guida</p>
          <ol>
            {TOC.map(({ id, label }) => (
              <li key={id}><a href={`#${id}`}>{label}</a></li>
            ))}
          </ol>
        </nav>

        <article className="kh-guide__body">
          <section id="cose" aria-labelledby="cose-t">
            <h2 id="cose-t" className="kh-title-2">Cos'è il rental karting</h2>
            <p className="kh-prose">
              Il rental karting è la forma più accessibile di gara motoristica: si corre con kart a noleggio, forniti direttamente dal circuito, quindi non serve possedere un mezzo proprio. Circuiti in tutta Italia organizzano eventi aperti a chiunque, dai neofiti completi ai piloti più esperti, spesso divisi per fasce di livello. K-Hub raccoglie questi eventi da più organizzatori in un unico calendario, così puoi trovare facilmente una gara vicino a te.
            </p>
          </section>

          <section id="formati" aria-labelledby="formati-t">
            <h2 id="formati-t" className="kh-title-2">I formati di gara</h2>
            <dl className="kh-defs kh-defs--formats">
              {FORMATS.map(({ name, desc }) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="dal-calendario" aria-labelledby="dal-calendario-t">
            <h2 id="dal-calendario-t" className="kh-title-2">Dal calendario alla pista</h2>
            <ol className="kh-steps">
              <li>
                <span className="kh-steps__n kh-count" aria-hidden="true">1</span>
                <div>
                  <h3 className="kh-title-3">Trova la gara</h3>
                  <p className="kh-prose">
                    Ogni riga del <Link to="/calendar" className="kh-link-accent">Calendario</Link> mostra pista, data e format (Sprint o Endurance). Nella pagina <Link to="/tracks" className="kh-link-accent">Le Piste</Link> trovi l'elenco dei circuiti censiti: da lì puoi orientarti su quali sono attivi vicino a te prima ancora di guardare le date.
                  </p>
                </div>
              </li>
              <li>
                <span className="kh-steps__n kh-count" aria-hidden="true">2</span>
                <div>
                  <h3 className="kh-title-3">Apri la scheda</h3>
                  <p className="kh-prose">
                    Nella scheda trovi i dettagli e, se la gara è già stata disputata, la classifica finale con i tempi giro di ogni pilota. Ricorda: punti e classifiche sono confrontabili solo all'interno dello stesso evento, perché ogni organizzatore usa regole e piste diverse.
                  </p>
                </div>
              </li>
              <li>
                <span className="kh-steps__n kh-count" aria-hidden="true">3</span>
                <div>
                  <h3 className="kh-title-3">Iscriviti dall'organizzatore</h3>
                  <p className="kh-prose">
                    K-Hub aggrega gli eventi ma non gestisce le iscrizioni: il bottone Iscriviti ti porta sul sito dell'organizzatore o del circuito, dove prenoti il tuo posto.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section id="glossario" aria-labelledby="glossario-t">
            <h2 id="glossario-t" className="kh-title-2">Glossario base</h2>
            <dl className="kh-defs">
              {GLOSSARY.map(({ term, def }) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{def}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="faq" aria-labelledby="faq-t">
            <h2 id="faq-t" className="kh-title-2">Domande frequenti</h2>
            <div className="kh-faq">
              {FAQ.map(({ q, a }) => (
                <details key={q}>
                  <summary>
                    <span>{q}</span>
                    <ChevronDown size={20} aria-hidden="true" />
                  </summary>
                  <p className="kh-prose">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </article>
      </div>

      <section className="kh-band" aria-labelledby="guida-cta">
        <div className="kh-wrap kh-band__grid kh-band__grid--solo">
          <div className="kh-band__copy">
            <h2 id="guida-cta" className="kh-title-2">Pronto per la prima gara?</h2>
            <p style={{ fontSize: 18 }}>
              Scegli una data dal calendario, oppure parti da una pista vicino a te e prova qualche sessione libera.
            </p>
            <div className="kh-actions">
              <Link to="/calendar" className="kh-btn kh-btn--primary">Vai al calendario</Link>
              <Link to="/tracks" className="kh-btn kh-btn--secondary">Scegli una pista</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default GuidaRental;
