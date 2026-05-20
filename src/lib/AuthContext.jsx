import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Forziamo lo stato iniziale come già loggato e pronto in locale
    const [user, setUser] = useState({
        id: "local-admin",
        email: "admin@localhost",
        name: "Amministratore Locale",
        role: "admin"
    });
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(true);
    const [appPublicSettings, setAppPublicSettings] = useState({
        id: "local",
        public_settings: { tournament_name: "MiniVolley Locale" }
    });

    useEffect(() => {
        // In locale diciamo subito che è tutto pronto senza fare chiamate API bloccanti
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
    }, []);

    const checkAppState = async () => {
        // Mock locale per evitare crash se chiamato esplicitamente da altri componenti
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
    };

    const checkUserAuth = async () => {
        setIsLoadingAuth(false);
        setAuthChecked(true);
    };

    const logout = (shouldRedirect = true) => {
        setUser(null);
        setIsAuthenticated(false);
        console.log("Logout simulato in locale");
    };

    const navigateToLogin = () => {
        console.log("Login non necessario in modalità locale pura");
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            appPublicSettings,
            authChecked,
            logout,
            navigateToLogin,
            checkUserAuth,
            checkAppState
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