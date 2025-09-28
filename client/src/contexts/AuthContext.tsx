import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FINANCE' | 'CLEANER' | 'AGENT';
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get current user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.data;
    },
    retry: false,
    enabled: !!localStorage.getItem('accessToken'),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);
      queryClient.setQueryData(['auth', 'me'], data.data.user);
      toast.success('Login successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Login failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      queryClient.clear();
    },
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      
      const response = await api.post('/auth/refresh', { refreshToken });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.data.accessToken);
      // Update the token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
    },
    onError: () => {
      // Refresh failed, logout user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      queryClient.clear();
    },
  });

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await refreshMutation.mutateAsync();
            // Retry the original request
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            setUser(null);
            queryClient.clear();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [refreshMutation, queryClient]);

  // Set up axios interceptor for adding auth header
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Update user state when userData changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
    setIsLoading(userLoading);
  }, [userData, userLoading]);

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const refreshToken = async () => {
    await refreshMutation.mutateAsync();
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
