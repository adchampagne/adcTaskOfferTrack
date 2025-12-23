import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon, Plus, X, Shield, ShoppingCart, Code } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { User, UserRole, roleLabels } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

interface UserFormData {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
}

function UserModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: UserFormData) => void;
}) {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    full_name: '',
    role: 'buyer',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.full_name.trim()) {
      toast.error('Заполните все поля');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            Новый пользователь
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Полное имя *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="glass-input w-full"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Логин *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="glass-input w-full"
              placeholder="ivan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Пароль *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="glass-input w-full"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Роль *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'buyer', 'webdev'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.role === role
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-dark-600 text-dark-400 hover:border-dark-500'
                  }`}
                >
                  {role === 'admin' && <Shield className="w-5 h-5 mx-auto mb-1" />}
                  {role === 'buyer' && <ShoppingCart className="w-5 h-5 mx-auto mb-1" />}
                  {role === 'webdev' && <Code className="w-5 h-5 mx-auto mb-1" />}
                  <span className="text-sm">{roleLabels[role]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Users() {
  const { hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // Только админ может видеть эту страницу
  if (!hasRole('admin')) {
    return <Navigate to="/" />;
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      toast.success('Пользователь создан');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка создания');
    },
  });

  const handleSave = (data: UserFormData) => {
    createMutation.mutate(data);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'buyer': return <ShoppingCart className="w-4 h-4" />;
      case 'webdev': return <Code className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'buyer': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'webdev': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary-400" />
            Пользователи
          </h1>
          <p className="text-dark-400 mt-1">
            Управление пользователями системы
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Добавить
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-12 w-12 rounded-xl mb-4" />
              <div className="skeleton h-5 w-32 rounded mb-2" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user: User, index: number) => (
            <div
              key={user.id}
              className="glass-card p-6 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-100 truncate">
                    {user.full_name}
                  </h3>
                  <p className="text-sm text-dark-400 font-mono">@{user.username}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  {roleLabels[user.role]}
                </span>
                <span className="text-xs text-dark-500">
                  {format(new Date(user.created_at), 'd MMM yyyy', { locale: ru })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Users;

