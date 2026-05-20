import React, { useState, useEffect, useCallback } from 'react';
import { Api } from '@/api/ApiClient';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- IMPORTAZIONE DEI COMPONENTI DI GESTIONE (SOTTO-SEZIONI) ---
import TeamManager from '../components/admin/TeamManager';
import MatchManager from '../components/admin/MatchManager';
import SettingsManager from '../components/admin/SettingsManager';
// FIX 1: Importato correttamente il gestore degli annunci/avvisi scorrevoli
import AnnouncementManager from '../components/admin/AnnouncementManager';

// --- COSTANTI DI CONFIGURAZIONE INTERFACCIA ---
// Categorie ufficiali del torneo MiniVolley S3
const CATEGORIES = ['S3 WHITE', 'S3 GREEN', 'S3 RED'];

// Classi CSS Tailwind per i pulsanti delle categorie in stato "Inattivo"
const categoryColors = {
    'S3 WHITE': 'text-white border-white/40 bg-white/10',
    'S3 GREEN': 'text-green-400 border-green-500/40 bg-green-500/10',
    'S3 RED': 'text-red-400 border-red-500/40 bg-red-500/10',
};

// Classi CSS Tailwind per i pulsanti delle categorie in stato "Attivo/Selezionato"
const categoryActiveColors = {
    'S3 WHITE': 'border-white bg-white/20 text-white',
    'S3 GREEN': 'border-green-400 bg-green-500/20 text-green-300',
    'S3 RED': 'border-red-400 bg-red-500/20 text-red-300',
};

export default function Admin() {
    // ==========================================
    // --- STATI REATTIVI (STATE MANAGEMENT) ---
    // ==========================================
    const [teams, setTeams] = useState([]);                 // Lista globale di tutte le squadre
    const [matches, setMatches] = useState([]);             // Lista globale di tutte le partite
    const [settings, setSettings] = useState(null);         // Oggetto contenente le impostazioni generali del torneo
    const [announcements, setAnnouncements] = useState([]); // Lista globale degli avvisi/comunicazioni
    const [activeCategory, setActiveCategory] = useState('S3 WHITE'); // Categoria attualmente visualizzata nell'admin

    // ==========================================
    // --- FUNZIONE CARICAMENTO DATI (API) ---
    // ==========================================
    // useCallback memorizza la funzione per evitare che venga ricreata ad ogni render,
    // ottimizzando le prestazioni ed evitando loop infiniti negli useEffect.
    const loadData = useCallback(async () => {
        // Esegue le 4 chiamate API in parallelo. Ottimo per le performance (riduce il tempo totale di attesa)
        // FIX 2: De-strutturazione del quarto elemento "a" estratto dalla risposta del Promise.all
        const [t, m, s, a] = await Promise.all([
            Api.entities.Team.list(),
            Api.entities.Match.list(),
            Api.entities.TournamentSettings.list(),
            Api.entities.Announcement.list()
        ]);

        setTeams(t); // Aggiorna lo stato delle squadre
        setMatches(m); // Aggiorna lo stato delle partite

        // Se nel DB è presente almeno un record di configurazione, lo salva nello stato (ne gestiamo solo uno globale)
        if (s.length > 0) setSettings(s[0]);

        setAnnouncements(a); // Aggiorna lo stato degli avvisi grazie al fix
    }, []);

    // ==========================================
    // --- TIMING & SOTTOSCRIZIONI (EFFECTS) ---
    // ==========================================

    // Effetto 1: Polling periodico (Fallback). 
    // Ricarica tutti i dati in background ogni 10 secondi per sicurezza.
    useEffect(() => {
        loadData(); // Caricamento iniziale immediato all'apertura della pagina
        const interval = setInterval(loadData, 10000); // Avvia il timer

        return () => clearInterval(interval); // Smantella il timer quando l'utente cambia pagina per evitare memory leak
    }, [loadData]);

    // Effetto 2: Aggiornamenti Real-Time (WebSockets / Server-Sent Events)
    // Rimane in ascolto di modifiche sul database. Se un altro utente/dispositivo aggiorna qualcosa,
    // l'interfaccia si aggiorna istantaneamente senza attendere il polling dei 10 secondi.
    useEffect(() => {
        const unsub1 = Api.entities.Match.subscribe(() => loadData());
        const unsub2 = Api.entities.Team.subscribe(() => loadData());
        const unsub3 = Api.entities.TournamentSettings.subscribe(() => loadData());
        // FIX 3: Sottoscrizione in tempo reale anche per la tabella degli avvisi
        const unsub4 = Api.entities.Announcement.subscribe(() => loadData());

        // Funzione di pulizia (Cleanup): cancella tutte le sottoscrizioni quando il componente viene rimosso dallo schermo
        return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
    }, [loadData]);

    // ==========================================
    // --- RENDERING INTERFACCIA UTENTE ---
    // ==========================================
    return (
        <div className="min-h-screen bg-background py-6 px-6 lg:px-12">
            <div className="w-full">

                {/* --- BANNER INFORMATIVO (ORGANIZZATORE TORNEO) --- */}
                {/* Mostra i dati dinamici presi da TournamentSettings, con dei testi di fallback in caso di DB vuoto */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 p-4 bg-card rounded-xl border border-border/50">
                    <div className="flex-1 text-center sm:text-left">
                        <p className="font-heading text-2xl tracking-widest text-accent uppercase font-bold">
                            {settings?.tournament_name || "TORNEO VOLLEY S3 CUP"}
                        </p>
                        <p className="font-heading text-lg tracking-wider text-primary mt-0.5 uppercase">
                            {settings?.sub_title || "TROFEO — XXV EDIZIONE"}
                        </p>
                        <p className="text-sm text-muted-foreground font-body mt-0.5">
                            {settings?.details_line1 || "G.S.· Martedì 2 Giugno 2026"}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                            {settings?.details_line2 || "Campo Sportivo"}
                        </p>
                    </div>
                    {/* Pulsante di navigazione rapida per passare dall'Admin alla visualizzazione pubblica del Tabellone */}
                    <Link to="/">
                        <Button variant="outline" className="gap-2">
                            <Monitor className="w-4 h-4" /> Vedi Tabellone
                        </Button>
                    </Link>
                </div>

                {/* --- INTESTAZIONE PAGINA --- */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-heading text-4xl tracking-wider text-primary font-bold">GESTIONE TORNEO</h1>
                        <p className="text-muted-foreground font-body mt-1">Aggiungi squadre, partite e aggiorna i risultati</p>
                    </div>
                </div>

                {/* --- SELETTORE TABS CATEGORIE (WHITE, GREEN, RED) --- */}
                {/* Cicla l'array delle categorie e genera i relativi filtri grafici */}
                <div className="flex gap-3 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)} // Al click cambia lo stato e filtra i dati sotto
                            className={`px-5 py-2 rounded-lg border font-heading text-lg tracking-wider transition-all font-semibold ${activeCategory === cat
                                    ? categoryActiveColors[cat] // Stile se la categoria è attiva
                                    : categoryColors[cat] + ' hover:opacity-80' // Stile se la categoria è inattiva
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* --- GRIGLIA PRINCIPALE DEI COMPONENTI DI GESTIONE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* COLONNA SINISTRA (Larghezza: 1/4 su schermi grandi) - Pannelli di Controllo Secondari */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Gestione Nome Torneo, Titoli e Numero partite per pagina */}
                        <SettingsManager settings={settings} onRefresh={loadData} />

                        {/* Gestione degli avvisi scorrevoli del tabellone */}
                        <AnnouncementManager announcements={announcements} onRefresh={loadData} />

                        {/* Gestione dell'elenco squadre (Filtrato internamente o passato per categoria) */}
                        <TeamManager teams={teams} onRefresh={loadData} activeCategory={activeCategory} />
                    </div>

                    {/* COLONNA DESTRA (Larghezza: 3/4 su schermi grandi) - Tabellone di Controllo Partite */}
                    <div className="lg:col-span-3">
                        {/* Gestione dei Match, inserimento punteggi, assegnazione campi e orari */}
                        <MatchManager matches={matches} teams={teams} onRefresh={loadData} activeCategory={activeCategory} />
                    </div>

                </div>

            </div>
        </div>
    );
}