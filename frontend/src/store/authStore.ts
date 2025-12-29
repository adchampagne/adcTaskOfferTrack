import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authApi } from '../api';
import { useSettingsStore } from './settingsStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: string[]; // Дополнительные права
  
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  canManageOffers: () => boolean;
  canManagePartners: () => boolean;
  canManageKnowledge: () => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
  permissions: [],

  login: async (username: string, password: string) => {
    const { token, user } = await authApi.login(username, password);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Загружаем права пользователя
    const permissions = await authApi.getMyPermissions().catch(() => []);
    
    set({ token, user, isAuthenticated: true, permissions });
    
    // Загружаем настройки персонализации нового пользователя
    useSettingsStore.getState().loadSettings();
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, permissions: [] });
    
    // Сбрасываем настройки на дефолтные при логауте
    const settingsStore = useSettingsStore.getState();
    settingsStore.resetToDefaults();
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authApi.getMe();
      const permissions = await authApi.getMyPermissions().catch(() => []);
      set({ user, isAuthenticated: true, isLoading: false, permissions });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false, permissions: [] });
    }
  },

  canManageOffers: () => {
    const { user, permissions } = get();
    if (user?.role === 'admin' || user?.role === 'buyer' || user?.role === 'bizdev' || user?.role === 'buying_head') {
      return true;
    }
    return permissions.includes('manage_offers');
  },

  canManagePartners: () => {
    const { user, permissions } = get();
    if (user?.role === 'admin' || user?.role === 'buyer' || user?.role === 'bizdev') {
      return true;
    }
    return permissions.includes('manage_partners');
  },

  canManageKnowledge: () => {
    const { user, permissions } = get();
    if (user?.role === 'admin') {
      return true;
    }
    return permissions.includes('manage_knowledge');
  },

  hasRole: (...roles: UserRole[]) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },
}));

