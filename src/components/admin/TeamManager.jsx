import React, { useState } from 'react';
import { Api } from '@/api/ApiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamManager({ teams, onRefresh, activeCategory }) {
    const [name, setName] = useState('');
    const [group, setGroup] = useState('');

    // Filtriamo le squadre in base alla categoria attiva (es. S3 WHITE)
    const filteredTeams = teams.filter(t => t.category === activeCategory);

    const handleAdd = async () => {
        if (!name.trim()) return;

        try {
            await Api.entities.Team.create({
                name: name.trim(),
                group_name: group.trim() || undefined,
                category: activeCategory
            });
            setName('');
            setGroup(''); // Resetta anche il girone dopo l'inserimento
            toast.success('Squadra aggiunta');
            onRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Errore durante l'aggiunta della squadra");
        }
    };

    const handleDelete = async (id) => {
        try {
            await Api.entities.Team.delete(id);
            toast.success('Squadra eliminata');
            onRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Errore durante l'eliminazione");
        }
    };

    // Estraiamo i gironi esistenti per la categoria attiva per suggerirli nel datalist
    const uniqueGroups = [...new Set(filteredTeams.map(t => t.group_name).filter(Boolean))].sort();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> Squadre — {activeCategory}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    {/* INPUT NOME SQUADRA (Forzato in UPPERCASE) */}
                    <Input
                        placeholder="NOME SQUADRA"
                        value={name}
                        onChange={e => setName(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="flex-1 font-medium"
                    />

                    {/* INPUT GIRONE CON SUGGERIMENTI DATALIST */}
                    <div className="relative w-32">
                        <Input
                            placeholder="GIRONE"
                            value={group}
                            onChange={e => setGroup(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            list={`existing-groups-${activeCategory}`} // Aggancio alla lista id sotto
                            className="w-full font-medium"
                            autoComplete="off"
                        />
                        {/* Elenco dinamico dei gironi già presenti a DB per questa categoria */}
                        <datalist id={`existing-groups-${activeCategory}`}>
                            {uniqueGroups.map(g => (
                                <option key={g} value={g}>{`Girone ${g}`}</option>
                            ))}
                        </datalist>
                    </div>

                    <Button onClick={handleAdd} size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Elenco Squadre Raggruppate per Girone */}
                {uniqueGroups.map(g => (
                    <div key={g} className="space-y-1">
                        <h4 className="text-sm font-semibold text-primary">Girone {g}</h4>
                        {filteredTeams.filter(t => t.group_name === g).map(t => (
                            <div key={t.team_id || t.id} className="flex items-center justify-between py-1.5 px-3 bg-secondary rounded-lg">
                                <span className="font-medium text-sm">{t.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.team_id || t.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Squadre senza girone */}
                {filteredTeams.filter(t => !t.group_name).length > 0 && (
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-muted-foreground">Senza girone</h4>
                        {filteredTeams.filter(t => !t.group_name).map(t => (
                            <div key={t.team_id || t.id} className="flex items-center justify-between py-1.5 px-3 bg-secondary rounded-lg">
                                <span className="font-medium text-sm">{t.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.team_id || t.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {filteredTeams.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        Nessuna squadra in questa categoria
                    </p>
                )}
            </CardContent>
        </Card>
    );
}