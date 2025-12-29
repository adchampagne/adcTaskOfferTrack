import { create } from 'zustand';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  gradient: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: 'purple',
    name: 'Фиолетовый (по умолчанию)',
    colors: {
      primary: '#667eea',
      primaryLight: '#818cf8',
      primaryDark: '#5b21b6',
      accent: '#f093fb',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
  },
  {
    id: 'blue',
    name: 'Океан',
    colors: {
      primary: '#0ea5e9',
      primaryLight: '#38bdf8',
      primaryDark: '#0369a1',
      accent: '#22d3ee',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    },
  },
  {
    id: 'green',
    name: 'Изумруд',
    colors: {
      primary: '#10b981',
      primaryLight: '#34d399',
      primaryDark: '#047857',
      accent: '#a7f3d0',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  },
  {
    id: 'orange',
    name: 'Закат',
    colors: {
      primary: '#f97316',
      primaryLight: '#fb923c',
      primaryDark: '#c2410c',
      accent: '#fbbf24',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    },
  },
  {
    id: 'pink',
    name: 'Розовый',
    colors: {
      primary: '#ec4899',
      primaryLight: '#f472b6',
      primaryDark: '#be185d',
      accent: '#f9a8d4',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    },
  },
  {
    id: 'red',
    name: 'Рубин',
    colors: {
      primary: '#ef4444',
      primaryLight: '#f87171',
      primaryDark: '#b91c1c',
      accent: '#fca5a5',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
  },
  {
    id: 'amber',
    name: 'Золото',
    colors: {
      primary: '#f59e0b',
      primaryLight: '#fbbf24',
      primaryDark: '#b45309',
      accent: '#fcd34d',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  },
  {
    id: 'teal',
    name: 'Бирюза',
    colors: {
      primary: '#14b8a6',
      primaryLight: '#2dd4bf',
      primaryDark: '#0f766e',
      accent: '#5eead4',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    },
  },
];

export interface BackgroundOption {
  id: string;
  name: string;
  value: string;
  type: 'gradient' | 'image';
}

export const backgroundOptions: BackgroundOption[] = [
  {
    id: 'default',
    name: 'По умолчанию',
    value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    type: 'gradient',
  },
  {
    id: 'midnight',
    name: 'Полночь',
    value: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
    type: 'gradient',
  },
  {
    id: 'northern-lights',
    name: 'Северное сияние',
    value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    type: 'gradient',
  },
  {
    id: 'forest',
    name: 'Лес',
    value: 'linear-gradient(135deg, #0d1b0d 0%, #1a2f1a 50%, #0d2818 100%)',
    type: 'gradient',
  },
  {
    id: 'ocean-deep',
    name: 'Глубокий океан',
    value: 'linear-gradient(135deg, #0a1628 0%, #0e2a47 50%, #0a1f38 100%)',
    type: 'gradient',
  },
  {
    id: 'sunset',
    name: 'Вечерний закат',
    value: 'linear-gradient(135deg, #1a0a0a 0%, #2d1f1f 50%, #1f1420 100%)',
    type: 'gradient',
  },
  {
    id: 'cyberpunk',
    name: 'Киберпанк',
    value: 'linear-gradient(135deg, #120318 0%, #1a0a2e 50%, #0d0d1a 100%)',
    type: 'gradient',
  },
  {
    id: 'warm-night',
    name: 'Тёплая ночь',
    value: 'linear-gradient(135deg, #1a1410 0%, #2d2418 50%, #1f1a12 100%)',
    type: 'gradient',
  },
];

interface SettingsState {
  themeId: string;
  backgroundId: string;
  customBackground: string | null; // URL или base64 кастомного фона
  backgroundBlur: number;
  backgroundOpacity: number;
  
  setTheme: (themeId: string) => void;
  setBackground: (backgroundId: string) => void;
  setCustomBackground: (url: string | null) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  getTheme: () => Theme;
  getBackground: () => string;
  applyTheme: () => void;
}

const STORAGE_KEY = 'user_settings';

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return {};
};

const saveSettings = (state: Partial<SettingsState>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    themeId: state.themeId,
    backgroundId: state.backgroundId,
    customBackground: state.customBackground,
    backgroundBlur: state.backgroundBlur,
    backgroundOpacity: state.backgroundOpacity,
  }));
};

const savedSettings = loadSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeId: savedSettings.themeId || 'purple',
  backgroundId: savedSettings.backgroundId || 'default',
  customBackground: savedSettings.customBackground || null,
  backgroundBlur: savedSettings.backgroundBlur ?? 0,
  backgroundOpacity: savedSettings.backgroundOpacity ?? 100,

  setTheme: (themeId: string) => {
    set({ themeId });
    saveSettings({ ...get(), themeId });
    get().applyTheme();
  },

  setBackground: (backgroundId: string) => {
    set({ backgroundId, customBackground: null });
    saveSettings({ ...get(), backgroundId, customBackground: null });
    get().applyTheme();
  },

  setCustomBackground: (url: string | null) => {
    set({ customBackground: url });
    saveSettings({ ...get(), customBackground: url });
    get().applyTheme();
  },

  setBackgroundBlur: (blur: number) => {
    set({ backgroundBlur: blur });
    saveSettings({ ...get(), backgroundBlur: blur });
    get().applyTheme();
  },

  setBackgroundOpacity: (opacity: number) => {
    set({ backgroundOpacity: opacity });
    saveSettings({ ...get(), backgroundOpacity: opacity });
    get().applyTheme();
  },

  getTheme: () => {
    const { themeId } = get();
    return themes.find(t => t.id === themeId) || themes[0];
  },

  getBackground: () => {
    const { customBackground, backgroundId } = get();
    if (customBackground) {
      return `url(${customBackground})`;
    }
    const bg = backgroundOptions.find(b => b.id === backgroundId);
    return bg?.value || backgroundOptions[0].value;
  },

  applyTheme: () => {
    const { getTheme, getBackground, customBackground, backgroundBlur, backgroundOpacity } = get();
    const theme = getTheme();
    const background = getBackground();
    
    const root = document.documentElement;
    
    // Применяем цвета темы
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-gradient', theme.colors.gradient);
    
    // Применяем фон
    root.style.setProperty('--app-background', background);
    root.style.setProperty('--background-blur', `${backgroundBlur}px`);
    root.style.setProperty('--background-opacity', `${backgroundOpacity}%`);
    
    // Если это изображение, добавляем специальные стили
    if (customBackground) {
      root.classList.add('has-custom-background');
    } else {
      root.classList.remove('has-custom-background');
    }
  },
}));

// Применяем тему при загрузке
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useSettingsStore.getState().applyTheme();
  }, 0);
}

