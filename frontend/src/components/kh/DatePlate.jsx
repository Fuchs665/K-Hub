import React from 'react';
import { datePlateParts, formatLongDate } from '../../lib/format';

// Targa con la data della gara: giorno grande, mese e giorno della settimana sotto.
function DatePlate({ date }) {
  const parts = datePlateParts(date);
  if (!parts) return <span className="kh-plate" aria-label="Data da confermare"><span className="kh-plate__day">?</span></span>;
  return (
    <span className="kh-plate" aria-label={formatLongDate(date)}>
      <span className="kh-plate__day" aria-hidden="true">{parts.day}</span>
      <span className="kh-plate__month" aria-hidden="true">{parts.month}</span>
      <span className="kh-plate__weekday" aria-hidden="true">{parts.weekday}</span>
    </span>
  );
}

export default DatePlate;
