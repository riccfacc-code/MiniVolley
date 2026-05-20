import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';
import sql from 'mssql';

// ==========================================
// --- CONFIGURAZIONE DATABASE SQL SERVER ---
// ==========================================
// Definizione delle credenziali e dei parametri di rete per connettersi all'istanza locale
const dbConfig = {
    server: 'localhost',                  // Il database gira sulla stessa macchina del server web
    database: 'MiniVolley',               // Nome del database di riferimento
    user: 'minivolley_user',              // Nome utente SQL Server
    password: 'Torneo2026!',              // Password dell'utente SQL Server
    options: {
        instanceName: 'SQLEXPRESS2022',   // Nome dell'istanza specifica di SQL Express
        enableArithAbort: true,           // Termina le query in caso di errori di overflow o divisione per zero
        trustServerCertificate: true,     // Necessario se non si usa un certificato SSL valido localmente
        connectTimeout: 30000             // Tempo massimo di attesa per la connessione (30 secondi)
    }
};

export default defineConfig({
    plugins: [
        react(), // Plugin standard per supportare la compilazione di React

        // ==================================================
        // --- PLUGIN PERSONALIZZATO: BACKEND INTEGRATO ---
        // ==================================================
        // Questo plugin permette di far girare un server Express nello stesso processo di Vite,
        // evitando di dover configurare CORS o lanciare un server Node.js separato.
        {
            name: 'integrated-express-backend',
            configureServer(server) {

                // --- Connessione iniziale al database all'avvio di Vite ---
                sql.connect(dbConfig).then(() => {
                    console.log(" -> Connesso con successo a SQL Server: ZBOOK-001\\SQLEXPRESS2022 (DB: MiniVolley)");
                }).catch(err => {
                    console.error(" -> Errore di connessione a SQL Server:", err);
                });

                // Inizializzazione dell'applicazione Express
                const app = express();
                // Middleware per convertire automaticamente i body delle richieste POST/PUT da JSON a oggetti JavaScript
                app.use(express.json());

                // ==========================================
                // --- ENDPOINT ENTITÀ: TEAM (SQUADRE) ---
                // ==========================================

                // Legge tutte le squadre presenti nel DB
                app.get('/api/apps/undefined/entities/Team', async (req, res) => {
                    try {
                        const result = await sql.query`SELECT * FROM dbo.Team`;
                        res.json(result.recordset); // Ritorna l'array dei record trovati
                    } catch (err) {
                        res.status(500).send(err.message); // In caso di errore risponde con un 500 (Server Error)
                    }
                });

                // Inserisce una nuova squadra
                app.post('/api/apps/undefined/entities/Team', async (req, res) => {
                    const { name, group_name, category, color } = req.body;
                    try {
                        // Utilizza le "tagged template literals" di mssql per prevenire la SQL Injection
                        await sql.query`INSERT INTO dbo.Team (name, group_name, category, color) 
                            VALUES (${name}, ${group_name}, ${category}, ${color})`;
                        res.sendStatus(201); // 201 Created: squadra creata con successo
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Aggiorna i dettagli di una squadra esistente tramite il suo ID
                app.put('/api/apps/undefined/entities/Team/:id', async (req, res) => {
                    const teamId = req.params.id; // Recupera l'ID passato nell'URL
                    const { name, group_name, category, color } = req.body;
                    try {
                        await sql.query`UPDATE dbo.Team 
                            SET name = ${name}, group_name = ${group_name}, category = ${category}, color = ${color}
                            WHERE team_id = ${teamId}`;
                        res.sendStatus(200); // 200 OK: aggiornamento riuscito
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Elimina una squadra specifica tramite ID
                app.delete('/api/apps/undefined/entities/Team/:id', async (req, res) => {
                    const teamId = req.params.id;
                    try {
                        await sql.query`DELETE FROM dbo.Team WHERE team_id = ${teamId}`;
                        res.sendStatus(200); // 200 OK: eliminazione riuscita
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });


                // ==========================================
                // --- ENDPOINT ENTITÀ: MATCH (PARTITE) ---
                // ==========================================

                // Recupera tutte le partite ordinate per l'ordine cronologico/visivo stabilito
                app.get('/api/apps/undefined/entities/Match', async (req, res) => {
                    try {
                        const result = await sql.query`SELECT * FROM dbo.Match ORDER BY match_order ASC`;
                        res.json(result.recordset);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Inserisce una nuova partita con tutti i dettagli di gioco
                app.post('/api/apps/undefined/entities/Match', async (req, res) => {
                    const m = req.body;
                    try {
                        await sql.query`INSERT INTO dbo.Match (team_a_id, team_a_name, team_b_id, team_b_name, score_a, score_b, phase, category, group_name, status, field, match_order) 
                            VALUES (${m.team_a_id}, ${m.team_a_name}, ${m.team_b_id}, ${m.team_b_name}, ${m.score_a}, ${m.score_b}, ${m.phase}, ${m.category}, ${m.group_name}, ${m.status}, ${m.field}, ${m.match_order})`;
                        res.sendStatus(201);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Aggiorna i dati di una partita (punteggi, stato, campo, ecc.)
                app.put('/api/apps/undefined/entities/Match/:id', async (req, res) => {
                    const matchId = req.params.id;
                    const m = req.body;

                    // Gestione dei Fallback: se il frontend invia proprietà con nomi leggermente differenti 
                    // (es. score_home al posto di score_a), viene comunque preso il valore corretto.
                    const scoreA = m.score_a !== undefined ? m.score_a : m.score_home;
                    const scoreB = m.score_b !== undefined ? m.score_b : m.score_away;
                    const teamAName = m.team_a_name || m.team_home;
                    const teamBName = m.team_b_name || m.team_away;

                    try {
                        await sql.query`UPDATE dbo.Match 
                            SET team_a_id = ${m.team_a_id}, 
                                team_a_name = ${teamAName}, 
                                team_b_id = ${m.team_b_id}, 
                                team_b_name = ${teamBName}, 
                                score_a = ${scoreA}, 
                                score_b = ${scoreB}, 
                                phase = ${m.phase}, 
                                category = ${m.category}, 
                                group_name = ${m.group_name}, 
                                status = ${m.status}, 
                                field = ${m.field}, 
                                match_order = ${m.match_order}
                            WHERE match_id = ${matchId}`;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Elimina una partita tramite ID
                app.delete('/api/apps/undefined/entities/Match/:id', async (req, res) => {
                    const matchId = req.params.id;
                    try {
                        await sql.query`DELETE FROM dbo.Match WHERE match_id = ${matchId}`;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });


                // =======================================================
                // --- ENDPOINT ENTITÀ: TOURNAMENT SETTINGS (IMPOSTAZIONI) ---
                // =======================================================

                // Legge i parametri globali del torneo (nome, velocità scorrimento, logo, e limite partite)
                app.get('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
                    try {
                        // Viene preso solo il primo record (TOP 1) perché le impostazioni generali sono uniche
                        const result = await sql.query`SELECT TOP 1 tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page FROM dbo.TournamentSettings`;
                        res.json(result.recordset);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Salva o aggiorna le impostazioni globali (usa un'istruzione MERGE di SQL Server)
                app.post('/api/apps/undefined/entities/TournamentSettings', async (req, res) => {
                    const s = req.body;
                    // Se 'matches_per_page' non viene inviato dal frontend, imposta un valore di default a 8
                    const mpp = s.matches_per_page !== undefined ? s.matches_per_page : 8;
                    try {
                        // Il MERGE controlla se esiste già un record (ON 1=1). 
                        // Se esiste lo aggiorna (UPDATE), altrimenti crea la prima riga (INSERT).
                        await sql.query`
                            MERGE dbo.TournamentSettings AS target
                            USING (SELECT 1 AS dummy) AS source
                            ON (1=1)
                            WHEN MATCHED THEN
                                UPDATE SET tournament_name = ${s.tournament_name}, 
                                           scroll_speed = ${s.scroll_speed}, 
                                           logo_url = ${s.logo_url},
                                           sub_title = ${s.sub_title},
                                           details_line1 = ${s.details_line1},
                                           details_line2 = ${s.details_line2},
                                           matches_per_page = ${mpp}
                            WHEN NOT MATCHED THEN
                                INSERT (tournament_name, scroll_speed, logo_url, sub_title, details_line1, details_line2, matches_per_page) 
                                VALUES (${s.tournament_name}, ${s.scroll_speed}, ${s.logo_url}, ${s.sub_title}, ${s.details_line1}, ${s.details_line2}, ${mpp});
                        `;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Endpoint di fallback per l'aggiornamento massivo delle impostazioni
                app.put('/api/apps/undefined/entities/TournamentSettings/:id', async (req, res) => {
                    const s = req.body;
                    const mpp = s.matches_per_page !== undefined ? s.matches_per_page : 8;
                    try {
                        await sql.query`UPDATE dbo.TournamentSettings 
                            SET tournament_name = ${s.tournament_name}, 
                                scroll_speed = ${s.scroll_speed}, 
                                logo_url = ${s.logo_url},
                                sub_title = ${s.sub_title},
                                details_line1 = ${s.details_line1},
                                details_line2 = ${s.details_line2},
                                matches_per_page = ${mpp}`;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Svuota completamente la tabella delle impostazioni
                app.delete('/api/apps/undefined/entities/TournamentSettings/:id', async (req, res) => {
                    try {
                        await sql.query`DELETE FROM dbo.TournamentSettings`;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });


                // ==========================================
                // --- ENDPOINT ENTITÀ: ANNOUNCEMENT (AVVISI) ---
                // ==========================================

                // Recupera gli avvisi da mostrare nel tabellone, ordinati per l'ordine di visualizzazione
                app.get('/api/apps/undefined/entities/Announcement', async (req, res) => {
                    try {
                        const result = await sql.query`SELECT [Id], [Text], [Icon], [Active], [Order] FROM dbo.Announcement ORDER BY [Order] ASC`;
                        res.json(result.recordset);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Crea un nuovo avviso scorrevole o informativo
                app.post('/api/apps/undefined/entities/Announcement', async (req, res) => {
                    const { text, icon, active, order } = req.body;
                    // SQL Server gestisce i booleani come BIT (0 o 1). Convertiamo il true/false del frontend in 1/0.
                    const isActive = active === true || active === 1 ? 1 : 0;
                    try {
                        await sql.query`INSERT INTO dbo.Announcement ([Text], [Icon], [Active], [Order]) 
                            VALUES (${text}, ${icon}, ${isActive}, ${order})`;
                        res.sendStatus(201);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Aggiorna il testo, l'icona, lo stato di attivazione o l'ordine di un avviso specifico
                app.put('/api/apps/undefined/entities/Announcement/:id', async (req, res) => {
                    const id = req.params.id;
                    const { text, icon, active, order } = req.body;
                    const isActive = active === true || active === 1 ? 1 : 0;
                    try {
                        await sql.query`UPDATE dbo.Announcement 
                            SET [Text] = ${text}, [Icon] = ${icon}, [Active] = ${isActive}, [Order] = ${order}
                            WHERE [Id] = ${id}`;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // Rimuove permanentemente un avviso tramite il suo ID
                app.delete('/api/apps/undefined/entities/Announcement/:id', async (req, res) => {
                    const id = req.params.id;
                    try {
                        await sql.query`DELETE FROM dbo.Announcement WHERE [Id] = ${id}`;
                        res.sendStatus(200);
                    } catch (err) {
                        res.status(500).send(err.message);
                    }
                });

                // --- INIEZIONE IN VITE ---
                // Dice all'istanza di sviluppo di Vite di inoltrare le richieste HTTP del frontend 
                // verso l'applicazione Express appena configurata qui sopra.
                server.middlewares.use(app);
            }
        }
    ],
    // ==========================================
    // --- RISOLUZIONE DEI PERCORSI (ALIAS) ---
    // ==========================================
    resolve: {
        alias: {
            // Permette di usare la scorciatoia '@/' per puntare alla cartella 'src' nei file React (es: import '@/components/Button')
            '@': path.resolve(__dirname, './src'),
        },
    },
});