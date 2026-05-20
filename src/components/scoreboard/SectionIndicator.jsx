import React from 'react';

export default function SectionIndicator({ sections, activeIndex }) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card/80 backdrop-blur-lg px-4 py-2 rounded-full border border-border/50">
            {sections.map((section, i) => (
                <div
                    key={i}
                    className={`transition-all duration-500 rounded-full ${i === activeIndex
                            ? 'w-8 h-3 bg-primary'
                            : 'w-3 h-3 bg-muted-foreground/30'
                        }`}
                    title={section.title}
                />
            ))}
        </div>
    );
}