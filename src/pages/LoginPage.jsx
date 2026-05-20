import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button"; // Assicurati di avere il tuo componente Button
import { Input } from "@/components/ui/input";   // Assicurati di avere il tuo componente Input
import { toast } from "sonner";                  // Usiamo Sonner per il feedback visivo

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const { login, isLoadingAuth, authError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(password);
            toast.success("Accesso effettuato con successo!");
            navigate('/admin'); // Reindirizza all'area protetta dopo il login
        } catch (err) {
            toast.error("Password errata. Riprova.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-lg border border-slate-200">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Area Amministratore
                    </h1>
                    <p className="text-sm text-slate-500">
                        Inserisci la password per gestire il torneo
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password di sistema"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoadingAuth}
                    >
                        {isLoadingAuth ? "Verifica in corso..." : "Accedi"}
                    </Button>
                </form>

                {authError && (
                    <p className="text-center text-sm text-red-500">
                        {authError}
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoginPage;