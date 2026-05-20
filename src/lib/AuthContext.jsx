import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Al caricamento, controlliamo se esiste già un token in localStorage
    useEffect(() => {
        const checkStoredAuth = () => {
            const token = localStorage.getItem('admin_token');
            if (token) {
                setIsAuthenticated(true);
                setUser({ name: "Amministratore", role: "admin" });
            }
            setIsLoadingAuth(false);
        };
        checkStoredAuth();
    }, []);

    // Funzione di Login verso il backend
    const login = async (password) => {
        setIsLoadingAuth(true);
        setAuthError(null);
        try {
            const response = await fetch('https://minivolley-backend.onrender.com/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!response.ok) throw new Error("Password errata");

            const data = await response.json();
            
            // Salviamo il token per mantenere la sessione
            localStorage.setItem('admin_token', data.token);
            setIsAuthenticated(true);
            setUser({ name: "Amministratore", role: "admin" });
        } catch (err) {
            setAuthError(err.message);
            setIsAuthenticated(false);
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const navigateToLogin = () => {
        // Logica per gestire il redirect nel tuo router
        console.log("Reindirizzamento alla pagina di login...");
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            login,
            logout,
            navigateToLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
