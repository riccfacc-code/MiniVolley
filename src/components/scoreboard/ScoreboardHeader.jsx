import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/it'; // Assicura che la data sia in italiano

export default function ScoreboardHeader({ settings }) {
    const [time, setTime] = useState(moment());

    useEffect(() => {
        moment.locale('it');
        const timer = setInterval(() => setTime(moment()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-card via-background to-card border-b border-border/50 shadow-md">
            <div className="flex items-center justify-between px-8 py-3">

                {/* Sinistra: Nome Torneo e Sottotitolo dinamici */}
                <div className="flex items-center gap-4 flex-1">
                    <span className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🏐</span>
                    <div>
                        <h1 className="font-heading text-3xl tracking-wider text-accent uppercase font-bold">
                            {settings?.tournament_name || "TORNEO VOLLEY S3 CUP"}
                        </h1>
                        <p className="font-heading text-lg tracking-wider text-primary mt-0.5 uppercase">
                            {settings?.sub_title || "TROFEO — XXV EDIZIONE"}
                        </p>
                    </div>
                </div>

                {/* Centro: Dettagli logistici, data e luogo dinamici */}
                <div className="hidden lg:flex flex-col items-center text-center px-4 flex-1">
                    <p className="text-sm font-medium text-foreground tracking-wide font-body">
                        {settings?.details_line1 || "G.S. · Martedì 2 Giugno 2026"}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                        {settings?.details_line2 || "Campo Sportivo"}
                    </p>
                </div>

                {/* Destra: Orologio e Data corrente */}
                <div className="text-right flex-1 flex flex-col items-end justify-center">
                    <p className="font-heading text-3xl tracking-wider text-foreground font-mono font-bold tabular-nums">
                        {time.format('HH:mm:ss')}
                    </p>
                    <p className="text-xs text-muted-foreground font-body capitalize mt-0.5">
                        {time.format('dddd DD MMMM YYYY')}
                    </p>
                </div>
            </div>

            {/* Linea estetica inferiore sfumata */}
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        </div>
    );
}