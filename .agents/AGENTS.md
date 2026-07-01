# Hub Rental Karting Italia - Contesto Progetto

Questo file serve per dare contesto a qualsiasi agente Antigravity opererà in questo workspace.

## Stack Tecnologico
- **Frontend:** React, Vite, Tailwind CSS (v4), lucide-react. (Cartella `frontend/`)
- **Backend/DB:** Supabase (PostgreSQL, Auth). Chiavi in `frontend/.env.local`.
- **Data Ingestion:** Scraper Python (BeautifulSoup, Supabase Python Client). (Cartella `scraper/`)

## Obiettivo (Milestone 1)
Costruire un hub centralizzato per piloti di rental kart in Italia (focus sui neofiti).
Attualmente siamo alla **Milestone 1**: 
- Il database su Supabase è configurato (tabelle `events` e `tracks`).
- Lo scraper base Python funziona e riesce a connettersi al DB.
- Il prossimo passo (spesso tramite comando `/goal`) sarà sviluppare lo scraper reale per estrarre eventi da SWS (Sodi World Series) e KZR, oltre a mostrare i dati dal DB sul Frontend in React.

## Regole di Sviluppo
- Assumere sempre un approccio "Zero Budget": usare solo tier gratuiti (Vercel, Supabase).
- Design del frontend: stile "Premium", scuro, con glassmorphism (già abbozzato in `index.css`).
- Quando si scrivono nuovi script Python, assicurarsi che gestiscano l'encoding su Windows in modo sicuro (evitare crash da print con emoji non supportate).
