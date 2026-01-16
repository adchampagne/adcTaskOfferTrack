import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Crown, X, UserPlus, UserMinus, Edit2, Plus, Trash2, Send, FolderPlus } from 'lucide-react';
import { departmentsApi, authApi, Department } from '../api';
import { useAuthStore } from '../store/authStore';
import { User, roleLabels, UserRole } from '../types';
import toast from 'react-hot-toast';

function CreateDepartmentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; code: string }) => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      onCreate({ name: name.trim(), code: code.trim().toLowerCase() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">Создать отдел</h2>
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
              Название отдела
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Отдел разработки"
              className="glass-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Код отдела
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="Например: development"
              className="glass-input w-full font-mono"
              required
            />
            <p className="text-xs text-dark-500 mt-1">
              Только латинские буквы, цифры и подчёркивание
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !code.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DepartmentCard({
  department,
  users,
  canEditHead,
  canManageMembers,
  canDelete,
  onAddHead,
  onRemoveHead,
  onAddMember,
  onViewMembers,
  onDelete,
}: {
  department: Department;
  users: User[];
  canEditHead: boolean;
  canManageMembers: boolean;
  canDelete: boolean;
  onAddHead: (departmentId: string, userId: string) => void;
  onRemoveHead: (departmentId: string, userId: string) => void;
  onAddMember: (departmentId: string) => void;
  onViewMembers: (departmentId: string) => void;
  onDelete: (departmentId: string) => void;
}) {
  const [isAddingHead, setIsAddingHead] = useState(false);
  const [selectedHead, setSelectedHead] = useState('');

  const heads = department.heads || [];
  const headUserIds = heads.map(h => h.user_id);
  const availableHeads = users.filter(u => !headUserIds.includes(u.id));

  const handleAddHead = () => {
    if (selectedHead) {
      onAddHead(department.id, selectedHead);
      setSelectedHead('');
      setIsAddingHead(false);
    }
  };

  const getDepartmentColor = (code: string) => {
    switch (code) {
      case 'buying': return 'from-green-500 to-emerald-600';
      case 'creo': return 'from-purple-500 to-pink-600';
      case 'development': return 'from-blue-500 to-cyan-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDepartmentIcon = (code: string) => {
    switch (code) {
      case 'buying': return '💰';
      case 'creo': return '🎨';
      case 'development': return '💻';
      default: return '📁';
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getDepartmentColor(department.code)} flex items-center justify-center text-2xl shadow-lg`}>
          {getDepartmentIcon(department.code)}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-dark-100">{department.name}</h3>
          <p className="text-sm text-dark-400">Код: {department.code}</p>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(department.id)}
            className="text-red-400 hover:text-red-300 transition-colors p-2"
            title="Удалить отдел"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Руководители */}
      <div className="mb-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark-300 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Руководители
          </span>
          {canEditHead && (
            <button
              onClick={() => setIsAddingHead(!isAddingHead)}
              className="text-primary-400 hover:text-primary-300 transition-colors"
              title="Добавить руководителя"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Список руководителей */}
        {heads.length === 0 ? (
          <p className="text-dark-500 italic text-sm">Не назначены</p>
        ) : (
          <div className="space-y-2">
            {heads.map((head) => (
              <div key={head.user_id} className="flex items-center justify-between py-1">
                <span className="text-dark-100 text-sm flex items-center gap-1">
                  {head.user_name}
                  {head.user_username && head.user_username !== 'admin' && (
                    <a
                      href={`https://t.me/${head.user_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title={`@${head.user_username}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}
                </span>
                {canEditHead && (
                  <button
                    onClick={() => onRemoveHead(department.id, head.user_id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Убрать из руководителей"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Добавление руководителя */}
        {isAddingHead && canEditHead && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-dark-700/50">
            <select
              value={selectedHead}
              onChange={(e) => setSelectedHead(e.target.value)}
              className="glass-input flex-1 text-sm"
            >
              <option value="">Выберите...</option>
              {availableHeads.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({roleLabels[u.role]})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddHead}
              disabled={!selectedHead}
              className="btn-primary text-sm px-3 disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
        )}
      </div>

      {/* Статистика и действия */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onViewMembers(department.id)}
          className="flex items-center gap-2 text-dark-300 hover:text-dark-100 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span>{department.members_count} сотрудников</span>
        </button>
        
        {canManageMembers && (
          <button
            onClick={() => onAddMember(department.id)}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            Добавить
          </button>
        )}
      </div>
    </div>
  );
}

function MembersModal({
  departmentId,
  departmentName,
  canRemove,
  onClose,
  onRemoveMember,
}: {
  departmentId: string;
  departmentName: string;
  canRemove: boolean;
  onClose: () => void;
  onRemoveMember: (userId: string) => void;
}) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['department-members', departmentId],
    queryFn: () => departmentsApi.getMembers(departmentId),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            Сотрудники: {departmentName}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>В отделе пока нет сотрудников</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-dark-700/50"
                >
                  <div>
                    <p className="font-medium text-dark-100 flex items-center gap-2">
                      {member.user_name}
                      {member.user_username && member.user_username !== 'admin' && (
                        <a
                          href={`https://t.me/${member.user_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title={`@${member.user_username}`}
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                    </p>
                    <p className="text-sm text-dark-400">{roleLabels[member.user_role as UserRole]}</p>
                  </div>
                  {canRemove && (
                    <button
                      onClick={() => onRemoveMember(member.user_id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2"
                      title="Удалить из отдела"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({
  departmentName,
  existingMemberIds,
  users,
  onClose,
  onAdd,
}: {
  departmentName: string;
  existingMemberIds: string[];
  users: User[];
  onClose: () => void;
  onAdd: (userId: string) => void;
}) {
  const [selectedUser, setSelectedUser] = useState('');

  const availableUsers = users.filter((u) => !existingMemberIds.includes(u.id));

  const handleAdd = () => {
    if (selectedUser) {
      onAdd(selectedUser);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            Добавить в: {departmentName}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {availableUsers.length === 0 ? (
          <p className="text-dark-400 text-center py-4">
            Все пользователи уже добавлены в этот отдел
          </p>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Выберите сотрудника
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="glass-input w-full"
              >
                <option value="">Выберите...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({roleLabels[u.role]})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">
                Отмена
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedUser}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditRoleModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (role: UserRole) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  const roles: UserRole[] = ['admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            Изменить роль: {user.full_name}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Выберите роль
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="glass-input w-full"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Отмена
          </button>
          <button
            onClick={() => onSave(selectedRole)}
            className="btn-primary flex-1"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function Departments() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [viewingMembersDeptId, setViewingMembersDeptId] = useState<string | null>(null);
  const [addingMemberDeptId, setAddingMemberDeptId] = useState<string | null>(null);
  const [editingRoleUser, setEditingRoleUser] = useState<User | null>(null);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);

  const isAdmin = hasRole('admin');

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
  });

  const { data: addingDeptMembers = [] } = useQuery({
    queryKey: ['department-members', addingMemberDeptId],
    queryFn: () => addingMemberDeptId ? departmentsApi.getMembers(addingMemberDeptId) : Promise.resolve([]),
    enabled: !!addingMemberDeptId,
  });

  const createDepartmentMutation = useMutation({
    mutationFn: (data: { name: string; code: string }) =>
      departmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreatingDepartment(false);
      toast.success('Отдел создан');
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Ошибка создания отдела');
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (departmentId: string) =>
      departmentsApi.delete(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Отдел удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления отдела');
    },
  });

  const addHeadMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      departmentsApi.addHead(departmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Руководитель добавлен');
    },
    onError: () => {
      toast.error('Ошибка добавления руководителя');
    },
  });

  const removeHeadMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      departmentsApi.removeHead(departmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Руководитель удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления руководителя');
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      departmentsApi.addMember(departmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department-members'] });
      setAddingMemberDeptId(null);
      toast.success('Сотрудник добавлен в отдел');
    },
    onError: () => {
      toast.error('Ошибка добавления сотрудника');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      departmentsApi.removeMember(departmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department-members'] });
      toast.success('Сотрудник удалён из отдела');
    },
    onError: () => {
      toast.error('Ошибка удаления сотрудника');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      authApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingRoleUser(null);
      toast.success('Роль изменена');
    },
    onError: () => {
      toast.error('Ошибка изменения роли');
    },
  });

  const handleAddHead = (departmentId: string, userId: string) => {
    addHeadMutation.mutate({ departmentId, userId });
  };

  const handleRemoveHead = (departmentId: string, userId: string) => {
    if (confirm('Убрать пользователя из руководителей отдела?')) {
      removeHeadMutation.mutate({ departmentId, userId });
    }
  };

  const handleAddMember = (userId: string) => {
    if (addingMemberDeptId) {
      addMemberMutation.mutate({ departmentId: addingMemberDeptId, userId });
    }
  };

  const handleRemoveMember = (departmentId: string, userId: string) => {
    if (confirm('Удалить сотрудника из отдела?')) {
      removeMemberMutation.mutate({ departmentId, userId });
    }
  };

  const handleDeleteDepartment = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    if (confirm(`Удалить отдел "${dept?.name}"? Все сотрудники будут откреплены от отдела.`)) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  const viewingDepartment = departments.find((d) => d.id === viewingMembersDeptId);
  const addingDepartment = departments.find((d) => d.id === addingMemberDeptId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-down mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-400" />
            Отделы
          </h1>
          <p className="text-dark-400 mt-1">
            Управление отделами и сотрудниками
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreatingDepartment(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FolderPlus className="w-5 h-5" />
            Создать отдел
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">

      {/* Departments Grid */}
      {deptsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-14 w-14 rounded-xl mb-4" />
              <div className="skeleton h-6 w-32 rounded mb-2" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const canEditHead = isAdmin;
            const isUserHead = dept.heads?.some(h => h.user_id === user?.id) || false;
            const canManageMembers = isAdmin || isUserHead;
            return (
              <DepartmentCard
                key={dept.id}
                department={dept}
                users={users}
                canEditHead={canEditHead}
                canManageMembers={canManageMembers}
                canDelete={isAdmin}
                onAddHead={handleAddHead}
                onRemoveHead={handleRemoveHead}
                onAddMember={setAddingMemberDeptId}
                onViewMembers={setViewingMembersDeptId}
                onDelete={handleDeleteDepartment}
              />
            );
          })}
        </div>
      )}

      {/* Users Section - только для админа */}
      {isAdmin && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-dark-100 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-400" />
            Все пользователи
          </h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50">
                  <tr>
                    <th className="text-left p-4 text-dark-300 font-medium">Имя</th>
                    <th className="text-left p-4 text-dark-300 font-medium">Логин</th>
                    <th className="text-left p-4 text-dark-300 font-medium">Роль</th>
                    <th className="text-right p-4 text-dark-300 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="p-4 text-dark-100 font-medium">{u.full_name}</td>
                      <td className="p-4 text-dark-400 font-mono flex items-center gap-2">
                        @{u.username}
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
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20">
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setEditingRoleUser(u)}
                          className="text-primary-400 hover:text-primary-300 transition-colors"
                          title="Изменить роль"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Modals */}
      {isCreatingDepartment && (
        <CreateDepartmentModal
          onClose={() => setIsCreatingDepartment(false)}
          onCreate={(data) => createDepartmentMutation.mutate(data)}
        />
      )}

      {viewingMembersDeptId && viewingDepartment && (
        <MembersModal
          departmentId={viewingMembersDeptId}
          departmentName={viewingDepartment.name}
          canRemove={isAdmin || viewingDepartment.heads?.some(h => h.user_id === user?.id) || false}
          onClose={() => setViewingMembersDeptId(null)}
          onRemoveMember={(userId) => handleRemoveMember(viewingMembersDeptId, userId)}
        />
      )}

      {addingMemberDeptId && addingDepartment && (
        <AddMemberModal
          departmentName={addingDepartment.name}
          existingMemberIds={addingDeptMembers.map((m) => m.user_id)}
          users={users}
          onClose={() => setAddingMemberDeptId(null)}
          onAdd={handleAddMember}
        />
      )}

      {editingRoleUser && (
        <EditRoleModal
          user={editingRoleUser}
          onClose={() => setEditingRoleUser(null)}
          onSave={(role) => updateRoleMutation.mutate({ userId: editingRoleUser.id, role })}
        />
      )}
    </div>
  );
}

export default Departments;

