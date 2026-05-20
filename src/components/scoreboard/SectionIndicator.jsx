import React from 'react';

export default function SectionIndicator({ sections, activeIndex, onSelect }) {
    return (
        /* RIMOSSO: fixed, bottom-6, left-1/2, -translate-x-1/2 */
        /* Mantenuto lo sfondo a pillola solo per i pallini, pulito e isolato a sinistra */
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-lg px-4 py-2 rounded-full border border-border/50 shadow-lg w-max">
            {sections.map((section, i) => (
                <button
                    key={i}
                    onClick={() => onSelect && onSelect(i)}
                    className={`transition-all duration-500 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${i === activeIndex
                        ? 'w-8 h-3 bg-primary'
                        : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                    title={section.title}
                    type="button"
                    aria-label={`Vai alla sezione ${section.title || i + 1}`}
                />
            ))}
        </div>
    );
}