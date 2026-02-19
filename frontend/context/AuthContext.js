import React, { createContext, useState, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = async (email, password, role) => {
        try {
            const response = await api.post('/login', {
                email,
                password,
                role
            });

            if (response.data) {
                const userData = response.data;
                setUser(userData);
                return { success: true, role: userData.role };
            }
        } catch (error) {
            console.error('Login Error:', error.response?.data?.detail || error.message);
            return {
                success: false,
                message: error.response?.data?.detail || 'Invalid email or password'
            };
        }
        return { success: false, message: 'Something went wrong' };
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
