import React from 'react';
import { motion } from 'framer-motion';

// Funzione GENERICA: accorcia dinamicamente OGNI parola più lunga di 7 lettere
function shortenTeamNameDynamic(name) {
    if (!name) return '';

    // Dividiamo il nome in singole parole
    const words = name.split(' ');

    const processedWords = words.map(word => {
        // Se la parola è più lunga di 7 lettere, la abbreviamo alla settima lettera
        if (word.length > 7) {
            return word.substring(0, 7) + '.';
        }
        return word; // Le parole fino a 7 lettere restano totalmente intatte
    });

    // Ricomponiamo il nome con le parole processate
    return processedWords.join(' ');
}

function computeStandings(teams, matches) {
    const stats = {};
    teams.forEach(t => {
        const id = t.team_id || t.id;
        stats[id] = { name: t.name, played: 0, won: 0, lost: 0, points_won: 0, points_lost: 0, pts: 0 };
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
        const aDiff = a.points_won - a.points_lost;
        const bDiff = b.points_won - b.points_lost;
        if (bDiff !== aDiff) return bDiff - aDiff;
        return b.points_won - a.points_won;
    });
}

export default function GroupStandings({ groupName, teams, matches }) {
    const standings = computeStandings(teams, matches);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/95 backdrop-blur-md rounded-xl border border-border/80 shadow-2xl flex flex-col w-full overflow-hidden"
        >
            {/* Header del Girone */}
            <div className="bg-gradient-to-r from-amber-500/15 to-transparent px-5 py-4 border-b border-border/60">
                <h3 className="font-heading text-3xl tracking-widest text-amber-500 font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    GIRONE {groupName}
                </h3>
            </div>

            {/* Tabella flessibile */}
            <div className="w-full">
                <table className="w-full border-collapse table-auto">
                    <thead>
                        <tr className="text-base font-body font-black text-muted-foreground border-b border-border/60 bg-muted/50 uppercase tracking-wider">
                            <th className="text-center px-0.5 py-3.5 w-[35px]">#</th>
                            <th className="text-left px-3 py-3.5">SQUADRA</th>
                            <th className="text-center px-0.5 py-3.5 w-11">G</th>
                            <th className="text-center px-0.5 py-3.5 w-11">V</th>
                            <th className="text-center px-0.5 py-3.5 w-11">P</th>
                            <th className="text-center px-0.5 py-3.5 w-[90px]">PUNTI</th>
                            <th className="text-center px-1 py-3.5 w-16 font-black text-amber-500">PT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => (
                            <tr
                                key={s.name}
                                className={`border-b border-border/30 transition-colors ${i % 2 !== 0 ? 'bg-muted/20' : 'bg-card/60'
                                    } hover:bg-amber-500/10`}
                            >
                                {/* Posizione # */}
                                <td className="text-center px-0.5 py-4 w-[35px]">
                                    <span className="font-heading text-3xl text-foreground/60 font-mono font-black">
                                        {i + 1}
                                    </span>
                                </td>

                                {/* Cella Squadra con wrap e taglio dinamico a 7 caratteri */}
                                <td className="px-3 py-4 font-body font-black text-xl text-foreground tracking-wide" title={s.name}>
                                    <div className="flex flex-wrap gap-x-1 whitespace-normal break-words leading-tight max-w-[190px]">
                                        {shortenTeamNameDynamic(s.name)}
                                    </div>
                                </td>

                                {/* Statistiche G V P */}
                                <td className="text-center px-0.5 py-4 font-body font-extrabold text-foreground text-lg">
                                    {s.played}
                                </td>
                                <td className="text-center px-0.5 py-4 font-body font-black text-green-400 text-lg">
                                    {s.won}
                                </td>
                                <td className="text-center px-0.5 py-4 font-body font-black text-red-400 text-lg">
                                    {s.lost}
                                </td>

                                {/* PUNTI fatti/subiti */}
                                <td className="text-center px-0.5 py-4 w-[90px] font-body text-base font-black text-foreground/90 font-mono whitespace-nowrap bg-muted/10 tabular-nums">
                                    {s.points_won}-{s.points_lost}
                                </td>

                                {/* PT Classifica Totale */}
                                <td className="text-center px-1 py-4 w-16 font-heading text-4xl font-black text-amber-500 tabular-nums drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] bg-amber-500/5">
                                    {s.pts}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}