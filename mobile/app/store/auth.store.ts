import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
}

interface AuthState {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  wallet: null,
  token: null,
  loading: false,
  hydrated: false,

  // Called once on app start — restores session from SecureStore
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('paya_token');
      if (token) {
        set({ token });
        await get().refreshMe();
      }
    } catch (err) {
      console.log('Hydrate error:', err);
    } finally {
      set({ hydrated: true });
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', data);
      const { token, user, wallet } = res.data;
      await SecureStore.setItemAsync('paya_token', token);
      set({ token, user, wallet });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      await SecureStore.setItemAsync('paya_token', token);
      set({ token, user });
      // Fetch wallet separately
      await get().refreshMe();
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('paya_token');
    set({ token: null, user: null, wallet: null });
  },

  refreshMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, wallet: res.data.wallet });
    } catch (err: any) {
      // Token is invalid/expired — clear it
      if (err.response?.status === 401) {
        await SecureStore.deleteItemAsync('paya_token');
        set({ token: null, user: null, wallet: null });
      }
    }
  },
}));