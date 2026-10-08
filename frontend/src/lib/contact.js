// TODO: sostituire con l'indirizzo reale prima della messa in produzione.
// È l'unico punto del frontend dove l'email di contatto è definita.
export const CONTACT_EMAIL = 'furchia96@gmail.com';

function mailto(subject, body) {
  const query = `subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
  return `mailto:${CONTACT_EMAIL}?${query}`;
}

// Segnalazione di un circuito mancante; la regione (se nota) finisce nell'oggetto.
export function trackSuggestionMailto(region) {
  const subject = region ? `Segnalazione circuito — ${region}` : 'Segnalazione circuito';
  return mailto(subject, 'Nome del circuito:\nCittà:\nSito web (se c\'è):\n');
}

// Contatto per chi organizza gare e vuole comparire nel calendario.
export function organizerMailto() {
  return mailto('Organizzo gare: pubblicazione su K-Hub', 'Chi sono / che gare organizzo:\nSito o pagina iscrizioni:\n');
}
