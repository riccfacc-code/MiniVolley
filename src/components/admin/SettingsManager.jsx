import React, { useState, useEffect } from 'react';
import { Api } from '@/api/ApiClient'; // SDK centralizzato per l'interazione con l'endpoint delle impostazioni
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Settings } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente per la gestione delle configurazioni globali del Torneo e del Tabellone Pubblico.
 * Permette di modificare testi, loghi testuali, velocità di scorrimento e impaginazione dei match.
 * 
 * @param {Object} props.settings - Record contenente le configurazioni attuali caricate dal DB.
 * @param {Function} props.onRefresh - Callback per notificare il parent che i dati sono stati aggiornati.
 */
export default function SettingsManager({ settings, onRefresh }) {
    // Stati locali per la gestione dei campi di testo dell'intestazione del torneo
    const [name, setName] = useState('');       // Titolo principale (es. Nome dell'evento)
    const [subTitle, setSubTitle] = useState(''); // Sottotitolo (es. Edizione del trofeo)
    const [line1, setLine1] = useState('');      // Riga dettagli 1 (es. Data e Luogo)
    const [line2, setLine2] = useState('');      // Riga dettagli 2 (es. Note logistiche o Contatti)

    // Stati locali per i parametri tecnici di visualizzazione sul monitor/tabellone
    const [speed, setSpeed] = useState(8);             // Secondi di attesa prima del cambio pagina dello slider
    const [matchesPerPage, setMatchesPerPage] = useState(8); // Numero massimo di righe/match visibili contemporaneamente

    // 🔄 SINCRONIZZAZIONE DATI: Aggiorna gli stati locali non appena l'oggetto 'settings' viene caricato o modificato dal server
    useEffect(() => {
        if (settings) {
            setName(settings.tournament_name || '');
            setSubTitle(settings.sub_title || '');
            setLine1(settings.details_line1 || '');
            setLine2(settings.details_line2 || '');
            setSpeed(settings.scroll_speed || 8);
            setMatchesPerPage(settings.matches_per_page || 8); // Recupera il valore salvato, altrimenti fallback su 8
        }
    }, [settings]);

    /**
     * Valida, normalizza e invia le configurazioni correnti alle API di backend
     */
    const handleSave = async () => {
        // COSTRUZIONE PAYLOAD: Forziamo il trim sui testi e facciamo il casting esplicito a Number per i valori numerici
        const data = {
            tournament_name: name.trim(),
            sub_title: subTitle.trim(),
            details_line1: line1.trim(),
            details_line2: line2.trim(),
            scroll_speed: Number(speed),
            matches_per_page: Number(matchesPerPage) // Assicura che al DB arrivi un intero e non una stringa
        };

        try {
            // Se esiste già un ID o un record preliminare sul DB, procediamo con una UPDATE (PUT/PATCH)
            if (settings?.id || settings?.tournament_name) {
                // In caso di ID mancante ma record esistente, usa un ID di fallback statico (es. '1' per record singolo)
                await Api.entities.TournamentSettings.update(settings.id || '1', data);
            } else {
                // Altrimenti, se è la primissima configurazione del sistema, esegue una CREATE (POST)
                await Api.entities.TournamentSettings.create(data);
            }

            toast.success('Impostazioni salvate nel database');
            onRefresh(); // Forza il ricaricamento dei dati nel componente padre per aggiornare lo stato globale
        } catch (error) {
            console.error("Errore durante il salvataggio delle impostazioni:", error);
            toast.error("Errore nel salvataggio");
        }
    };

    return (
        <Card>
            {/* Intestazione del pannello impostazioni */}
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Impostazioni Torneo
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Campo: Nome Principale (Converte automaticamente l'input in UPPERCASE per uniformità grafica sul tabellone) */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground">Nome Principale Torneo</label>
                    <Input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="TORNEO VOLLEY S3 CUP 2026" />
                </div>

                {/* Campo: Sottotitolo (Forzato anch'esso in UPPERCASE per motivi di resa sul display pubblico) */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground">Sottotitolo / Trofeo</label>
                    <Input value={subTitle} onChange={e => setSubTitle(e.target.value.toUpperCase())} placeholder="TROFEO G. SGANZETTA — XXV EDIZIONE" />
                </div>

                {/* Campo: Dettagli Logistici 1 */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground">Data e Luogo</label>
                    <Input value={line1} onChange={e => setLine1(e.target.value)} placeholder="G.S. Pavic dal 1972 · Romagnano Sesia · Martedì 2 Giugno" />
                </div>

                {/* Campo: Dettagli Logistici 2 */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground">Note / Contatti Organizzatore</label>
                    <Input value={line2} onChange={e => setLine2(e.target.value)} placeholder="Campo Sportivo di Via Gramsci · 📞 Contatti" />
                </div>

                {/* SEZIONE PARAMETRI REGIA (Disposta su una griglia a 2 colonne) */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Input: Tempo di switch delle pagine dello slider pubblico */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Secondi Scorrimento</label>
                        <Input type="number" value={speed} onChange={e => setSpeed(e.target.value)} min={3} max={30} />
                    </div>

                    {/* Input: Numero di record simultanei per singola pagina del tabellone */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">Partite per Pagina</label>
                        <Input type="number" value={matchesPerPage} onChange={e => setMatchesPerPage(e.target.value)} min={4} max={24} />
                    </div>
                </div>

                {/* Pulsante di Invio Massivo del Form */}
                <Button onClick={handleSave} className="w-full mt-2">
                    <Save className="w-4 h-4 mr-2" /> Salva Configurazione
                </Button>
            </CardContent>
        </Card>
    );
}