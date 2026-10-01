import React from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

// Esito di un'azione: riquadro con icona, annunciato dagli screen reader
// (status per il successo, alert per l'errore).
function Notice({ kind, children }) {
  const ok = kind === 'success';
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <div className={`kh-notice ${ok ? 'is-success' : 'is-error'}`} role={ok ? 'status' : 'alert'}>
      <Icon size={20} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default Notice;
