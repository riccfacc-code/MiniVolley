import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 10000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- CONFIGURAZIONE DATABASE ---
// Il Pool gestisce le connessioni in modo efficiente per applicazioni Node.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessario per Render/PostgreSQL remoto
  }
});

// =========================================================
// 1. ENDPOINT: ANNOUNCEMENT (Avvisi a scorrimento)
// =========================================================

// Recupera tutti gli avvisi ordinati per priorità (order) e ID
app.get('/api/apps/undefined/entities/Announcement', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Announcement ORDER BY "order" ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crea un nuovo avviso
app.post('/api/apps/undefined/entities/Announcement', async (req, res) => {
  const { text, icon, active, order } = req.body;
  const isActive = (active === true || active === 1) ? 1 : 0;
  
  try {
    const result = await pool.query(
      'INSERT INTO Announcement (text, icon, active, "order") VALUES ($1, $2, $3, $4) RETURNING *',
      [text, icon, isActive, order ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggiorna un avviso esistente
app.put('/api/apps/undefined/entities/Announcement/:id', async (req, res) => {
  const { id } = req.params;
  const { text, icon, active, order } = req.body;
  const isActive = (active === true || active === 1) ? 1 : 0;
  
  try {
    const result = await pool.query(
      'UPDATE Announcement SET text = $1, icon = $2, active = $3, "order" = $4 WHERE id = $5 RETURNING *',
      [text, icon, isActive, order ?? 0, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Avviso non trovato" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Elimina un avviso
app.delete('/api/apps/undefined/entities/Announcement/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM Announcement WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Avviso non trovato" });
    res.json({ message: "Avviso eliminato con successo" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 2. ENDPOINT: TEAM (Squadre)
// =========================================================

app.get('/api/apps/undefined/entities/Team', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Team ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/undefined/entities/Team', async (req, res) => {
  const { name, group_name, category, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Team (name, group_name, category, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, group_name, category, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/apps/undefined/entities/Team/:id', async (req, res) => {
  try {
    const { name, group_name, category, color } = req.body;
    const result = await pool.query(
      'UPDATE Team SET name = $1, group_name = $2, category = $3, color = $4 WHERE team_id = $5 RETURNING *',
      [name, group_name, category, color, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Squadra non trovata" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/apps/undefined/entities/Team/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM Team WHERE team_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Squadra non trovata" });
    res.json({ message: "Squadra eliminata" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 3. ENDPOINT: MATCH (Partite)
// =========================================================

app.get('/api/apps/undefined/entities/Match', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Match ORDER BY match_order ASC, match_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/undefined/entities/Match', async (req, res) => {
  const m = req.body;
  try {
    const query = `INSERT INTO Match (team_a_id, team_a_name, team_b_id, team_b_name, score_a, score_b, phase, category, group_name, status, field, match_order) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    const values = [m.team_a_id, (m.team_a_name || m.team_home), m.team_b_id, (m.team_b_name || m.team_away), 
                    (m.score_a ?? m.score_home ?? 0), (m.score_b ?? m.score_away ?? 0), 
                    m.phase, m.category, m.group_name, m.status, m.field, (m.match_order ?? 0)];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/apps/undefined/entities/Match/:id', async (req, res) => {
  const m = req.body;
  try {
    const query = `UPDATE Match SET team_a_id = $1, team_a_name = $2, team_b_id = $3, team_b_name = $4, score_a = $5, 
                   score_b = $6, phase = $7, category = $8, group_name = $9, status = $10, field = $11, match_order = $12 
                   WHERE match_id = $13 RETURNING *`;
    const values = [m.team_a_id, (m.team_a_name || m.team_home), m.team_b_id, (m.team_b_name || m.team_away), 
                    (m.score_a ?? m.score_home ?? 0), (m.score_b ?? m.score_away ?? 0), m.phase, m.category, 
                    m.group_name, m.status, m.field, (m.match_order ?? 0), req.params.id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: "Partita non trovata" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/apps/undefined/entities/Match/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM Match WHERE match_id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Partita non trovata" });
    res.json({ message: "Partita eliminata" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 4. ENDPOINT: TOURNAMENT SETTINGS (Impostazioni Uniche)
// =========================================================

app.get('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM TournamentSettings WHERE id = 1');
    res.json(result.rows[0] ? [result.rows[0]] : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gestione "Upsert": Crea se non esiste, altrimenti aggiorna
app.post('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
  const s = req.body;
  const mpp = s.matches_per_page ?? 8;
  const values = [s.tournament_name, (s.scroll_speed ?? 20), s.logo_url, s.sub_title, s.details_line1, s.details_line2, mpp];

  try {
    const check = await pool.query('SELECT id FROM TournamentSettings WHERE id = 1');
    
    if (check.rows.length === 0) {
      const sql = `INSERT INTO TournamentSettings (id, tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page) 
                   VALUES (1, $1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      const result = await pool.query(sql, values);
      return res.status(201).json(result.rows[0]);
    } else {
      const sql = `UPDATE TournamentSettings SET tournament_name = $1, scroll_speed = $2, logo_url = $3, sub_title = $4, 
                   details_line1 = $5, details_line2 = $6, matches_per_page = $7 WHERE id = 1 RETURNING *`;
      const result = await pool.query(sql, values);
      return res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  // password definita in una variabile d'ambiente su Render
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: "admin-secret-token" });
  } else {
    res.status(401).json({ error: "Password errata" });
  }
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`Server operativo sulla porta ${port}`);
});
