import React from 'react';
import { motion } from 'framer-motion';
import MatchCard from './MatchCard';

const phaseLabels = {
    ottavi: 'OTTAVI DI FINALE',
    quarti: 'QUARTI DI FINALE',
    semifinali: 'SEMIFINALI',
    finale: 'FINALE',
    finale_3: 'FINALE 3°/4° POSTO'
};

const phaseIcons = {
    ottavi: '⚡',
    quarti: '🔥',
    semifinali: '⭐',
    finale: '🏆',
    finale_3: '🥉'
};

export default function BracketView({ phase, matches }) {
    if (!matches || matches.length === 0) return null;

    const sorted = [...matches].sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{phaseIcons[phase]}</span>
                <h2 className="font-heading text-4xl tracking-wider text-accent">
                    {phaseLabels[phase] || phase.toUpperCase()}
                </h2>
            </div>
            <div className={`grid gap-4 ${phase === 'finale' || phase === 'finale_3' ? 'grid-cols-1 max-w-xl' :
                    sorted.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                        'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
                }`}>
                {sorted.map((match, i) => (
                    <MatchCard key={match.id} match={match} index={i} />
                ))}
            </div>
        </motion.div>
    );
}