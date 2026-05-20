import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone } from 'lucide-react';

export default function AnnouncementBanner({ announcements }) {
    const [current, setCurrent] = useState(0);

    const active = announcements.filter(a => a.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    useEffect(() => {
        if (active.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % active.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [active.length]);

    if (active.length === 0) return null;

    const item = active[current % active.length];

    return (
        <div className="w-full flex justify-end pointer-events-none">
            {/* Incrementato leggermente il padding verticale (py-3.5) per accomodare il testo più grande */}
            <div className="w-full bg-card/95 backdrop-blur border border-border/60 rounded-full px-6 py-3.5 flex items-center gap-4 shadow-xl">

                <Megaphone className="w-6 h-6 text-primary flex-shrink-0 animate-bounce" />

                <AnimatePresence mode="wait">
                    <motion.p
                        key={current}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                        /* MODIFICATO: aggiunto uppercase, ingrandito a text-lg e font-bold per massima leggibilità */
                        className="font-body text-lg font-bold uppercase text-foreground/90 truncate flex-1 text-left tracking-wide"
                    >
                        {item.icon && <span className="mr-2 text-xl normal-case">{item.icon}</span>}
                        {item.text}
                    </motion.p>
                </AnimatePresence>

                {active.length > 1 && (
                    <div className="flex gap-1.5 ml-auto flex-shrink-0">
                        {active.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current % active.length ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}