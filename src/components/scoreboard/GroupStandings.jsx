import React from 'react';
import { motion } from 'framer-motion';

function computeStandings(teams, matches) {
    const stats = {};
    teams.forEach(t => {
        stats[t.id] = { name: t.name, played: 0, won: 0, lost: 0, points_won: 0, points_lost: 0, pts: 0 };
    });

    matches.filter(m => m.status === 'terminata').forEach(m => {
        const a = stats[m.team_a_id];
        const b = stats[m.team_b_id];
        if (!a || !b) return;

        a.played++;
        b.played++;

        const sa = (m.score_a || 0);
        const sb = (m.score_b || 0);
        a.points_won += sa;
        a.points_lost += sb;
        b.points_won += sb;
        b.points_lost += sa;

        if (sa > sb) {
            a.won++;
            b.lost++;
            a.pts += 3;
        } else if (sb > sa) {
            b.won++;
            a.lost++;
            b.pts += 3;
        } else {
            a.pts += 1;
            b.pts += 1;
        }
    });

    return Object.values(stats).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const aPtsRatio = a.points_lost ? a.points_won / a.points_lost : a.points_won;
        const bPtsRatio = b.points_lost ? b.points_won / b.points_lost : b.points_won;
        return bPtsRatio - aPtsRatio;
    });
}

export default function GroupStandings({ groupName, teams, matches }) {
    const standings = computeStandings(teams, matches);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 backdrop-blur rounded-xl border border-border/50 overflow-hidden"
        >
            <div className="bg-gradient-to-r from-primary/20 to-transparent px-6 py-3 border-b border-border/30">
                <h3 className="font-heading text-2xl tracking-wider text-primary">
                    GIRONE {groupName}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs font-body font-semibold text-muted-foreground border-b border-border/30">
                            <th className="text-left px-4 py-3 w-8">#</th>
                            <th className="text-left px-4 py-3">SQUADRA</th>
                            <th className="text-center px-3 py-3">G</th>
                            <th className="text-center px-3 py-3">V</th>
                            <th className="text-center px-3 py-3">P</th>
                            <th className="text-center px-3 py-3">PUNTI</th>
                            <th className="text-center px-4 py-3 font-bold text-primary">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => (
                            <tr
                                key={s.name}
                                className={`border-b border-border/20 transition-colors ${i < 2 ? 'bg-primary/5' : ''}`}
                            >
                                <td className="px-4 py-3">
                                    <span className={`font-heading text-xl ${i < 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {i + 1}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-body font-bold text-base">{s.name}</td>
                                <td className="text-center px-3 py-3 font-body text-muted-foreground">{s.played}</td>
                                <td className="text-center px-3 py-3 font-body text-green-400">{s.won}</td>
                                <td className="text-center px-3 py-3 font-body text-red-400">{s.lost}</td>
                                <td className="text-center px-3 py-3 font-body text-muted-foreground">{s.points_won}-{s.points_lost}</td>
                                <td className="text-center px-4 py-3 font-heading text-2xl text-primary">{s.pts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}