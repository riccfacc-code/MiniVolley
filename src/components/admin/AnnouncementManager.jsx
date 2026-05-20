import React, { useState } from 'react';
import { Api } from '@/api/ApiClient'; // Import centralizzato per le chiamate API di backend
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Megaphone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Gestore degli Annunci e delle Comunicazioni (es. per scorrimenti sul tabellone).
 * Rende disponibile un form di inserimento (testo + emoji) e la lista di gestione.
 * 
 * @param {Array} props.announcements - Elenco degli annunci provenienti dal backend.
 * @param {Function} props.onRefresh - Callback per ricaricare i dati nel componente padre dopo una modifica.
 */
export default function AnnouncementManager({ announcements = [], onRefresh }) {
    // Stati locali per la gestione del form di inserimento
    const [text, setText] = useState(''); // Testo dell'annuncio
    const [icon, setIcon] = useState(''); // Eventuale emoji o icona testuale

    // 🛡️ DIFESA CRASH: Assicura che 'announcements' sia sempre trattato come array.
    // Se dal backend arriva un oggetto errato o null, ripiega su [] evitando l'errore sul .map() o sul .sort()
    const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
    
    // Ordina gli annunci in base alla proprietà 'order' in modo ascendente (dal più piccolo al più grande)
    const sorted = [...safeAnnouncements].sort((a, b) => (a.order || 0) - (b.order || 0));

    /**
     * Crea un nuovo annuncio inviandolo al backend
     */
    const handleAdd = async () => {
        if (!text.trim()) return; // Blocca l'invio se il testo è vuoto o contiene solo spazi
        
        try {
            // Chiamata SDK per la creazione del record
            await Api.entities.Announcement.create({
                text: text.trim(),
                icon,
                active: true, // Di default i nuovi avvisi nascono visibili
                order: sorted.length + 1, // Lo posiziona in coda alla lista attuale
            });
            
            // Ripristina lo stato del form in caso di successo
            setText('');
            toast.success('Avviso aggiunto con successo');
            onRefresh(); // Notifica il parent per aggiornare la lista a schermo
        } catch (error) {
            console.error("Errore aggiunta annuncio:", error);
            toast.error("Impossibile aggiungere l'avviso");
        }
    };

    /**
     * Attiva o disattiva la visibilità di un annuncio senza eliminarlo
     * @param {Object} a - L'oggetto annuncio completo da modificare
     */
    const toggleActive = async (a) => {
        try {
            // Invia l'aggiornamento invertendo lo stato booleano della proprietà 'active'
            await Api.entities.Announcement.update(a.id, {
                ...a,
                active: !a.active
            });
            onRefresh(); // Sincronizza lo stato con il server
        } catch (error) {
            console.error("Errore aggiornamento visibilità:", error);
            toast.error("Impossibile modificare la visibilità");
        }
    };

    /**
     * Elimina definitivamente un annuncio tramite il suo ID univoco
     * @param {string|number} id - ID del record da cancellare
     */
    const handleDelete = async (id) => {
        try {
            await Api.entities.Announcement.delete(id);
            toast.success('Avviso eliminato');
            onRefresh(); // Ricarica i dati per rimuovere la riga dall'interfaccia
        } catch (error) {
            console.error("Errore eliminazione annuncio:", error);
            toast.error("Errore durante l'eliminazione");
        }
    };

    return (
        <Card>
            {/* Intestazione del Modulo */}
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" /> Avvisi & Annunci
                </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
                {/* Form di Inserimento Rapido */}
                <div className="flex gap-2">
                    {/* Input per Icona/Emoji */}
                    <Input
                        value={icon}
                        onChange={e => setIcon(e.target.value)}
                        className="w-14 text-center text-lg"
                        placeholder=""
                    />
                    {/* Input per il Testo Principale (Invia anche premendo Invio sulla tastiera) */}
                    <Input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Testo avviso..."
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    {/* Pulsante di Conferma */}
                    <Button onClick={handleAdd} size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Elenco degli Annunci Esistenti */}
                {sorted.map(a => (
                    <div 
                        key={a.id} 
                        // Se l'annuncio non è attivo, viene opacizzato al 40% per feedback visivo immediato
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary ${!a.active ? 'opacity-40' : ''}`}
                    >
                        {/* Icona o Spazio vuoto */}
                        <span className="text-lg">{a.icon || ''}</span>
                        
                        {/* Testo dell'avviso (troncato se troppo lungo per non rompere il layout rigido) */}
                        <p className="flex-1 text-sm truncate">{a.text}</p>
                        
                        {/* Bottone per Nascondere/Mostrare (Toggle Visibilità) */}
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(a)}>
                            {a.active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        
                        {/* Bottone di Eliminazione Definitiva */}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    </div>
                ))}

                {/* Placeholder visivo in caso di lista totalmente vuota */}
                {sorted.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-2">Nessun avviso presente</p>
                )}
            </CardContent>
        </Card>
    );
}