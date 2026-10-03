"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isBrowser = typeof window !== 'undefined';

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        
        if (res.data.requires_otp) {
            return { requiresOtp: true, email: res.data.email };
        }

        if (isBrowser) {
            localStorage.setItem('token', res.data.access_token);
        }
        setUser(res.data.user);
        return { requiresOtp: false, user: res.data.user };
    };

    const verifyOtp = async (email, password, otp) => {
        const res = await api.post('/auth/verify-otp', { email, password, otp });
        if (isBrowser) {
            localStorage.setItem('token', res.data.access_token);
        }
        setUser(res.data.user);
        return res.data.user;
    };

    const register = async (name, email, password, password_confirmation) => {
        const res = await api.post('/auth/register', {
            name,
            email,
            password,
            password_confirmation,
        });
        if (isBrowser) {
            localStorage.setItem('token', res.data.access_token);
        }
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            if (isBrowser) {
                localStorage.removeItem('token');
            }
            setUser(null);
        }
    };

    const fetchUser = async () => {
        if (!isBrowser || !localStorage.getItem('token')) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, verifyOtp, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};