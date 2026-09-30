import { useEffect } from 'react';

// Titolo della scheda del browser per la pagina corrente.
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
