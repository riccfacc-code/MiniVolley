import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Scoreboard from './pages/Scoreboard.jsx';
import Admin from './pages/Admin.jsx';
import LoginPage from './pages/LoginPage.jsx'; // Nuovo componente di login
import PageNotFound from './lib/PageNotFound';

/**
 * Componente che protegge le rotte amministrative.
 * Se l'utente non è autenticato, viene reindirizzato alla pagina di login.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoadingAuth } = useAuth();

    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50/50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AuthenticatedApp = () => {
    return (
        <Routes>
            {/* Rotta Pubblica */}
            <Route path="/" element={<Scoreboard />} />
            
            {/* Rotta di Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rotta Protetta */}
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute>
                        <Admin />
                    </ProtectedRoute>
                } 
            />

            {/* Fallback 404 */}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router>
                    <AuthenticatedApp />
                </Router>
                <Toaster richColors closeButton position="top-right" />
            </QueryClientProvider>
        </AuthProvider>
    );
}

export default App;
