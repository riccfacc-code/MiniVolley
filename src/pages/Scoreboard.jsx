import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Api } from '@/api/ApiClient';
import { AnimatePresence, motion } from 'framer-motion';

// --- IMPORTAZIONE COMPONENTI GRAFICI DEL TABELLONE ---
import ScoreboardHeader from '../components/scoreboard/ScoreboardHeader';
import GroupStandings from '../components/scoreboard/GroupStandings';
import BracketView from '../components/scoreboard/BracketView';
import MatchCard from '../components/scoreboard/MatchCard';
import SectionIndicator from '../components/scoreboard/SectionIndicator';
import AnnouncementBanner from '../components/scoreboard/AnnouncementBanner';

// Categorie del torneo S3
const CATEGORIES = ['S3 WHITE', 'S3 GREEN', 'S3 RED'];

// Stili grafici dinamici per i badge delle categorie
const categoryBadgeStyles = {
    'S3 WHITE': 'bg-white/10 text-white border border-white/30',
    'S3 GREEN': 'bg-green-500/20 text-green-300 border border-green-500/40',
    'S3 RED': 'bg-red-500/20 text-red-300 border border-red-500/40',
};

/**
 * FUNZIONE DI UTENZA (HELPER): Genera l'elenco delle "schermate" (sezioni) da mostrare
 * a rotazione per una specifica categoria, suddividendo i dati in base al limite di pagina.
 */
function buildSectionsForCategory(category, teams, matches, matchesPerPage = 8) {
    const result = [];

    // Filtra squadre e partite appartenenti solo alla categoria corrente
    const catTeams = teams.filter(t => t.category === category);
    const catMatches = matches.filter(m => m.category === category);

    // Raggruppa le squadre e i match per girone (fase iniziale)
    const groups = {};
    catTeams.forEach(t => {
        if (t.group_name) {
            if (!groups[t.group_name]) groups[t.group_name] = { teams: [], matches: [] };
            groups[t.group_name].teams.push(t);
        }
    });
    catMatches.filter(m => m.phase === 'gironi').forEach(m => {
        if (m.group_name && groups[m.group_name]) {
            groups[m.group_name].matches.push(m);
        }
    });

    // 1. SOTTO-SEZIONE: Partite in Corso (LIVE)
    const liveMatches = catMatches.filter(m => m.status === 'in_corso');
    if (liveMatches.length > 0) {
        result.push({ type: 'live', title: 'PARTITE IN CORSO', icon: '🔴', matches: liveMatches, category });
    }

    // 2. SOTTO-SEZIONE: Ultimi Risultati (Terminate)
    // MODIFICATO: Sfrutta 'matchesPerPage' per mostrare solo il numero di record stabilito dall'admin
    const recentMatches = catMatches
        .filter(m => m.status === 'terminata')
        .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)) // Ordine decrescente di aggiornamento
        .slice(0, matchesPerPage);
    if (recentMatches.length > 0) {
        result.push({ type: 'recent', title: 'ULTIMI RISULTATI', icon: '📊', matches: recentMatches, category });
    }

    // 3. SOTTO-SEZIONE: Classifiche Gironi
    // Raggruppa i gironi a blocchi di 4 per pagina per evitare scritte troppo piccole sul tabellone
    const sortedGroups = Object.keys(groups).sort();
    for (let i = 0; i < sortedGroups.length; i += 4) {
        const groupSlice = sortedGroups.slice(i, i + 4);
        result.push({
            type: 'groups',
            title: `CLASSIFICHE GIRONI ${groupSlice.join(' - ')}`,
            icon: '📋',
            groups: groupSlice.map(g => ({ name: g, ...groups[g] })),
            category
        });
    }

    // 4. SOTTO-SEZIONE: Fasi a Eliminazione Diretta (Tabellone / Brackets)
    const bracketPhases = ['ottavi', 'quarti', 'semifinali', 'finale_3', 'finale'];
    bracketPhases.forEach(phase => {
        const phaseMatches = catMatches.filter(m => m.phase === phase);
        if (phaseMatches.length > 0) {
            result.push({ type: 'bracket', phase, title: phase.toUpperCase(), icon: '🏆', matches: phaseMatches, category });
        }
    });

    // 5. SOTTO-SEZIONE: Prossime Partite (Da Giocare)
    // MODIFICATO: Tronca la lista in base al valore 'matchesPerPage' configurato nel DB
    const upcoming = catMatches
        .filter(m => m.status === 'da_giocare')
        .sort((a, b) => (a.match_order || 0) - (b.match_order || 0)) // Segue l'ordine cronologico del torneo
        .slice(0, matchesPerPage);
    if (upcoming.length > 0) {
        result.push({ type: 'upcoming', title: 'PROSSIME PARTITE', icon: '⏳', matches: upcoming, category });
    }

    return result;
}

export default function Scoreboard() {
    // ==========================================
    // --- STATI REATTIVI CONTROLLO COMPONENTE ---
    // ==========================================
    const [teams, setTeams] = useState([]);                 // Elenco squadre
    const [matches, setMatches] = useState([]);             // Elenco partite
    const [settings, setSettings] = useState(null);         // Impostazioni (velocità, limiti pagina)
    const [announcements, setAnnouncements] = useState([]); // Elenco avvisi in basso
    const [activeSection, setActiveSection] = useState(0);   // Indice della schermata attualmente visibile

    // ==========================================
    // --- CARICAMENTO DATI REAL-TIME & POLLING ---
    // ==========================================
    const loadData = useCallback(async () => {
        const [t, m, s, a] = await Promise.all([
            Api.entities.Team.list(),
            Api.entities.Match.list(),
            Api.entities.TournamentSettings.list(),
            Api.entities.Announcement.list()
        ]);

        setTeams(t);
        setMatches(m);
        if (s.length > 0) setSettings(s[0]);
        setAnnouncements(a || []);
    }, []);

    // Polling di sicurezza ogni 10 secondi
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Listener Real-Time per aggiornamenti istantanei del tabellone
    useEffect(() => {
        const unsub1 = Api.entities.Match.subscribe(() => loadData());
        const unsub2 = Api.entities.Team.subscribe(() => loadData());
        const unsub3 = Api.entities.TournamentSettings.subscribe(() => loadData());
        const unsub4 = Api.entities.Announcement.subscribe(() => loadData());
        return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
    }, [loadData]);

    // ==========================================
    // --- MEMOIZZAZIONE DELLE SCHERMATE (SEZIONI) ---
    // ==========================================
    // useMemo ricalcola l'intero set di schermate da ciclare SOLO quando cambiano i dati nel DB.
    const sections = useMemo(() => {
        const all = [];
        // Estrae il limite delle partite per pagina dal DB (fallback automatico a 8 se non definito)
        const limit = settings?.matches_per_page || 8;

        // Cicla le 3 categorie e unisce tutte le sezioni generate in un unico grande array globale
        CATEGORIES.forEach(cat => {
            // MODIFICATO: Passa il valore dinamico estratto dalle impostazioni
            const catSections = buildSectionsForCategory(cat, teams, matches, limit);
            all.push(...catSections);
        });
        return all;
    }, [teams, matches, settings]); // MODIFICATO: Aggiunto settings per catturare cambi di layout in tempo reale

    // ==========================================
    // --- LOGICA TIMER CAROSELLO (AUTO-SCROLL) ---
    // ==========================================
    // Calcola il tempo di permanenza di ogni schermata (es. se scroll_speed è 8 secondi -> 8000ms)
    const scrollSpeed = (settings?.scroll_speed || 8) * 1000;

    useEffect(() => {
        if (sections.length <= 1) return; // Non avviare il timer se c'è solo una pagina o nessuna

        const timer = setInterval(() => {
            // Incrementa l'indice della pagina. Arrivato alla fine, ricomincia da 0 grazie all'operatore modulo (%)
            setActiveSection(prev => (prev + 1) % sections.length);
        }, scrollSpeed);

        return () => clearInterval(timer); // Reset del timer in caso di ricalcolo o smantellamento
    }, [sections.length, scrollSpeed]);

    // Forza il reset all'indice 0 se il numero totale di pagine cambia (es. inserimento di un match live)
    useEffect(() => {
        setActiveSection(0);
    }, [sections.length]);

    // Identifica la struttura dati della schermata correntemente visibile
    const currentSection = sections[activeSection];

    // --- RENDERING SCHERMATA DI ATTESA (Dati mancanti o Torneo non iniziato) ---
    if (sections.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <ScoreboardHeader settings={settings} />
                <div className="text-center mt-24">
                    <span className="text-6xl mb-6 block">🏐</span>
                    <h2 className="font-heading text-4xl text-muted-foreground tracking-wider">
                        IN ATTESA DEI RISULTATI...
                    </h2>
                    <p className="text-muted-foreground font-body mt-2">
                        I risultati appariranno qui automaticamente
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // --- CORPO PRINCIPALE INTERFACCIA TABELLONE ---
    // ==========================================
    return (
        <div className="h-screen bg-background overflow-hidden flex flex-col justify-start select-none relative">
            {/* Intestazione fissa del torneo */}
            <ScoreboardHeader settings={settings} />

            {/* Area Centrale Dinamica con scorrimento controllato da Framer Motion */}
            <div className="flex-1 w-full pt-24 pb-24 px-6 lg:px-12 overflow-hidden">
                {/* AnimatePresence gestisce le animazioni di entrata e di uscita fluide */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection} // Cambiando la chiave, Framer Motion sa che deve smontare il vecchio componente e animare il nuovo
                        initial={{ opacity: 0, y: 30 }}   // Stato di partenza (invisibile e leggermente più in basso)
                        animate={{ opacity: 1, y: 0 }}    // Stato visibile a schermo
                        exit={{ opacity: 0, y: -30 }}     // Stato di uscita (scivola verso l'alto scomparendo)
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                        {/* INTESTAZIONE INTERNA DELLA SCHERMATA ATTIVA (Categoria + Titolo Sezione) */}
                        {currentSection && (
                            <div className="flex flex-wrap items-center gap-4 mb-6 bg-card/40 backdrop-blur-sm p-3 rounded-xl border border-border/40">
                                {currentSection.category && (
                                    <span className={`px-4 py-1.5 rounded-lg font-heading text-lg font-bold tracking-widest shrink-0 ${categoryBadgeStyles[currentSection.category]}`}>
                                        {currentSection.category}
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{currentSection.icon}</span>
                                    {/* Effetto pulsante personalizzato (animate-pulse) se la pagina mostra i match in corso */}
                                    <h2 className={`font-heading text-3xl font-black tracking-wider ${currentSection.type === 'live' ? 'text-red-400 animate-pulse' : 'text-accent'}`}>
                                        {currentSection.title}
                                    </h2>
                                </div>
                            </div>
                        )}

                        {/* RENDER CONDIZIONALE: In base al tipo di sezione, monta il componente corretto */}

                        {/* Layout Ultimi Risultati */}
                        {currentSection?.type === 'recent' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {currentSection.matches.map((m, i) => (
                                    <MatchCard key={m.id} match={m} index={i} />
                                ))}
                            </div>
                        )}

                        {/* Layout Match in Corso */}
                        {currentSection?.type === 'live' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {currentSection.matches.map((m, i) => (
                                    <MatchCard key={m.id} match={m} index={i} />
                                ))}
                            </div>
                        )}

                        {/* Layout Classifiche Gironi */}
                        {currentSection?.type === 'groups' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {currentSection.groups.map(g => (
                                    <GroupStandings
                                        key={g.name}
                                        groupName={g.name}
                                        teams={g.teams}
                                        matches={g.matches}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Layout Tabellone a Eliminazione Diretta */}
                        {currentSection?.type === 'bracket' && (
                            <BracketView phase={currentSection.phase} matches={currentSection.matches} />
                        )}

                        {/* Layout Prossime Partite */}
                        {currentSection?.type === 'upcoming' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {currentSection.matches.map((m, i) => (
                                    <MatchCard key={m.id} match={m} index={i} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* --- PIÈ DI PAGINA (FOOTER FISSO IN ASSOLUTO) --- */}
            <div className="absolute bottom-0 left-0 right-0 w-full px-6 lg:px-12 pb-4 pt-4 flex flex-row items-center justify-between gap-6 bg-gradient-to-t from-background via-background/95 to-transparent z-50 border-t border-border/10">

                {/* Sinistra: Indicatori dei pallini (pagine totali e pagina corrente attiva) */}
                <div className="w-1/3 flex justify-start items-center">
                    <SectionIndicator
                        sections={sections}
                        activeIndex={activeSection}
                        onSelect={setActiveSection} // Permette all'occorrenza di cliccare sul pallino per forzare il cambio pagina
                    />
                </div>

                {/* Destra: Banner scorrevole degli avvisi pubblicitari o comunicazioni dello staff */}
                <div className="w-2/3 flex justify-end items-center min-w-0">
                    {announcements && announcements.length > 0 && (
                        <AnnouncementBanner announcements={announcements} />
                    )}
                </div>
            </div>
        </div>
    );
}