export function formatTimeMs(timeMs) {
  if (!timeMs) return '--:--.---';
  const minutes = Math.floor(timeMs / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);
  const milliseconds = timeMs % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Inverso di formatTimeMs: "1:02.345", "62.345" o con virgola decimale -> ms.
// Ritorna null se il formato non è riconosciuto.
export function parseTimeToMs(str) {
  if (!str) return null;
  const match = str.trim().replace(',', '.').match(/^(?:(\d+):)?(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const minutes = parseInt(match[1] || '0', 10);
  const seconds = parseInt(match[2], 10);
  if (seconds >= 60 && minutes > 0) return null;
  const millis = parseInt((match[3] || '0').padEnd(3, '0'), 10);
  return minutes * 60000 + seconds * 1000 + millis;
}
