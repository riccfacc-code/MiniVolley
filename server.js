import express from 'express';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
app.use(express.json());
app.use(cors());

// Connessione a PostgreSQL tramite la stringa d'ambiente che ci darà Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Richiesto da Render per le connessioni sicure SSL
    }
});

// Test di connessione iniziale
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("-> Errore di connessione a PostgreSQL:", err);
    } else {
        console.log("-> Connesso con successo a PostgreSQL su Render!");
    }
});

// ==========================================
// --- ENDPOINT ENTITÀ: TEAM (SQUADRE) ---
// ==========================================

app.get('/api/apps/undefined/entities/Team', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Team');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/apps/undefined/entities/Team', async (req, res) => {
    const { name, group_name, category, color } = req.body;
    try {
        await pool.query(
            'INSERT INTO Team (name, group_name, category, color) VALUES ($1, $2, $3, $4)',
            [name, group_name, category, color]
        );
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/apps/undefined/entities/Team/:id', async (req, res) => {
    const teamId = req.params.id;
    const { name, group_name, category, color } = req.body;
    try {
        await pool.query(
            'UPDATE Team SET name = $1, group_name = $2, category = $3, color = $4 WHERE team_id = $5',
            [name, group_name, category, color, teamId]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/apps/undefined/entities/Team/:id', async (req, res) => {
    const teamId = req.params.id;
    try {
        await pool.query('DELETE FROM Team WHERE team_id = $1', [teamId]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// --- ENDPOINT ENTITÀ: MATCH (PARTITE) ---
// ==========================================

app.get('/api/apps/undefined/entities/Match', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Match ORDER BY match_order ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/apps/undefined/entities/Match', async (req, res) => {
    const m = req.body;
    try {
        await pool.query(
            'INSERT INTO Match (team_a_id, team_a_name, team_b_id, team_b_name, score_a, score_b, phase, category, group_name, status, field, match_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [m.team_a_id, m.team_a_name, m.team_b_id, m.team_b_name, m.score_a, m.score_b, m.phase, m.category, m.group_name, m.status, m.field, m.match_order]
        );
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/apps/undefined/entities/Match/:id', async (req, res) => {
    const matchId = req.params.id;
    const m = req.body;
    const scoreA = m.score_a !== undefined ? m.score_a : m.score_home;
    const scoreB = m.score_b !== undefined ? m.score_b : m.score_away;
    const teamAName = m.team_a_name || m.team_home;
    const teamBName = m.team_b_name || m.team_away;
    try {
        await pool.query(
            'UPDATE Match SET team_a_id = $1, team_a_name = $2, team_b_id = $3, team_b_name = $4, score_a = $5, score_b = $6, phase = $7, category = $8, group_name = $9, status = $10, field = $11, match_order = $12 WHERE match_id = $13',
            [m.team_a_id, teamAName, m.team_b_id, teamBName, scoreA, scoreB, m.phase, m.category, m.group_name, m.status, m.field, m.match_order, matchId]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/apps/undefined/entities/Match/:id', async (req, res) => {
    const matchId = req.params.id;
    try {
        await pool.query('DELETE FROM Match WHERE match_id = $1', [matchId]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// --- ENDPOINT ENTITÀ: TOURNAMENT SETTINGS ---
// ==========================================

app.get('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
    try {
        const result = await pool.query('SELECT tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page FROM TournamentSettings LIMIT 1');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// Ottimizzato con l'ON CONFLICT (UPSERT) di Postgres
app.post('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
    const s = req.body;
    const mpp = s.matches_per_page !== undefined ? s.matches_per_page : 8;
    try {
        await pool.query(`
            INSERT INTO TournamentSettings (id, tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page)
            VALUES (1, $1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                tournament_name = EXCLUDED.tournament_name,
                scroll_speed = EXCLUDED.scroll_speed,
                logo_url = EXCLUDED.logo_url,
                sub_title = EXCLUDED.sub_title,
                details_line1 = EXCLUDED.details_line1,
                details_line2 = EXCLUDED.details_line2,
                matches_per_page = EXCLUDED.matches_per_page
        `, [s.tournament_name, s.scroll_speed, s.logo_url, s.sub_title, s.details_line1, s.details_line2, mpp]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// --- ENDPOINT ENTITÀ: ANNOUNCEMENT ---
// ==========================================

app.get('/api/apps/undefined/entities/Announcement', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, text, icon, active, "order" FROM Announcement ORDER BY "order" ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server backend in ascolto sulla porta ${PORT}`);
});