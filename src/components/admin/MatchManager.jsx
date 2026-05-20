import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Swords } from 'lucide-react';
import { toast } from 'sonner';

const phases = [
    { value: 'gironi', label: 'Gironi' },
    { value: 'ottavi', label: 'Ottavi' },
    { value: 'quarti', label: 'Quarti' },
    { value: 'semifinali', label: 'Semifinali' },
    { value: 'finale_3', label: 'Finale 3°/4°' },
    { value: 'finale', label: 'Finale' },
];

const statuses = [
    { value: 'da_giocare', label: 'Da giocare' },
    { value: 'in_corso', label: 'In corso' },
    { value: 'terminata', label: 'Terminata' },
];

const emptyForm = {
    team_a_id: '', team_b_id: '', phase: 'gironi', group_name: '',
    status: 'da_giocare', score_a: '', score_b: '',
    field: '', match_order: ''
};

export default function MatchManager({ matches, teams, onRefresh, activeCategory }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const filteredTeams = teams.filter(t => t.category === activeCategory);
    const filteredMatches = matches.filter(m => m.category === activeCategory);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (m) => {
        setForm({
            team_a_id: m.team_a_id || '', team_b_id: m.team_b_id || '',
            phase: m.phase || 'gironi', group_name: m.group_name || '',
            status: m.status || 'da_giocare',
            score_a: m.score_a ?? '', score_b: m.score_b ?? '',
            field: m.field || '', match_order: m.match_order ?? ''
        });
        setEditingId(m.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        const teamA = filteredTeams.find(t => t.id === form.team_a_id);
        const teamB = filteredTeams.find(t => t.id === form.team_b_id);

        const data = {
            team_a_id: form.team_a_id,
            team_a_name: teamA?.name || form.team_a_id,
            team_b_id: form.team_b_id,
            team_b_name: teamB?.name || form.team_b_id,
            phase: form.phase,
            category: activeCategory,
            group_name: form.group_name || undefined,
            status: form.status,
            score_a: form.score_a !== '' ? Number(form.score_a) : undefined,
            score_b: form.score_b !== '' ? Number(form.score_b) : undefined,
            field: form.field || undefined,
            match_order: form.match_order !== '' ? Number(form.match_order) : undefined,
        };

        if (editingId) {
            await base44.entities.Match.update(editingId, data);
            toast.success('Partita aggiornata');
        } else {
            await base44.entities.Match.create(data);
            toast.success('Partita creata');
        }
        resetForm();
        onRefresh();
    };

    const handleDelete = async (id) => {
        await base44.entities.Match.delete(id);
        toast.success('Partita eliminata');
        onRefresh();
    };

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
                {showForm && (
                    <div className="p-4 bg-secondary rounded-xl space-y-4 border border-border">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Squadra A</label>
                                <Select value={form.team_a_id} onValueChange={v => setForm(p => ({ ...p, team_a_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Squadra B</label>
                                <Select value={form.team_b_id} onValueChange={v => setForm(p => ({ ...p, team_b_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

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
                            <div>
                                <label className="text-xs text-muted-foreground">Girone</label>
                                <Input value={form.group_name} onChange={e => setForm(p => ({ ...p, group_name: e.target.value.toUpperCase() }))} placeholder="A, B..." />
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

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Campo</label>
                                <Input value={form.field} onChange={e => setForm(p => ({ ...p, field: e.target.value }))} placeholder="1, 2..." />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Ordine</label>
                                <Input type="number" value={form.match_order} onChange={e => setForm(p => ({ ...p, match_order: e.target.value }))} placeholder="1" />
                            </div>
                        </div>

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

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={resetForm}>Annulla</Button>
                            <Button onClick={handleSave}>
                                <Save className="w-4 h-4 mr-1" /> {editingId ? 'Aggiorna' : 'Crea'}
                            </Button>
                        </div>
                    </div>
                )}

                {phases.map(phase => {
                    const phaseMatches = filteredMatches.filter(m => m.phase === phase.value).sort((a, b) => (a.match_order || 0) - (b.match_order || 0));
                    if (phaseMatches.length === 0) return null;
                    return (
                        <div key={phase.value} className="space-y-1">
                            <h4 className="text-sm font-semibold text-primary">{phase.label}</h4>
                            {phaseMatches.map(m => (
                                <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80" onClick={() => handleEdit(m)}>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-sm">{m.team_a_name}</span>
                                        <span className="text-muted-foreground text-xs">{m.score_a ?? '-'} - {m.score_b ?? '-'}</span>
                                        <span className="font-medium text-sm">{m.team_b_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {m.group_name && <Badge variant="outline" className="text-xs">Girone {m.group_name}</Badge>}
                                        {statusBadge(m.status)}
                                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(m.id); }}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}

                {filteredMatches.length === 0 && !showForm && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        Nessuna partita in questa categoria
                    </p>
                )}
            </CardContent>
        </Card>
    );
}