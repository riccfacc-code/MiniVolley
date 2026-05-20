import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client'; // Istanza globale configurata di React Query per il caching delle API
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Importazione dei componenti di pagina e di gestione errori/autenticazione
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Scoreboard from './pages/Scoreboard.jsx'; // Il tabellone/slider pubblico dei match
import Admin from './pages/Admin.jsx';             // La console di regia del torneo

/**
 * Sotto-componente che gestisce la logica di routing condizionale basata sullo stato di autenticazione.
 * Isola i controlli di caricamento e di errore per evitare re-render dell'intero albero dell'app.
 */
const AuthenticatedApp = () => {
    // Estrazione degli stati di loading, errori e funzioni di redirect dal contesto di autenticazione globale
    const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

    // ⏳ STATO DI CARICAMENTO: Mostra uno spinner centrato se l'app sta controllando la sessione utente o le impostazioni pubbliche
    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50/50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // ❌ GESTIONE ERRORI DI AUTENTICAZIONE
    if (authError) {
        // Caso A: L'utente è autenticato tramite provider ma non è censito nel database del torneo
        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        }
        // Caso B: Sessione assente o scaduta, forza il redirect automatico alla pagina di login
        else if (authError.type === 'auth_required') {
            navigateToLogin();
            return null; // Interrompe il rendering per evitare flash visivi delle rotte protette
        }
    }

    // 🛣️ DEFINIZIONE DELLE ROTTE DELL'APPLICAZIONE (Se l'autenticazione è superata con successo)
    return (
        <Routes>
            {/* Rotta Pubblica/Monitor: Visualizzazione del tabellone dei punteggi */}
            <Route path="/" element={<Scoreboard />} />

            {/* Rotta Protetta/Pannello: Console amministrativa per la gestione del torneo */}
            <Route path="/admin" element={<Admin />} />

            {/* Fallback 404: Intercetta qualsiasi URL non dichiarato sopra */}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

/**
 * Componente Radice (Root) dell'applicazione.
 * Configura l'ordine corretto dei Provider globali (Context, Caching, Routing) e dei componenti globali di UI.
 */
function App() {
    return (
        // 1. Gestione globale della sessione utente e dei permessi
        <AuthProvider>
            {/* 2. Provider di React Query per la gestione dello stato asincrono e delle chiamate API */}
            <QueryClientProvider client={queryClientInstance}>

                {/* 3. Provider del Router per la gestione della cronologia e navigazione URL */}
                <Router>
                    <AuthenticatedApp />
                </Router>

                {/* 
                  📢 CONTENITORE NOTIFICHE GLOBALE (Sonner)
                  Posizionato alla radice per rimanere sempre in primo piano (z-index elevato).
                  Le proprietà 'richColors' abilitano le colorazioni semantiche standard (verde per success, rosso per error) 
                  e 'closeButton' aggiunge la micro-X per la chiusura manuale del banner.
                */}
                <Toaster richColors closeButton position="top-right" />

            </QueryClientProvider>
        </AuthProvider>
    );
}

export default App;