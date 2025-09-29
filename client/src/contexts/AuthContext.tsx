import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
      // For now, we'll skip profile validation and just set a mock user
      // In production, you'd call api.getProfile(token) here
      setUser({
        id: '1',
        name: 'Homestay Admin',
        email: 'admin@homestay.com',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  }, []);

  // Test function to check if auth endpoint is reachable
  const testAuthEndpoint = async () => {
    try {
      console.log('🧪 Testing auth endpoint...');
      const response = await fetch('/api/auth/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      
      const data = await response.json();
      console.log('🧪 Test response:', data);
      return data;
    } catch (error) {
      console.error('🧪 Test error:', error);
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt:', { email, password: '***' });
    
    try {
      // First test if auth endpoint is reachable
      await testAuthEndpoint();
      
      console.log('📡 Making request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Login error response:', errorData);
        throw new Error(errorData.error || `Login failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Login success data:', data);
      
      const { user, accessToken } = data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', accessToken);
      setUser(user);
      toast.success('Login successful');
      console.log('🎉 User logged in successfully:', user);
    } catch (error: any) {
      console.error('💥 Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
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