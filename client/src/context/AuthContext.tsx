import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('webflix_token');
        const storedUser = localStorage.getItem('webflix_user');
        
        if (token && storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Verify token is still valid
          try {
            const profile = await authAPI.getProfile();
            setUser(profile);
            localStorage.setItem('webflix_user', JSON.stringify(profile));
          } catch (error) {
            // Token invalid, clear storage
            localStorage.removeItem('webflix_token');
            localStorage.removeItem('webflix_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const userData = await authAPI.login(email, password);
      
      // Store token and user data
      if (userData.token) {
        localStorage.setItem('webflix_token', userData.token);
        localStorage.setItem('webflix_user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const userData = await authAPI.register(name, email, password);
      
      // Store token and user data
      if (userData.token) {
        localStorage.setItem('webflix_token', userData.token);
        localStorage.setItem('webflix_user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('webflix_token');
    localStorage.removeItem('webflix_user');
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};