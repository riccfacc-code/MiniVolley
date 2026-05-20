import React from 'react';
import { motion } from 'framer-motion';

const statusLabels = {
    da_giocare: 'DA GIOCARE',
    in_corso: 'IN CORSO',
    terminata: 'TERMINATA'
};

const statusStyles = {
    da_giocare: 'bg-muted text-muted-foreground',
    in_corso: 'bg-primary/20 text-primary animate-pulse',
    terminata: 'bg-green-500/20 text-green-400'
};

export default function MatchCard({ match, index }) {
    const isFinished = match.status === 'terminata';
    const isLive = match.status === 'in_corso';
    const aWins = isFinished && (match.score_a || 0) > (match.score_b || 0);
    const bWins = isFinished && (match.score_b || 0) > (match.score_a || 0);

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-card/80 backdrop-blur rounded-xl border border-border/50 overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                    {match.field && (
                        <span className="text-xs font-body font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            Campo {match.field}
                        </span>
                    )}
                </div>
                <span className={`text-xs font-body font-bold px-3 py-1 rounded-full ${statusStyles[match.status] || statusStyles.da_giocare}`}>
                    {isLive && <span className="inline-block w-2 h-2 bg-primary rounded-full mr-1.5 animate-pulse" />}
                    {statusLabels[match.status] || 'DA GIOCARE'}
                </span>
            </div>

            <div className="p-4 space-y-2">
                {/* Team A */}
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${aWins ? 'bg-green-500/10' : ''}`}>
                    <span className={`font-body font-bold text-lg ${aWins ? 'text-green-400' : 'text-foreground'}`}>
                        {match.team_a_name}
                    </span>
                    <span className={`font-heading text-3xl w-10 text-center ${aWins ? 'text-green-400' : 'text-foreground'}`}>
                        {match.score_a ?? '-'}
                    </span>
                </div>

                {/* Team B */}
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${bWins ? 'bg-green-500/10' : ''}`}>
                    <span className={`font-body font-bold text-lg ${bWins ? 'text-green-400' : 'text-foreground'}`}>
                        {match.team_b_name}
                    </span>
                    <span className={`font-heading text-3xl w-10 text-center ${bWins ? 'text-green-400' : 'text-foreground'}`}>
                        {match.score_b ?? '-'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}