import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 10000;

// Abilita CORS per permettere al frontend Static Site di comunicare con questo backend
app.use(cors());
app.use(express.json());

// Configurazione del pool di connessione a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obbligatorio per le connessioni sicure verso Render
  }
});

// ==========================================
// 1. ENDPOINT ANNOUNCEMENT (Avvisi)
// ==========================================
app.get('/api/apps/undefined/entities/Announcement', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Announcement ORDER BY "order" ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/undefined/entities/Announcement', async (req, res) => {
  const { text, icon, active, order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Announcement (text, icon, active, "order") VALUES ($1, $2, $3, $4) RETURNING *',
      [text, icon, active ?? 1, order ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ENDPOINT TEAM (Squadre)
// ==========================================
app.get('/api/apps/undefined/entities/Team', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Team ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ENDPOINT MATCH (Partite)
// ==========================================
app.get('/api/apps/undefined/entities/Match', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Match ORDER BY match_order ASC, match_id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/undefined/entities/Match', async (req, res) => {
  const { team_a_id, team_a_name, team_b_id, team_b_name, score_a, score_b, phase, category, group_name, status, field, match_order } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Match (team_a_id, team_a_name, team_b_id, team_b_name, score_a, score_b, phase, category, group_name, status, field, match_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [team_a_id, team_a_name, team_b_id, team_b_name, score_a ?? 0, score_b ?? 0, phase, category, group_name, status, field, match_order ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Aggiornamento Risultati Partita (PUT)
// Aggiornamento Completo della Partita (PUT) - Sostituisci questo blocco
app.put('/api/apps/undefined/entities/Match/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    team_a_id, team_a_name, team_b_id, team_b_name, 
    score_a, score_b, phase, category, group_name, 
    status, field, match_order 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE Match 
       SET team_a_id = $1, team_a_name = $2, team_b_id = $3, team_b_name = $4,
           score_a = $5, score_b = $6, phase = $7, category = $8, 
           group_name = $9, status = $10, field = $11, match_order = $12
       WHERE match_id = $13 
       RETURNING *`,
      [
        team_a_id, team_a_name, team_b_id, team_b_name,
        score_a ?? 0, score_b ?? 0, phase, category,
        group_name, status, field, match_order ?? 0,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Partita non trovata" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Errore durante l'update del match:", err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminazione di una Partita (DELETE)
app.delete('/api/apps/undefined/entities/Match/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM Match WHERE match_id = $1 RETURNING *',
      [id]
    );

    // Se non elimina nulla significa che l'id non esisteva a database
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Partita non trovata o già eliminata" });
    }

    res.json({ message: "Partita eliminata con successo", deleted: result.rows[0] });
  } catch (err) {
    console.error("Errore durante la cancellazione del match:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ENDPOINT TOURNAMENT SETTINGS (Impostazioni)
// ==========================================
app.get('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM TournamentSettings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
  const { tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO TournamentSettings (id, tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         tournament_name = EXCLUDED.tournament_name,
         scroll_speed = EXCLUDED.scroll_speed,
         logo_url = EXCLUDED.logo_url,
         sub_title = EXCLUDED.sub_title,
         details_line1 = EXCLUDED.details_line1,
         details_line2 = EXCLUDED.details_line2,
         matches_per_page = EXCLUDED.matches_per_page
       RETURNING *`,
      [tournament_name, scroll_speed ?? 20, logo_url, sub_title, details_line1, details_line2, matches_per_page ?? 8]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Check di salute base
app.get('/', (req, res) => {
  res.send('Backend MiniVolley PostgreSQL funzionante!');
});

app.listen(port, () => {
  console.log(`Server in esecuzione sulla porta ${port}`);
});
