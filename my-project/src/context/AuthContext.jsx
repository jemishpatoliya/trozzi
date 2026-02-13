import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (!token || !user) return;

        let cancelled = false;

        const ping = async () => {
            try {
                await apiClient.post('/auth/ping');
            } catch (_e) {
                // ignore
            }
        };

        ping();
        const interval = setInterval(() => {
            if (cancelled) return;
            ping();
        }, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [token, user]);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify token is still valid by calling /api/auth/me
                    const response = await apiClient.get('/auth/me', {
                        headers: {
                            Authorization: `Bearer ${storedToken}`,
                        },
                    });

                    setUser(response.data.data);
                    setToken(storedToken);
                } catch (error) {
                    // Token is invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { data } = response.data;
            const { token: newToken, user: userData } = data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const registerSendOtp = async ({ name, email, phone }) => {
        try {
            const response = await apiClient.post('/auth/register/send-otp', {
                name,
                email,
                phone,
            });
            return { success: true, data: response.data?.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to send OTP',
            };
        }
    };

    const loginSendOtp = async ({ phone }) => {
        try {
            const response = await apiClient.post('/auth/login/send-otp', {
                phone,
            });
            return { success: true, data: response.data?.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to send OTP',
            };
        }
    };

    const verifyOtp = async ({ phone, otp, purpose }) => {
        try {
            const response = await apiClient.post('/auth/verify-otp', {
                phone,
                otp,
                purpose,
            });

            const { data } = response.data;
            const { token: newToken, user: userData } = data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);

            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'OTP verification failed',
            };
        }
    };

    const register = async (userData) => {
        try {
            await apiClient.post('/auth/register', userData);
            
            console.log('✅ Registration successful, redirecting to login...');
            
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // Update apiClient to include auth token
    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const value = {
        user,
        token,
        loading,
        login,
        register,
        registerSendOtp,
        loginSendOtp,
        verifyOtp,
        logout,
        updateUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
