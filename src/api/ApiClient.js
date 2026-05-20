import axios from 'axios';

// ==================================================
// --- CONFIGURAZIONE ISTANZA BASE DI AXIOS ---
// ==================================================

const apiClient = axios.create({
  baseURL: 'https://minivolley-backend.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export { apiClient };
export default apiClient;

// ==================================================
// --- FUNZIONI DI UTILITÀ PER IL MAPPING ---
// ==================================================

const mapMatchFields = (m) => ({
  ...m,
  id: m.match_id,
  team_home: m.team_a_name,
  team_away: m.team_b_name,
  score_home: m.score_a,
  score_away: m.score_b
});

// ==================================================
// --- INTERCETTORE DI RISPOSTA ---
// ==================================================

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    const url = response.config.url;

    if (url.includes('/entities/Match')) {
      return Array.isArray(data) ? data.map(mapMatchFields) : mapMatchFields(data);
    }

    if (url.includes('/entities/Team')) {
      const mapTeam = (t) => ({ ...t, id: t.team_id || t.id });
      return Array.isArray(data) ? data.map(mapTeam) : mapTeam(data);
    }

    if (url.includes('/entities/Announcement')) {
      if (response.config.method !== 'get') return data;
      const mapAnn = (a) => ({
        ...a,
        id: a.Id ?? a.id,
        text: a.Text ?? a.text,
        icon: a.Icon ?? a.icon,
        active: (a.Active ?? a.active) === true || (a.Active ?? a.active) === 1,
        order: a.Order ?? a.order
      });
      return Array.isArray(data) ? data.map(mapAnn).filter(Boolean) : [];
    }

    return data;
  },
  (error) => {
    console.error('Errore chiamata API:', error);
    return Promise.reject(error);
  }
);

// ==================================================
// --- OGGETTO API GLOBALE ---
// ==================================================

const mockSubscribe = () => () => console.log("Unsubscribed");

export const Api = {
  entities: {
    Team: {
      list: () => apiClient.get('/api/apps/undefined/entities/Team'),
      create: (data) => apiClient.post('/api/apps/undefined/entities/Team', data),
      update: (id, data) => apiClient.put(`/api/apps/undefined/entities/Team/${id}`, data),
      delete: (id) => apiClient.delete(`/api/apps/undefined/entities/Team/${id}`),
      subscribe: mockSubscribe
    },
    Match: {
      list: () => apiClient.get('/api/apps/undefined/entities/Match'),
      create: (data) => apiClient.post('/api/apps/undefined/entities/Match', data),
      update: (id, data) => apiClient.put(`/api/apps/undefined/entities/Match/${id}`, data),
      delete: (id) => apiClient.delete(`/api/apps/undefined/entities/Match/${id}`),
      subscribe: mockSubscribe
    },
    TournamentSettings: {
      list: () => apiClient.get('/api/apps/undefined/entities/TournamentSettings'),
      create: (data) => apiClient.post('/api/apps/undefined/entities/TournamentSettings', data),
      // Ora invia la PUT alla rotta senza ID
      update: (data) => apiClient.put('/api/apps/undefined/entities/TournamentSettings', data),
      delete: () => apiClient.delete('/api/apps/undefined/entities/TournamentSettings'),
      subscribe: mockSubscribe
    },
    Announcement: {
      list: () => apiClient.get('/api/apps/undefined/entities/Announcement'),
      create: (data) => apiClient.post('/api/apps/undefined/entities/Announcement', data),
      update: (id, data) => apiClient.put(`/api/apps/undefined/entities/Announcement/${id}`, data),
      delete: (id) => apiClient.delete(`/api/apps/undefined/entities/Announcement/${id}`),
      subscribe: mockSubscribe
    }
  },
  auth: {
    me: async () => ({ id: "local-admin", name: "Amministratore Locale", role: "admin" }),
    logout: () => {},
    redirectToLogin: () => {}
  }
};
