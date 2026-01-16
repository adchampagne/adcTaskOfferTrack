import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon, Plus, X, Shield, ShoppingCart, Code, Palette, Crown, Briefcase, Star, Edit2, Trash2, Key, Check, Send } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { User, UserRole, roleLabels } from '../types';
import { formatMoscow } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

interface PermissionDef {
  code: string;
  label: string;
  description: string;
}

interface UserFormData {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
}

interface EditUserFormData {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
}

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user?: User;
  onClose: () => void;
  onSave: (data: UserFormData | EditUserFormData, isEdit: boolean, permissions?: string[]) => void;
}) {
  const isEdit = !!user;
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    password: '',
    full_name: user?.full_name || '',
    role: user?.role || 'buyer',
  });

  // Права пользователя
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDef[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    if (isEdit && user) {
      setLoadingPermissions(true);
      Promise.all([
        authApi.getPermissionsList(),
        authApi.getUserPermissions(user.id)
      ]).then(([permissions, userPerms]) => {
        setAvailablePermissions(permissions);
        setSelectedPermissions(userPerms);
      }).catch(console.error)
        .finally(() => setLoadingPermissions(false));
    }
  }, [isEdit, user]);

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev =>
      prev.includes(code)
        ? prev.filter(p => p !== code)
        : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.full_name.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }
    // При создании пароль обязателен
    if (!isEdit && !formData.password.trim()) {
      toast.error('Пароль обязателен для нового пользователя');
      return;
    }
    onSave(formData, isEdit, isEdit ? selectedPermissions : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            {isEdit ? 'Редактировать пользователя' : 'Новый пользователь'}
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
              {isEdit ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="glass-input w-full"
              placeholder={isEdit ? 'Введите новый пароль' : 'Минимум 6 символов'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Роль *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head', 'dev_head'] as UserRole[]).map((role) => (
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
                  {role === 'creo_manager' && <Palette className="w-5 h-5 mx-auto mb-1" />}
                  {role === 'buying_head' && <Crown className="w-5 h-5 mx-auto mb-1" />}
                  {role === 'bizdev' && <Briefcase className="w-5 h-5 mx-auto mb-1" />}
                  {role === 'creo_head' && <Star className="w-5 h-5 mx-auto mb-1" />}
                  {role === 'dev_head' && <Crown className="w-5 h-5 mx-auto mb-1" />}
                  <span className="text-sm">{roleLabels[role]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Дополнительные права */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Дополнительные права
              </label>
              {loadingPermissions ? (
                <div className="text-dark-500 text-sm">Загрузка...</div>
              ) : availablePermissions.length === 0 ? (
                <div className="text-dark-500 text-sm">Нет доступных прав</div>
              ) : (
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <button
                      key={perm.code}
                      type="button"
                      onClick={() => togglePermission(perm.code)}
                      className={`w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                        selectedPermissions.includes(perm.code)
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedPermissions.includes(perm.code)
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-dark-500'
                      }`}>
                        {selectedPermissions.includes(perm.code) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${
                          selectedPermissions.includes(perm.code) ? 'text-primary-400' : 'text-dark-300'
                        }`}>
                          {perm.label}
                        </div>
                        <div className="text-xs text-dark-500">{perm.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Сохранить' : 'Создать'}
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
  const [editingUser, setEditingUser] = useState<User | undefined>();

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserFormData }) => 
      authApi.updateUser(id, {
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        password: data.password || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(undefined);
      setShowModal(false);
      toast.success('Пользователь обновлён');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка обновления');
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      authApi.updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка обновления прав');
    },
  });

  const handleSave = (data: UserFormData | EditUserFormData, isEdit: boolean, permissions?: string[]) => {
    if (isEdit && editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: data as EditUserFormData });
      if (permissions !== undefined) {
        updatePermissionsMutation.mutate({ userId: editingUser.id, permissions });
      }
    } else {
      createMutation.mutate(data as UserFormData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(undefined);
  };

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Пользователь удалён');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления');
    },
  });

  const handleDelete = (user: User) => {
    if (confirm(`Вы уверены, что хотите удалить пользователя "${user.full_name}"? Это действие нельзя отменить.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'buyer': return <ShoppingCart className="w-4 h-4" />;
      case 'webdev': return <Code className="w-4 h-4" />;
      case 'creo_manager': return <Palette className="w-4 h-4" />;
      case 'buying_head': return <Crown className="w-4 h-4" />;
      case 'bizdev': return <Briefcase className="w-4 h-4" />;
      case 'creo_head': return <Star className="w-4 h-4" />;
      case 'dev_head': return <Crown className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'buyer': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'webdev': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'creo_manager': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'buying_head': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'bizdev': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'creo_head': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'dev_head': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
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
          {users.map((u: User, index: number) => (
            <div
              key={u.id}
              className="glass-card p-6 animate-fade-in group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-100 truncate">
                    {u.full_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-dark-400 font-mono">@{u.username}</p>
                    {u.role !== 'admin' && (
                      <a
                        href={`https://t.me/${u.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Написать в Telegram"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(u)}
                    className="text-dark-400 hover:text-primary-400 transition-colors p-1"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    className="text-dark-400 hover:text-red-400 transition-colors p-1"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                  {getRoleIcon(u.role)}
                  {roleLabels[u.role]}
                </span>
                <span className="text-xs text-dark-500">
                  {formatMoscow(new Date(u.created_at), 'd MMM yyyy')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Users;

