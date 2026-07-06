import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Zap, Users, Repeat, Calendar, MapPin, BookOpen, HelpCircle, ChevronDown } from 'lucide-react';

const FORMATS = [
  {
    icon: Zap,
    name: 'Sprint',
    desc: 'Gara breve, in genere 10-15 giri o pochi minuti a testa. Ogni pilota corre da solo sul proprio kart: conta il tempo o la posizione al traguardo. È il formato più adatto a chi inizia.'
  },
  {
    icon: Repeat,
    name: 'Endurance',
    desc: 'Gara a squadre di durata prolungata (da 1 a più ore), con cambi pilota obbligatori durante la gara. Conta la costanza e la gestione dei cambi, non solo il giro veloce.'
  },
  {
    icon: Users,
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

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '18px 20px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
          color: 'var(--text-main)'
        }}
      >
        <span>{question}</span>
        <ChevronDown size={20} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--castrol-red)' }} />
      </button>
      {isOpen && (
        <div style={{ padding: '0 20px 20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

function GuidaRental() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => setOpenFaq(prev => prev === idx ? null : idx);

  return (
    <div className="container main-content">
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', lineHeight: '1.1', marginBottom: '8px' }}>
          COME INIZIARE <span style={{ color: 'var(--castrol-red)' }}>COL RENTAL</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem' }}>
          La guida essenziale per chi si affaccia per la prima volta alle gare di rental karting
        </p>
      </div>

      {/* Cos'è il rental karting */}
      <div className="card-snappy" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
            <Flag size={22} /> Cos'è il rental karting
          </h2>
        </div>
        <div className="card-body" style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
          Il rental karting è la forma più accessibile di gara motoristica: si corre con kart a noleggio, forniti direttamente dal circuito, quindi non serve possedere un mezzo proprio. Circuiti in tutta Italia organizzano eventi aperti a chiunque, dai neofiti completi ai piloti più esperti, spesso divisi per fasce di livello. K-Hub raccoglie questi eventi da più organizzatori in un unico calendario, così puoi trovare facilmente una gara vicino a te.
        </div>
      </div>

      {/* Formati gara */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1.5rem' }}>
          <Zap size={22} /> I formati di gara
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {FORMATS.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="card-snappy" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Icon size={20} color="var(--castrol-red)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase' }}>{name}</h3>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Come leggere il calendario */}
      <div className="card-snappy" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
            <Calendar size={22} /> Come leggere un evento nel calendario
          </h2>
        </div>
        <div className="card-body" style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
          Ogni scheda evento nel <Link to="/calendar" style={{ color: 'var(--castrol-red)', fontWeight: 'bold' }}>Calendario</Link> mostra pista, data e format (Sprint o Endurance). Apri la scheda per vedere i dettagli e, se la gara è già stata disputata, la classifica finale con i tempi giro di ogni pilota. Ricorda: punti e classifiche sono confrontabili solo all'interno dello stesso evento, perché ogni organizzatore usa regole e piste diverse.
        </div>
      </div>

      {/* Come prenotare */}
      <div className="card-snappy" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
            <MapPin size={22} /> Come prenotare una pista
          </h2>
        </div>
        <div className="card-body" style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>
          K-Hub aggrega gli eventi ma non gestisce le iscrizioni: per prenotare devi contattare direttamente l'organizzatore o il circuito indicato nella scheda evento. Nella pagina <Link to="/tracks" style={{ color: 'var(--castrol-red)', fontWeight: 'bold' }}>Le Piste</Link> trovi l'elenco dei circuiti censiti: da lì puoi orientarti su quali sono attivi vicino a te prima ancora di guardare il calendario gare.
        </div>
      </div>

      {/* Glossario */}
      <div className="card-snappy" style={{ marginBottom: '30px', padding: '0', overflow: 'hidden' }}>
        <div className="card-header" style={{ background: 'var(--text-main)', color: 'white', borderBottom: 'none' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
            <BookOpen size={22} /> Glossario base
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {GLOSSARY.map(({ term, def }) => (
            <div key={term} style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--castrol-red)' }}>{term}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{def}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="card-snappy" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' }}>
            <HelpCircle size={22} /> Domande frequenti
          </h2>
        </div>
        <div>
          {FAQ.map((item, idx) => (
            <AccordionItem
              key={idx}
              question={item.q}
              answer={item.a}
              isOpen={openFaq === idx}
              onToggle={() => toggleFaq(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GuidaRental;
