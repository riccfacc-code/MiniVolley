import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['S3 WHITE', 'S3 GREEN', 'S3 RED'];

export default function TeamManager({ teams, onRefresh, activeCategory }) {
    const [name, setName] = useState('');
    const [group, setGroup] = useState('');

    const filteredTeams = teams.filter(t => t.category === activeCategory);

    const handleAdd = async () => {
        if (!name.trim()) return;
        await base44.entities.Team.create({
            name: name.trim(),
            group_name: group || undefined,
            category: activeCategory
        });
        setName('');
        toast.success('Squadra aggiunta');
        onRefresh();
    };

    const handleDelete = async (id) => {
        await base44.entities.Team.delete(id);
        toast.success('Squadra eliminata');
        onRefresh();
    };

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
                    <Input
                        placeholder="Nome squadra"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="flex-1"
                    />
                    <Input
                        placeholder="Girone (es. A)"
                        value={group}
                        onChange={e => setGroup(e.target.value.toUpperCase())}
                        className="w-28"
                    />
                    <Button onClick={handleAdd} size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {uniqueGroups.map(g => (
                    <div key={g} className="space-y-1">
                        <h4 className="text-sm font-semibold text-primary">Girone {g}</h4>
                        {filteredTeams.filter(t => t.group_name === g).map(t => (
                            <div key={t.id} className="flex items-center justify-between py-1.5 px-3 bg-secondary rounded-lg">
                                <span className="font-medium">{t.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ))}

                {filteredTeams.filter(t => !t.group_name).length > 0 && (
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-muted-foreground">Senza girone</h4>
                        {filteredTeams.filter(t => !t.group_name).map(t => (
                            <div key={t.id} className="flex items-center justify-between py-1.5 px-3 bg-secondary rounded-lg">
                                <span className="font-medium">{t.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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