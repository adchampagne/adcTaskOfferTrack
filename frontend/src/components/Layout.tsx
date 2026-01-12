import { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  CheckSquare, 
  Users, 
  LogOut,
  Zap,
  Menu,
  X,
  Layers,
  BarChart3,
  TrendingUp,
  BookOpen,
  Settings,
  Wrench,
  Trophy,
  Command,
  Search
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { roleLabels } from '../types';
import Notifications from './Notifications';
import CommandPalette from './CommandPalette';
import { useGlobalHotkeys } from '../hooks/useHotkeys';

function Layout() {
  const { user, logout, hasRole } = useAuthStore();
  const { loadSettings, getTheme, isLoaded } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Глобальные горячие клавиши
  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const openNewTask = useCallback(() => navigate('/tasks?new=1'), [navigate]);
  
  useGlobalHotkeys(openCommandPalette, openNewTask);
  
  // Загружаем настройки с сервера при монтировании
  useEffect(() => {
    if (!isLoaded) {
      loadSettings();
    }
  }, [loadSettings, isLoaded]);

  // Закрывать меню при смене роута
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Блокировать скролл body когда меню открыто
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: { to: string; icon: typeof LayoutDashboard; label: string }[] = [
    { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  ];

  // Партнёрки видят только админы, руководители баинга и биздевы
  if (hasRole('admin', 'buying_head', 'bizdev')) {
    navItems.push({ to: '/partners', icon: Building2, label: 'Партнёрки' });
  }

  navItems.push(
    { to: '/offers', icon: Package, label: 'Офферы' },
    { to: '/tasks', icon: CheckSquare, label: 'Задачи' },
  );

  // Отделы видны всем
  navItems.push({ to: '/departments', icon: Layers, label: 'Отделы' });

  // Дашборд руководителя для руководителей отделов
  if (hasRole('buying_head') || hasRole('creo_head') || hasRole('dev_head')) {
    navItems.push({ to: '/head-dashboard', icon: BarChart3, label: 'Мой отдел' });
  }

  // Аналитика - для руководителей отделов, биздева и админа
  if (hasRole('admin', 'buying_head', 'creo_head', 'dev_head', 'bizdev')) {
    navItems.push({ to: '/analytics', icon: TrendingUp, label: 'Аналитика' });
  }

  // Достижения - доступны всем
  navItems.push({ to: '/achievements', icon: Trophy, label: 'Достижения' });

  // База знаний (доступна всем, но контент фильтруется по отделу)
  navItems.push({ to: '/knowledge-base', icon: BookOpen, label: 'База знаний' });

  // Инструменты - доступны всем
  navItems.push({ to: '/tools', icon: Wrench, label: 'Инструменты' });
  
  if (hasRole('admin')) {
    navItems.push({ to: '/users', icon: Users, label: 'Пользователи' });
  }

  // Настройки доступны всем
  navItems.push({ to: '/settings', icon: Settings, label: 'Настройки' });

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 flex-shrink-0">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style={{ 
            background: getTheme().colors.gradient,
            boxShadow: `0 10px 15px -3px color-mix(in srgb, ${getTheme().colors.primary} 30%, transparent)`
          }}
        >
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-100">Offer Tracker</h1>
          <p className="text-xs text-dark-400">Таск-трекер и всякое другое</p>
        </div>
      </div>

      {/* Quick Actions Button */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 border border-dark-600 transition-all group"
      >
        <Search className="w-4 h-4 text-dark-400 group-hover:text-dark-300" />
        <span className="flex-1 text-left text-sm text-dark-400 group-hover:text-dark-300">Быстрый поиск...</span>
        <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-dark-600 rounded text-xs text-dark-500">
          <Command className="w-3 h-3" />
          <span>K</span>
        </kbd>
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="pt-6 border-t border-dark-700 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
            style={{ background: getTheme().colors.gradient }}
          >
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-100 truncate">
              {user?.full_name}
            </p>
            <p className="text-xs text-dark-400">
              {user?.role && roleLabels[user.role]}
            </p>
          </div>
          <Notifications />
        </div>
        <button
          onClick={handleLogout}
          className="w-full nav-link text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ 
                background: getTheme().colors.gradient,
                boxShadow: `0 10px 15px -3px color-mix(in srgb, ${getTheme().colors.primary} 30%, transparent)`
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-dark-100">Offer Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Command Palette button - mobile */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 text-dark-300 hover:text-dark-100 hover:bg-dark-700/50 rounded-xl transition-colors"
              title="Быстрые действия (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
            </button>
            <Notifications />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-dark-300 hover:text-dark-100 hover:bg-dark-700/50 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] h-full max-h-screen glass-card rounded-l-2xl rounded-r-none p-6 flex flex-col overflow-y-auto animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <span className="text-lg font-bold text-dark-100">Меню</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 glass-card m-4 mr-0 p-6 flex-col flex-shrink-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 pt-20 lg:pt-4 min-h-0 flex flex-col">
        <div className="glass-card flex-1 flex flex-col overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
