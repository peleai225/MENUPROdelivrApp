import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, setUnauthorizedHandler } from '@/lib/api';
import { fetchMe, loginClient, logoutClient, registerClient, updateProfile as updateProfileRequest } from '@/lib/endpoints';
import type { Customer } from '@/types';

interface AuthContextValue {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: { phone: string; password: string }) => Promise<void>;
  register: (payload: { name: string; phone: string; password: string; email?: string; city?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: { name?: string; email?: string; city?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCustomer(null);
      setIsAuthenticated(false);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          const me = await fetchMe();
          setCustomer(me);
          setIsAuthenticated(true);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (payload: { phone: string; password: string }) => {
    const data = await loginClient(payload);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setCustomer(data.customer);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(
    async (payload: { name: string; phone: string; password: string; email?: string; city?: string }) => {
      const data = await registerClient(payload);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setCustomer(data.customer);
      setIsAuthenticated(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutClient();
    } catch {
      // ignore network errors during logout — we still clear local session
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (payload: { name?: string; email?: string; city?: string }) => {
    const updated = await updateProfileRequest(payload);
    setCustomer(updated);
  }, []);

  const value = useMemo(
    () => ({ customer, isLoading, isAuthenticated, login, register, logout, updateProfile }),
    [customer, isLoading, isAuthenticated, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
