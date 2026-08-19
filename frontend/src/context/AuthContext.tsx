import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  googleLogin: (tokenData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  switchDemoAccount: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Session check failed, clearing token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    if (res.success && res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const register = async (userData: any) => {
    const res = await authApi.register(userData);
    if (res.success && res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const googleLogin = async (tokenData: any) => {
    const res = await authApi.googleAuth(tokenData);
    if (res.success && res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const switchDemoAccount = async (role: UserRole) => {
    let email = 'student@shikshasetu.edu';
    let password = 'Student@123';

    if (role === 'ADMIN') {
      email = 'admin@shikshasetu.edu';
      password = 'Admin@123456';
    } else if (role === 'FACULTY') {
      email = 'teacher@shikshasetu.edu';
      password = 'Teacher@123';
    }

    await login({ email, password });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshUser,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
