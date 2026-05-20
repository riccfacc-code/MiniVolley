import axios from 'axios';

// ==================================================
// --- CONFIGURAZIONE ISTANZA BASE DI AXIOS ---
// ==================================================
// Definiamo l'istanza in minuscolo (apiClient) così da matchare perfettamente 
// tutti gli intercettori e le chiamate dell'oggetto Api sottostanti.
const apiClient = axios.create({
  baseURL: 'https://minivolley-backend.onrender.com', // URL del tuo backend su Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Esportazione di default (manteniamo sia Maiuscolo che minuscolo per sicurezza dei componenti esterni)
const ApiClient = apiClient;
export { ApiClient, apiClient };
export default apiClient;

// ==================================================
// --- FUNZIONI DI UTILITÀ PER IL MAPPING DEI DATI ---
// ==================================================

/**
 * Traduce i campi di un singolo Match dal formato Postgres (database)
 * al formato atteso dai componenti React del frontend.
 */
const mapMatchFields = (m) => {
    if (!m) return m;
    return {
        ...m,
        id: m.match_id,               // React si aspetta 'id', il DB usa 'match_id'
        team_home: m.team_a_name,     // Interfaccia usa team_home, il DB team_a_name
        team_away: m.team_b_name,     // Interfaccia usa team_away, il DB team_b_name
        score_home: m.score_a,        // Interfaccia usa score_home, il DB score_a
        score_away: m.score_b         // Interfaccia usa score_away, il DB score_b
    };
};

// ==================================================
// --- INTERCETTORE DI RISPOSTA (IL "TRADUTTORE") ---
// ==================================================
// Questo blocco intercetta QUALSIASI risposta SQL/Express prima che arrivi al componente React.
apiClient.interceptors.response.use(
    (response) => {
        // Estraiamo il corpo della risposta inviato dal server Express (i record del DB)
        const data = response.data;
        
        // Estraiamo l'URL della richiesta e lo convertiamo in minuscolo per evitare problemi di case-sensitive
        const requestUrl = (response.config.url || '').toLowerCase();

        // --- GESTIONE ROTTA: MATCH ---
        if (requestUrl.includes('/match')) {
            // Se la risposta è un array (es. la lista dei match), mappiamo ogni singolo elemento
            if (Array.isArray(data)) {
                return data.map(mapMatchFields);
            }
            // Se è un oggetto singolo (es. aggiornamento o recupero di un solo match)
            return mapMatchFields(data);
        }

        // --- GESTIONE ROTTA: TEAM ---
        if (requestUrl.includes('/team')) {
            const mapTeamFields = (t) => ({
                ...t,
                id: t.team_id || t.id // Assicura la presenza della chiave universale 'id' per React
            });

            if (Array.isArray(data)) {
                return data.map(mapTeamFields);
            }
            return mapTeamFields(data);
        }

        // --- GESTIONE ROTTA: ANNOUNCEMENT (AVVISI) ---
        if (requestUrl.includes('/announcement')) {

            // FIX IMPORTANTE: Se il metodo HTTP NON è una GET (quindi è una POST, PUT o DELETE),
            // il server risponde con stringhe di stato come "OK" o "Created". 
            // In questi casi restituiamo direttamente il dato senza provare a mapparlo come array.
            if (response.config.method !== 'get') {
                return data;
            }

            // Mappatura specifica per gli avvisi. Risolve il problema delle iniziali Maiuscole di SQL Server
            // (es: [Text] diventa text, [Active] diventa un booleano puro true/false).
            const mapAnnouncementFields = (a) => {
                if (!a || typeof a !== 'object') return null;
                return {
                    ...a,
                    id: a.Id ?? a.id,
                    text: a.Text ?? a.text,
                    icon: a.Icon ?? a.icon,
                    // Converte il valore 1/0 del font SQL (BIT) o il booleano in un booleano JavaScript nativo
                    active: (a.Active ?? a.active) === true || (a.Active ?? a.active) === 1,
                    order: a.Order ?? a.order
                };
            };

            // Paracadute di sicurezza: se la GET fallisce o non restituisce un array,
            // restituiamo un array vuoto [] così i cicli .map() di React non rompono l'applicazione.
            if (!Array.isArray(data)) {
                console.warn("Attenzione: L'API Announcement non ha restituito un array valido. Dati ricevuti:", data);
                return [];
            }

            // Mappa i campi e rimuove eventuali valori nulli o indefiniti (.filter(Boolean))
            return data.map(mapAnnouncementFields).filter(Boolean);
        }

        // --- GESTIONE ROTTA: TOURNAMENT SETTINGS ---
        if (requestUrl.includes('/tournamentsettings')) {
            
            // Se stiamo salvando o modificando (POST, PUT), non serve mappare la risposta di stato
            if (response.config.method !== 'get') {
                return data;
            }

            const mapTournamentFields = (t) => {
                if (!t) return null;
                return {
                    ...t,
                    id: t.id,
                    // Mappatura esplicita dei campi Postgres (snake_case) verso lo stato React
                    tournament_name: t.tournament_name,
                    sub_title: t.sub_title,
                    details_line1: t.details_line1,
                    details_line2: t.details_line2,
                    scroll_speed: t.scroll_speed,
                    matches_per_page: t.matches_per_page,
                    logo_url: t.logo_url
                };
            };

            // Poiché PostgreSQL restituisce la configurazione come array di righe (es: [ { ... } ]),
            // estraiamo il primo elemento se il componente si aspetta l'oggetto delle impostazioni diretto.
            if (Array.isArray(data)) {
                return data.length > 0 ? mapTournamentFields(data[0]) : null;
            }

            return mapTournamentFields(data);
        }

        // Per tutte le altre rotte senza logica di mapping restituisce i dati grezzi
        return data;
    },
    (error) => {
        // Centralizzazione degli errori di rete o del database
        console.error('Errore chiamata API Backend:', error);
        return Promise.reject(error); // Rilancia l'errore in modo che il componente possa intercettarlo con un try/catch
    }
);

// ==================================================
// --- SIMULAZIONE SOTTOSCRIZIONE REAL-TIME ---
// ==================================================
const mockSubscribe = (callback) => {
    return () => console.log("Unsubscribed dal finto real-time locale");
};

// ==================================================
// --- ESPORTAZIONE DELL'OGGETTO API GLOBALE ---
// ==================================================
export const Api = {
    entities: {
        // Gestione Squadre
        Team: {
            list: () => apiClient.get('/api/entities/Team'),
            create: (data) => apiClient.post('/api/entities/Team', data),
            update: (id, data) => apiClient.put(`/api/entities/Team/${id}`, data),
            delete: (id) => apiClient.delete(`/api/entities/Team/${id}`),
            subscribe: mockSubscribe
        },
        // Gestione Partite
        Match: {
            list: () => apiClient.get('/api/entities/Match'),
            create: (data) => apiClient.post('/api/entities/Match', data),
            update: (id, data) => apiClient.put(`/api/entities/Match/${id}`, data),
            delete: (id) => apiClient.delete(`/api/entities/Match/${id}`),
            subscribe: mockSubscribe
        },
        // Gestione Impostazioni Generali Torneo
        TournamentSettings: {
            list: () => apiClient.get('/api/entities/TournamentSettings'),
            create: (data) => apiClient.post('/api/entities/TournamentSettings', data),
            update: (id, data) => apiClient.put(`/api/entities/TournamentSettings/${id}`, data),
            delete: (id) => apiClient.delete(`/api/entities/TournamentSettings/${id}`),
            subscribe: mockSubscribe
        },
        // Gestione Avvisi Scorrevoli (Tabellone)
        Announcement: {
            list: () => apiClient.get('/api/entities/Announcement'),
            create: (data) => apiClient.post('/api/entities/Announcement', data),
            update: (id, data) => apiClient.put(`/api/entities/Announcement/${id}`, data),
            delete: (id) => apiClient.delete(`/api/entities/Announcement/${id}`),
            subscribe: mockSubscribe
        }
    },
    
    auth: {
        me: async () => ({ id: "local-admin", name: "Amministratore Locale", role: "admin" }),
        logout: () => console.log("Logout simulato"),
        redirectToLogin: () => console.log("Login non necessario")
    }
};
