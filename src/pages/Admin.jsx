import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamManager from '../components/admin/TeamManager';
import MatchManager from '../components/admin/MatchManager';
import SettingsManager from '../components/admin/SettingsManager';

const CATEGORIES = ['S3 WHITE', 'S3 GREEN', 'S3 RED'];

const categoryColors = {
    'S3 WHITE': 'text-white border-white/40 bg-white/10',
    'S3 GREEN': 'text-green-400 border-green-500/40 bg-green-500/10',
    'S3 RED': 'text-red-400 border-red-500/40 bg-red-500/10',
};

const categoryActiveColors = {
    'S3 WHITE': 'border-white bg-white/20 text-white',
    'S3 GREEN': 'border-green-400 bg-green-500/20 text-green-300',
    'S3 RED': 'border-red-400 bg-red-500/20 text-red-300',
};

export default function Admin() {
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [settings, setSettings] = useState(null);
    const [activeCategory, setActiveCategory] = useState('S3 WHITE');

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
    }, [loadData]);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Organizer banner */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 p-4 bg-card rounded-xl border border-border/50">
                    <div className="flex-1 text-center sm:text-left">
                        <p className="font-heading text-2xl tracking-widest text-accent">TORNEO VOLLEY S3 CUP 2026</p>
                        <p className="font-heading text-lg tracking-wider text-primary">TROFEO G. SGANZETTA — XXV EDIZIONE</p>
                        <p className="text-sm text-muted-foreground font-body mt-0.5">G.S. Pavic dal 1972 · Romagnano Sesia · Martedì 2 Giugno 2026</p>
                        <p className="text-xs text-muted-foreground font-body">Campo Sportivo di Via Gramsci · 📞 3462203515 (Giuseppe)</p>
                    </div>
                    <Link to="/">
                        <Button variant="outline" className="gap-2">
                            <Monitor className="w-4 h-4" /> Vedi Tabellone
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-heading text-4xl tracking-wider text-primary">GESTIONE TORNEO</h1>
                        <p className="text-muted-foreground font-body mt-1">Aggiungi squadre, partite e aggiorna i risultati</p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-3 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-lg border font-heading text-lg tracking-wider transition-all ${activeCategory === cat
                                    ? categoryActiveColors[cat]
                                    : categoryColors[cat] + ' hover:opacity-80'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <SettingsManager settings={settings} onRefresh={loadData} />
                        <TeamManager teams={teams} onRefresh={loadData} activeCategory={activeCategory} />
                    </div>
                    <div className="lg:col-span-2">
                        <MatchManager matches={matches} teams={teams} onRefresh={loadData} activeCategory={activeCategory} />
                    </div>
                </div>
            </div>
        </div>
    );
}