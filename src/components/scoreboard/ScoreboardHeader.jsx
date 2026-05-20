import React, { useState, useEffect } from 'react';
import moment from 'moment';

export default function ScoreboardHeader({ tournamentName }) {
    const [time, setTime] = useState(moment());

    useEffect(() => {
        const timer = setInterval(() => setTime(moment()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-card via-background to-card border-b border-border/50">
            <div className="flex items-center justify-between px-8 py-3">
                {/* Left: tournament name */}
                <div className="flex items-center gap-4">
                    <span className="text-3xl">🏐</span>
                    <div>
                        <h1 className="font-heading text-4xl tracking-wider text-primary">
                            {tournamentName || 'TORNEO MINIVOLLEY'}
                        </h1>
                    </div>
                </div>

                {/* Center: organizer info */}
                <div className="hidden md:flex flex-col items-center text-center">
                    <p className="font-heading text-xl tracking-widest text-accent">G.S. PAVIC DAL 1972</p>
                    <p className="text-xs text-muted-foreground font-body">Romagnano Sesia · Martedì 2 Giugno 2026</p>
                    <p className="text-xs text-muted-foreground font-body">Campo Sportivo di Via Gramsci</p>
                </div>

                {/* Right: clock */}
                <div className="text-right">
                    <p className="font-heading text-3xl tracking-wider text-foreground">
                        {time.format('HH:mm:ss')}
                    </p>
                    <p className="text-sm text-muted-foreground font-body">
                        {time.format('dddd DD MMMM YYYY')}
                    </p>
                </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        </div>
    );
}