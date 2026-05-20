import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsManager({ settings, onRefresh }) {
    const [name, setName] = useState('');
    const [speed, setSpeed] = useState(8);

    useEffect(() => {
        if (settings) {
            setName(settings.tournament_name || '');
            setSpeed(settings.scroll_speed || 8);
        }
    }, [settings]);

    const handleSave = async () => {
        const data = { tournament_name: name, scroll_speed: Number(speed) };
        if (settings?.id) {
            await base44.entities.TournamentSettings.update(settings.id, data);
        } else {
            await base44.entities.TournamentSettings.create(data);
        }
        toast.success('Impostazioni salvate');
        onRefresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Impostazioni Torneo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm text-muted-foreground">Nome Torneo</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Torneo Minivolley 2026" />
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Secondi per sezione (scorrimento)</label>
                    <Input type="number" value={speed} onChange={e => setSpeed(e.target.value)} min={3} max={30} />
                </div>
                <Button onClick={handleSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" /> Salva Impostazioni
                </Button>
            </CardContent>
        </Card>
    );
}