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
  // Gestione booleano/numerico coerente con lo sviluppo locale
  const isActive = active === true || active === 1 ? 1 : 0;
  try {
    const result = await pool.query(
      'INSERT INTO Announcement (text, icon, active, "order") VALUES ($1, $2, $3, $4) RETURNING *',
      [text, icon, isActive, order ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [PORTATO DA VITE] Aggiornamento di un Avviso (PUT)
app.put('/api/apps/undefined/entities/Announcement/:id', async (req, res) => {
  const { id } = req.params;
  const { text, icon, active, order } = req.body;
  const isActive = active === true || active === 1 ? 1 : 0;
  try {
    const result = await pool.query(
      'UPDATE Announcement SET text = $1, icon = $2, active = $3, "order" = $4 WHERE id = $5 RETURNING *',
      [text, icon, isActive, order ?? 0, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Avviso non trovato" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Rimuove permanentemente un avviso tramite il suo ID
app.delete('/api/apps/undefined/entities/Announcement/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Announcement WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Avviso non trovato" });
    }
    res.json({ message: "Avviso eliminato con successo" });
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

// [PORTATO DA VITE] Aggiorna i dettagli di una squadra esistente tramite il suo ID (PUT)
app.put('/api/apps/undefined/entities/Team/:id', async (req, res) => {
  const teamId = req.params.id;
  const { name, group_name, category, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Team SET name = $1, group_name = $2, category = $3, color = $4 WHERE team_id = $5 RETURNING *',
      [name, group_name, category, color, teamId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Squadra non trovata" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [PORTATO DA VITE] Elimina una squadra specifica tramite ID (DELETE)
app.delete('/api/apps/undefined/entities/Team/:id', async (req, res) => {
  const teamId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM Team WHERE team_id = $1 RETURNING *', [teamId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Squadra non trovata" });
    }
    res.json({ message: "Squadra eliminata con successo" });
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
  const m = req.body;
  
  // Applica i fallback usati localmente per garantire stabilità nell'inserimento
  const scoreA = m.score_a !== undefined ? m.score_a : m.score_home;
  const scoreB = m.score_b !== undefined ? m.score_b : m.score_away;
  const teamAName = m.team_a_name || m.team_home;
  const teamBName = m.team_b_name || m.team_away;

  try {
    const result = await pool.query(
      `INSERT INTO Match (team_a_id, team_a_name, team_b_id, team_b_name, score_a, score_b, phase, category, group_name, status, field, match_order) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [m.team_a_id, teamAName, m.team_b_id, teamBName, scoreA ?? 0, scoreB ?? 0, m.phase, m.category, m.group_name, m.status, m.field, m.match_order ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Aggiornamento Completo della Partita (PUT) con Fallback Integrati da locale
app.put('/api/apps/undefined/entities/Match/:id', async (req, res) => {
  const { id } = req.params;
  const m = req.body;

  // [PORTATO DA VITE] Gestione dei Fallback proprietà (score_home -> score_a, ecc.)
  const scoreA = m.score_a !== undefined ? m.score_a : m.score_home;
  const scoreB = m.score_b !== undefined ? m.score_b : m.score_away;
  const teamAName = m.team_a_name || m.team_home;
  const teamBName = m.team_b_name || m.team_away;

  try {
    const result = await pool.query(
      `UPDATE Match 
       SET team_a_id = $1, team_a_name = $2, team_b_id = $3, team_b_name = $4,
           score_a = $5, score_b = $6, phase = $7, category = $8, 
           group_name = $9, status = $10, field = $11, match_order = $12
       WHERE match_id = $13 
       RETURNING *`,
      [
        m.team_a_id, teamAName, m.team_b_id, teamBName,
        scoreA ?? 0, scoreB ?? 0, m.phase, m.category,
        m.group_name, m.status, m.field, m.match_order ?? 0,
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
    res.json(result.rows[0] ? [result.rows[0]] : []); // In locale restituisci un array, manteniamo la coerenza di output
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
  const s = req.body;
  const mpp = s.matches_per_page !== undefined ? s.matches_per_page : 8;

  try {
    // 1. Controlliamo se il record esiste
    const check = await pool.query('SELECT id FROM TournamentSettings WHERE id = 1');

    if (check.rows.length === 0) {
      // 2a. Se non esiste: facciamo una INSERT
      const insertQuery = `
        INSERT INTO TournamentSettings (id, tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7)
        RETURNING *`;
      const result = await pool.query(insertQuery, [s.tournament_name, s.scroll_speed ?? 20, s.logo_url, s.sub_title, s.details_line1, s.details_line2, mpp]);
      return res.status(201).json(result.rows[0]);
    } else {
      // 2b. Se esiste: facciamo un UPDATE
      const updateQuery = `
        UPDATE TournamentSettings 
        SET tournament_name = $1, scroll_speed = $2, logo_url = $3, sub_title = $4, details_line1 = $5, details_line2 = $6, matches_per_page = $7
        WHERE id = 1
        RETURNING *`;
      const result = await pool.query(updateQuery, [s.tournament_name, s.scroll_speed ?? 20, s.logo_url, s.sub_title, s.details_line1, s.details_line2, mpp]);
      return res.json(result.rows[0]);
    }
  } catch (err) {
    console.error("Errore nel salvataggio impostazioni:", err);
    res.status(500).json({ error: err.message });
  }
});
// In produzione non serve la PUT o la DELETE distruttiva di impostazioni singole,
// poiché la POST gestisce già l'ON CONFLICT (equivalente del MERGE locale).

// Check di salute base
app.get('/', (req, res) => {
  res.send('Backend MiniVolley PostgreSQL funzionante!');
});

app.listen(port, () => {
  console.log(`Server in esecuzione sulla porta ${port}`);
});
