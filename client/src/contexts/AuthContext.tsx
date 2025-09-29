import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FINANCE' | 'CLEANER' | 'AGENT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // For now, set a mock user
      setUser({
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    // For now, simulate login
    if (email === 'admin@test.com' && password === 'password123') {
      const mockUser = {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem('accessToken', 'mock-jwt-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      setUser(mockUser);
      toast.success('Login successful');
    } else {
      throw new Error('Invalid credentials');
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  // Register function
  const register = async (userData: Partial<User> & { password: string }) => {
    // For now, simulate registration
    const mockUser = {
      id: '1',
      name: userData.name || 'New User',
      email: userData.email || 'user@example.com',
      role: userData.role || 'AGENT',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('accessToken', 'mock-jwt-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    setUser(mockUser);
    toast.success('Registration successful');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}