import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import ScoreboardHeader from '../components/scoreboard/ScoreboardHeader';
import GroupStandings from '../components/scoreboard/GroupStandings';
import BracketView from '../components/scoreboard/BracketView';
import MatchCard from '../components/scoreboard/MatchCard';
import SectionIndicator from '../components/scoreboard/SectionIndicator';

const CATEGORIES = ['S3 WHITE', 'S3 GREEN', 'S3 RED'];

const categoryBadgeStyles = {
    'S3 WHITE': 'bg-white/10 text-white border border-white/30',
    'S3 GREEN': 'bg-green-500/20 text-green-300 border border-green-500/40',
    'S3 RED': 'bg-red-500/20 text-red-300 border border-red-500/40',
};

function buildSectionsForCategory(category, teams, matches) {
    const result = [];
    const catTeams = teams.filter(t => t.category === category);
    const catMatches = matches.filter(m => m.category === category);

    // Group standings
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

    // Live matches
    const liveMatches = catMatches.filter(m => m.status === 'in_corso');
    if (liveMatches.length > 0) {
        result.push({ type: 'live', title: 'PARTITE IN CORSO', matches: liveMatches, category });
    }

    // Recent results
    const recentMatches = catMatches
        .filter(m => m.status === 'terminata')
        .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
        .slice(0, 8);
    if (recentMatches.length > 0) {
        result.push({ type: 'recent', title: 'ULTIMI RISULTATI', matches: recentMatches, category });
    }

    // Group standings — 2 groups per section
    const sortedGroups = Object.keys(groups).sort();
    for (let i = 0; i < sortedGroups.length; i += 2) {
        const groupSlice = sortedGroups.slice(i, i + 2);
        result.push({
            type: 'groups',
            title: `CLASSIFICHE GIRONI ${groupSlice.join(' - ')}`,
            groups: groupSlice.map(g => ({ name: g, ...groups[g] })),
            category
        });
    }

    // Bracket phases
    const bracketPhases = ['ottavi', 'quarti', 'semifinali', 'finale_3', 'finale'];
    bracketPhases.forEach(phase => {
        const phaseMatches = catMatches.filter(m => m.phase === phase);
        if (phaseMatches.length > 0) {
            result.push({ type: 'bracket', phase, title: phase.toUpperCase(), matches: phaseMatches, category });
        }
    });

    // Upcoming matches
    const upcoming = catMatches
        .filter(m => m.status === 'da_giocare')
        .sort((a, b) => (a.match_order || 0) - (b.match_order || 0))
        .slice(0, 8);
    if (upcoming.length > 0) {
        result.push({ type: 'upcoming', title: 'PROSSIME PARTITE', matches: upcoming, category });
    }

    return result;
}

export default function Scoreboard() {
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [settings, setSettings] = useState(null);
    const [activeSection, setActiveSection] = useState(0);

    const loadData = useCallback(async () => {
        const [t, m, s] = await Promise.all([
            base44.entities.Team.list(),
            base44.entities.Match.list(),
            base44.entities.TournamentSettings.list()
        ]);
        setTeams(t);
        setMatches(m);
        if (s.length > 0) setSettings(s[0]);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [loadData]);

    useEffect(() => {
        const unsub1 = base44.entities.Match.subscribe(() => loadData());
        const unsub2 = base44.entities.Team.subscribe(() => loadData());
        return () => { unsub1(); unsub2(); };
    }, [loadData]);

    const sections = useMemo(() => {
        // Interleave categories: all sections of WHITE, then GREEN, then RED
        const all = [];
        CATEGORIES.forEach(cat => {
            const catSections = buildSectionsForCategory(cat, teams, matches);
            all.push(...catSections);
        });
        return all;
    }, [teams, matches]);

    const scrollSpeed = (settings?.scroll_speed || 8) * 1000;
    useEffect(() => {
        if (sections.length <= 1) return;
        const timer = setInterval(() => {
            setActiveSection(prev => (prev + 1) % sections.length);
        }, scrollSpeed);
        return () => clearInterval(timer);
    }, [sections.length, scrollSpeed]);

    // Reset section if sections change
    useEffect(() => {
        setActiveSection(0);
    }, [sections.length]);

    const currentSection = sections[activeSection];

    if (sections.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <ScoreboardHeader tournamentName={settings?.tournament_name} />
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

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            <ScoreboardHeader tournamentName={settings?.tournament_name} />

            <div className="pt-28 pb-20 px-6 lg:px-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                        {/* Category badge */}
                        {currentSection?.category && (
                            <div className="mb-4">
                                <span className={`inline-block px-4 py-1 rounded-full font-heading text-lg tracking-widest ${categoryBadgeStyles[currentSection.category]}`}>
                                    {currentSection.category}
                                </span>
                            </div>
                        )}

                        {currentSection?.type === 'recent' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">📊</span>
                                    <h2 className="font-heading text-4xl tracking-wider text-accent">ULTIMI RISULTATI</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {currentSection.matches.map((m, i) => (
                                        <MatchCard key={m.id} match={m} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentSection?.type === 'live' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">🔴</span>
                                    <h2 className="font-heading text-4xl tracking-wider text-red-400 animate-pulse">PARTITE IN CORSO</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {currentSection.matches.map((m, i) => (
                                        <MatchCard key={m.id} match={m} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentSection?.type === 'groups' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">📋</span>
                                    <h2 className="font-heading text-4xl tracking-wider text-accent">{currentSection.title}</h2>
                                </div>
                                <div className={`grid gap-6 ${currentSection.groups.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>
                                    {currentSection.groups.map(g => (
                                        <GroupStandings
                                            key={g.name}
                                            groupName={g.name}
                                            teams={g.teams}
                                            matches={g.matches}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentSection?.type === 'bracket' && (
                            <BracketView phase={currentSection.phase} matches={currentSection.matches} />
                        )}

                        {currentSection?.type === 'upcoming' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">⏳</span>
                                    <h2 className="font-heading text-4xl tracking-wider text-accent">PROSSIME PARTITE</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {currentSection.matches.map((m, i) => (
                                        <MatchCard key={m.id} match={m} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <SectionIndicator sections={sections} activeIndex={activeSection} />
        </div>
    );
}