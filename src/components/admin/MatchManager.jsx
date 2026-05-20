import React, { useState } from 'react';
import { Api } from '@/api/ApiClient'; // SDK centralizzato per le chiamate API
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Swords } from 'lucide-react';
import { toast } from 'sonner';

// Configurazione statica delle fasi del torneo
const phases = [
    { value: 'gironi', label: 'Gironi' },
    { value: 'ottavi', label: 'Ottavi' },
    { value: 'quarti', label: 'Quarti' },
    { value: 'semifinali', label: 'Semifinali' },
    { value: 'finale_3', label: 'Finale 3°/4°' },
    { value: 'finale', label: 'Finale' },
];

// Configurazione statica degli stati possibili di una partita
const statuses = [
    { value: 'da_giocare', label: 'Da giocare' },
    { value: 'in_corso', label: 'In corso' },
    { value: 'terminata', label: 'Terminata' },
];

// Stato iniziale vuoto per il modulo di inserimento/modifica
const emptyForm = {
    team_a_id: '', team_b_id: '', phase: 'gironi', group_name: '',
    status: 'da_giocare', score_a: '', score_b: '',
    field: '', match_order: ''
};

/**
 * Componente per la gestione del tabellone partite (Match) di un torneo.
 * Permette la creazione, modifica, eliminazione e il filtraggio per categoria.
 * 
 * @param {Array} props.matches - Elenco complessivo di tutte le partite a database.
 * @param {Array} props.teams - Elenco complessivo di tutte le squadre iscritte.
 * @param {Function} props.onRefresh - Callback per ricaricare i dati dal server dopo un'operazione di scrittura.
 * @param {string} props.activeCategory - Categoria attualmente selezionata nell'interfaccia (es. 'S3 WHITE').
 */
export default function MatchManager({ matches = [], teams = [], onRefresh, activeCategory }) {
    // Stati locali per il controllo della visualizzazione e del contenuto del form
    const [showForm, setShowForm] = useState(false);     // Mostra/nasconde il pannello del form
    const [editingId, setEditingId] = useState(null);   // Memorizza l'ID del match in modifica (null se nuova partita)
    const [form, setForm] = useState(emptyForm);         // Stato dei singoli campi del form

    // 1. FILTRAGGIO DATI: Isoliamo solo le squadre e i match appartenenti alla categoria attiva
    const filteredTeams = teams.filter(t => t.category === activeCategory);
    const filteredMatches = matches.filter(m => m.category === activeCategory);

    // 2. ESTRAZIONE DINAMICA DEI GIRONI: Evita configurazioni hardcoded leggendo direttamente i dati delle squadre
    // Prende i 'group_name' unici (tramite Set) delle squadre filtrate, rimuovendo valori nulli o vuoti
    const dynamicGroups = Array.from(
        new Set(
            filteredTeams
                .map(t => t.group_name)
                .filter(group => group && group.trim() !== '')
        )
    ).sort();

    /**
     * Ripristina il form allo stato iniziale impostando i valori di default corretti
     */
    const resetForm = () => {
        setForm({
            ...emptyForm,
            // Imposta automaticamente il primo girone trovato come default per velocizzare l'inserimento
            group_name: dynamicGroups.length > 0 ? dynamicGroups[0] : 'NO_GROUP'
        });
        setEditingId(null);
        setShowForm(false);
    };

    /**
     * Carica i dati di un match esistente all'interno del form per la modifica
     * @param {Object} m - L'oggetto partita selezionato dalla lista
     */
    const handleEdit = (m) => {
        setForm({
            team_a_id: m.team_a_id || '',
            team_b_id: m.team_b_id || '',
            phase: m.phase || 'gironi',
            group_name: m.group_name || 'NO_GROUP',
            status: m.status || 'da_giocare',
            score_a: m.score_a ?? '', // Mantiene lo 0 usando il nullish coalescing operator
            score_b: m.score_b ?? '',
            field: m.field || '',
            match_order: m.match_order ?? ''
        });
        // Gestione flessibile della chiave primaria a seconda della struttura dati ritornata dal DB
        setEditingId(m.match_id || m.id);
        setShowForm(true);
    };

    /**
     * Invia i dati inseriti o modificati alle API di backend (Create o Update)
     */
    const handleSave = async () => {
        // Recupera gli oggetti squadra completi per salvare in modo denormalizzato anche il nome testuale
        const teamA = filteredTeams.find(t => String(t.team_id || t.id) === String(form.team_a_id));
        const teamB = filteredTeams.find(t => String(t.team_id || t.id) === String(form.team_b_id));

        // Se è selezionato 'NO_GROUP' (es. fasi finali), mappiamo a undefined per pulire il campo sul DB
        const finalGroupName = form.group_name === 'NO_GROUP' ? undefined : form.group_name;

        // SANITIZZAZIONE E PREPARAZIONE DEL PAYLOAD: Converte le stringhe del form nei tipi corretti (Number/undefined)
        const data = {
            team_a_id: form.team_a_id,
            team_a_name: teamA?.name || form.team_a_id,
            team_b_id: form.team_b_id,
            team_b_name: teamB?.name || form.team_b_id,
            phase: form.phase,
            category: activeCategory, // Associa la partita alla categoria attualmente visualizzata
            group_name: finalGroupName,
            status: form.status,
            score_a: form.score_a !== '' ? Number(form.score_a) : undefined,
            score_b: form.score_b !== '' ? Number(form.score_b) : undefined,
            field: form.field || undefined,
            match_order: form.match_order !== '' ? Number(form.match_order) : undefined,
        };

        try {
            if (editingId) {
                // Modalità Modifica: esegue una PUT/PATCH sul record esistente
                await Api.entities.Match.update(editingId, data);
                toast.success('Partita aggiornata');
            } else {
                // Modalità Creazione: inserisce un nuovo record a database
                await Api.entities.Match.create(data);
                toast.success('Partita creata');
            }
            resetForm();   // Chiude il form e svuota i campi
            onRefresh();   // Forza l'aggiornamento dei dati nel componente padre
        } catch (error) {
            console.error("Errore salvataggio match:", error);
            toast.error("Errore durante il salvataggio");
        }
    };

    /**
     * Rimuove definitivamente una partita tramite chiamata API
     * @param {string|number} id - ID univoco della partita da eliminare
     */
    const handleDelete = async (id) => {
        try {
            await Api.entities.Match.delete(id);
            toast.success('Partita eliminata');
            onRefresh(); // Sincronizza l'interfaccia rimuovendo l'elemento
        } catch (error) {
            console.error("Errore eliminazione match:", error);
            toast.error("Errore durante l'eliminazione");
        }
    };

    /**
     * Helper grafico che restituisce un Badge pre-stilizzato in base allo stato del match
     * @param {string} status - Lo stato della partita ('da_giocare', 'in_corso', 'terminata')
     */
    const statusBadge = (status) => {
        const colors = {
            da_giocare: 'bg-muted text-muted-foreground',
            in_corso: 'bg-primary/20 text-primary',
            terminata: 'bg-green-500/20 text-green-400'
        };
        const labels = { da_giocare: 'Da giocare', in_corso: 'In corso', terminata: 'Terminata' };
        return <Badge className={colors[status]}>{labels[status]}</Badge>;
    };

    return (
        <Card>
            {/* Intestazione del Modulo con Titolo dinamico e pulsante di inserimento */}
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Swords className="w-5 h-5" /> Partite — {activeCategory}
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setShowForm(!showForm); }} size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Nuova
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Form Condizionale: visibile solo se showForm è true */}
                {showForm && (
                    <div className="p-4 bg-secondary rounded-xl space-y-4 border border-border">
                        {/* Selezione Squadre (A vs B) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Squadra A</label>
                                <Select value={String(form.team_a_id)} onValueChange={v => setForm(p => ({ ...p, team_a_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredTeams.map(t => (
                                            <SelectItem key={t.team_id || t.id} value={String(t.team_id || t.id)}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Squadra B</label>
                                <Select value={String(form.team_b_id)} onValueChange={v => setForm(p => ({ ...p, team_b_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredTeams.map(t => (
                                            <SelectItem key={t.team_id || t.id} value={String(t.team_id || t.id)}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Parametri di Configurazione del Match (Fase, Girone Dinamico, Stato) */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Fase</label>
                                <Select value={form.phase} onValueChange={v => setForm(p => ({ ...p, phase: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {phases.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* DROPDOWN DINAMICO: Elenca solo i gironi reali estratti dalle squadre */}
                            <div>
                                <label className="text-xs text-muted-foreground">Girone</label>
                                <Select value={form.group_name || 'NO_GROUP'} onValueChange={v => setForm(p => ({ ...p, group_name: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {dynamicGroups.map(gName => (
                                            <SelectItem key={gName} value={gName}>Girone {gName}</SelectItem>
                                        ))}
                                        <SelectItem value="NO_GROUP">Nessun Girone / Fase Finale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground">Stato</label>
                                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Informazioni Logistiche (Campo di gioco e Ordine cronologico) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Campo</label>
                                <Input value={form.field} onChange={e => setForm(p => ({ ...p, field: e.target.value }))} placeholder="1, 2..." />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Ordine Gara</label>
                                <Input type="number" value={form.match_order} onChange={e => setForm(p => ({ ...p, match_order: e.target.value }))} placeholder="1" />
                            </div>
                        </div>

                        {/* Gestione dei Punteggi della Gara */}
                        <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Punteggio (A - B)</label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    value={form.score_a}
                                    onChange={e => setForm(p => ({ ...p, score_a: e.target.value }))}
                                    className="w-20 text-center text-lg"
                                    placeholder="-"
                                />
                                <span className="text-muted-foreground font-bold text-xl">-</span>
                                <Input
                                    type="number"
                                    value={form.score_b}
                                    onChange={e => setForm(p => ({ ...p, score_b: e.target.value }))}
                                    className="w-20 text-center text-lg"
                                    placeholder="-"
                                />
                            </div>
                        </div>

                        {/* Pulsanti di Azione del Form */}
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={resetForm}>Annulla</Button>
                            <Button onClick={handleSave}>
                                <Save className="w-4 h-4 mr-1" /> {editingId ? 'Aggiorna' : 'Crea'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* RENDERING DELLA LISTA PARTITE RAGGRUPPATE PER FASE */}
                {phases.map(phase => {
                    // Filtra ed ordina le partite della fase corrente in base alla proprietà 'match_order'
                    const phaseMatches = filteredMatches
                        .filter(m => m.phase === phase.value)
                        .sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

                    // Se una determinata fase non ha partite, non renderizza la sezione (evita intestazioni vuote)
                    if (phaseMatches.length === 0) return null;

                    return (
                        <div key={phase.value} className="space-y-1">
                            <h4 className="text-sm font-semibold text-primary">{phase.label}</h4>

                            {/* Elenco dei singoli match della fase */}
                            {phaseMatches.map(m => (
                                <div
                                    key={m.match_id || m.id}
                                    className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80"
                                    onClick={() => handleEdit(m)} // Cliccando sulla riga si apre il form in modalità modifica
                                >
                                    {/* Visualizzazione Nomi Squadre e Punteggio Corrente */}
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-sm">{m.team_a_name}</span>
                                        <span className="text-muted-foreground text-xs">{m.score_a ?? '-'} - {m.score_b ?? '-'}</span>
                                        <span className="font-medium text-sm">{m.team_b_name}</span>
                                    </div>

                                    {/* Badge di Stato, Girone e Pulsante di Cancellazione */}
                                    <div className="flex items-center gap-2">
                                        {m.group_name && m.group_name !== 'NO_GROUP' && (
                                            <Badge variant="outline" className="text-xs">Girone {m.group_name}</Badge>
                                        )}
                                        {statusBadge(m.status)}

                                        {/* Il pulsante richiede e.stopPropagation() per impedire al click di attivare l'handleEdit della riga */}
                                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(m.match_id || m.id); }}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}

                {/* Messaggio di fallback se non ci sono match registrati per la categoria selezionata */}
                {filteredMatches.length === 0 && !showForm && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        Nessuna partita in questa categoria
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
