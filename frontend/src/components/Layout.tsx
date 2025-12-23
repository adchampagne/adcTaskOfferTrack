import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  CheckSquare, 
  Users, 
  LogOut,
  Zap,
  Send
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { roleLabels } from '../types';
import Notifications from './Notifications';
import TelegramSettings from './TelegramSettings';

function Layout() {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [showTelegramSettings, setShowTelegramSettings] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
    { to: '/partners', icon: Building2, label: 'Партнёрки' },
    { to: '/offers', icon: Package, label: 'Офферы' },
    { to: '/tasks', icon: CheckSquare, label: 'Задачи' },
  ];

  if (hasRole('admin')) {
    navItems.push({ to: '/users', icon: Users, label: 'Пользователи' });
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 glass-card m-4 mr-0 p-6 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark-100">Offer Tracker</h1>
            <p className="text-xs text-dark-400">Таск-трекер</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
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
        <div className="pt-6 border-t border-dark-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
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
            onClick={() => setShowTelegramSettings(true)}
            className="w-full nav-link text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 mb-2"
          >
            <Send className="w-5 h-5" />
            <span>Telegram</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full nav-link text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>
      
      <TelegramSettings 
        isOpen={showTelegramSettings} 
        onClose={() => setShowTelegramSettings(false)} 
      />

      {/* Main content */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="glass-card min-h-full p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;

