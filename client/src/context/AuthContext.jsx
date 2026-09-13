import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import apiClient, { errorMessage } from '../api/client';

const SESSION_KEY = 'ceh_session';
const TOKEN_KEY = 'ceh_token';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readSession = () => {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readSession);

    const saveSession = useCallback((session) => {
        setUser(session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(TOKEN_KEY, session.token);
        return session;
    }, []);

    const signIn = useCallback(async (email, password) => {
        try {
            const { data } = await apiClient.post('/auth/signin', { email, password });
            return saveSession(data);
        } catch (error) {
            if (error.response?.data?.needsVerification) {
                const pending = new Error(error.response.data.message);
                pending.needsVerification = true;
                throw pending;
            }
            throw new Error(errorMessage(error, 'Sign in failed'));
        }
    }, [saveSession]);

    const signUp = useCallback(async (name, email, password) => {
        try {
            const { data } = await apiClient.post('/auth/signup', { name, email, password });
            return data;
        } catch (error) {
            throw new Error(errorMessage(error, 'Sign up failed'));
        }
    }, []);

    const verifyAccount = useCallback(async (email, otp) => {
        try {
            const { data } = await apiClient.post('/auth/verify-otp', { email, otp });
            return saveSession(data);
        } catch (error) {
            throw new Error(errorMessage(error, 'Verification failed'));
        }
    }, [saveSession]);

    const signOut = useCallback(() => {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }, []);

    const value = useMemo(
        () => ({ user, isAdmin: user?.role === 'admin', signIn, signUp, verifyAccount, signOut }),
        [user, signIn, signUp, verifyAccount, signOut]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
