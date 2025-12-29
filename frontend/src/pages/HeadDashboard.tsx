import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, Users, CheckCircle, Clock, AlertCircle, 
  Calendar, TrendingUp, X, ArrowUpRight, Send
} from 'lucide-react';
import { headDashboardApi } from '../api';
import { Task, TaskStatus, TaskPriority, taskStatusLabels, taskPriorityLabels, taskTypeLabels } from '../types';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

interface DepartmentMember {
  user_id: string;
  user_name: string;
  user_username: string;
  user_role: string;
}

function TaskEditModal({
  task,
  members,
  onClose,
  onSave,
}: {
  task: Task;
  members: DepartmentMember[];
  onClose: () => void;
  onSave: (updates: { deadline?: string; priority?: TaskPriority; executor_id?: string }) => void;
}) {
  const [deadline, setDeadline] = useState(
    format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm")
  );
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [executorId, setExecutorId] = useState(task.executor_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ deadline, priority, executor_id: executorId });
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'high': return 'bg-red-500 text-white border-red-500';
      case 'normal': return 'bg-amber-500 text-white border-amber-500';
      case 'low': return 'bg-green-500 text-white border-green-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            Редактировать задачу
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-dark-800/50 rounded-xl">
          <h3 className="font-medium text-dark-100 mb-1">{task.title}</h3>
          <p className="text-sm text-dark-400">Текущий исполнитель: {task.executor_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Назначить исполнителя
            </label>
            <select
              value={executorId}
              onChange={(e) => setExecutorId(e.target.value)}
              className="glass-input w-full"
            >
              <option value="">Оставить текущего</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Дедлайн
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Приоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'normal', 'low'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`h-[42px] px-4 py-3 rounded-xl border transition-all font-medium ${
                    priority === p
                      ? getPriorityColor(p)
                      : 'border-dark-600 text-dark-400 hover:border-dark-500'
                  }`}
                >
                  {taskPriorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskViewModal({
  task,
  onClose,
  onEdit,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
}) {
  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueToday = isToday(new Date(task.deadline));

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'normal': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {task.task_number && (
                <span className="text-xs font-mono text-dark-500">#{task.task_number}</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                {taskStatusLabels[task.status]}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                {taskPriorityLabels[task.priority]}
              </span>
            </div>
            <h2 className="text-xl font-bold text-dark-100">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <p className="text-xs text-dark-400 mb-1">Тип задачи</p>
              <p className="text-dark-100 font-medium">{taskTypeLabels[task.task_type]}</p>
            </div>
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <p className="text-xs text-dark-400 mb-1">GEO</p>
              <p className="text-dark-100 font-medium">{task.geo || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <p className="text-xs text-dark-400 mb-1">Исполнитель</p>
              <p className="text-dark-100 font-medium flex items-center gap-2">
                {task.executor_name}
                {task.executor_username && task.executor_username !== 'admin' && (
                  <a
                    href={`https://t.me/${task.executor_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title={`@${task.executor_username}`}
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
              </p>
            </div>
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <p className="text-xs text-dark-400 mb-1">Заказчик</p>
              <p className="text-dark-100 font-medium flex items-center gap-2">
                {task.customer_name}
                {task.customer_username && task.customer_username !== 'admin' && (
                  <a
                    href={`https://t.me/${task.customer_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title={`@${task.customer_username}`}
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isOverdue ? 'bg-red-500/10 border border-red-500/20' : isDueToday ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-dark-800/50'}`}>
            <p className="text-xs text-dark-400 mb-1">Дедлайн</p>
            <p className={`font-medium ${isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-dark-100'}`}>
              {format(new Date(task.deadline), 'd MMMM yyyy, HH:mm', { locale: ru })}
              {isOverdue && ' (просрочено)'}
              {isDueToday && !isOverdue && ' (сегодня)'}
            </p>
          </div>

          {task.description && (
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <p className="text-xs text-dark-400 mb-2">Описание</p>
              <p className="text-dark-200 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1">
              Закрыть
            </button>
            <button onClick={onEdit} className="btn-primary flex-1">
              Изменить дедлайн/приоритет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeadDashboard() {
  const queryClient = useQueryClient();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  // Проверяем, является ли пользователь руководителем
  const { data: headCheck, isLoading: checkLoading } = useQuery({
    queryKey: ['head-check'],
    queryFn: headDashboardApi.check,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['head-tasks'],
    queryFn: headDashboardApi.getTasks,
    enabled: headCheck?.isHead,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['head-stats'],
    queryFn: headDashboardApi.getStats,
    enabled: headCheck?.isHead,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['head-members'],
    queryFn: headDashboardApi.getMembers,
    enabled: headCheck?.isHead,
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: { deadline?: string; priority?: string; executor_id?: string } }) =>
      headDashboardApi.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['head-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['head-stats'] });
      setEditingTask(null);
      toast.success('Задача обновлена');
    },
    onError: () => {
      toast.error('Ошибка обновления');
    },
  });

  if (checkLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!headCheck?.isHead) {
    return <Navigate to="/" />;
  }

  const filteredTasks = statusFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === statusFilter);

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-500/10';
      case 'in_progress': return 'text-blue-400 bg-blue-500/10';
      case 'completed': return 'text-green-400 bg-green-500/10';
      case 'cancelled': return 'text-red-400 bg-red-500/10';
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 animate-slide-down">
        <div className="flex items-center gap-4 mb-2">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getDepartmentColor(headCheck.department?.code || '')} flex items-center justify-center shadow-lg`}>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">
              Отдел: {headCheck.department?.name}
            </h1>
            <p className="text-dark-400">Дашборд руководителя</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-3xl font-bold text-dark-100">{tasksByStatus.pending}</span>
            </div>
            <p className="text-dark-400">Ожидают выполнения</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-dark-100">{tasksByStatus.in_progress}</span>
            </div>
            <p className="text-dark-400">В работе</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-dark-100">{tasksByStatus.completed}</span>
            </div>
            <p className="text-dark-400">Выполнено</p>
          </div>
        </div>

        {/* Employee Stats */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Статистика сотрудников
          </h2>
          
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : stats?.members.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              В отделе пока нет сотрудников
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="text-left py-3 px-4 text-dark-400 font-medium">Сотрудник</th>
                    <th className="text-center py-3 px-4 text-dark-400 font-medium">За неделю</th>
                    <th className="text-center py-3 px-4 text-dark-400 font-medium">За месяц</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.members.map((member) => (
                    <tr key={member.user_id} className="border-b border-dark-700/30 hover:bg-dark-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                            {member.user_name.charAt(0)}
                          </div>
                          <span className="text-dark-100 font-medium flex items-center gap-2">
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
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          member.tasks_week > 0 ? 'bg-green-500/10 text-green-400' : 'bg-dark-700/50 text-dark-400'
                        }`}>
                          {member.tasks_week > 0 && <ArrowUpRight className="w-3 h-3" />}
                          {member.tasks_week}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          member.tasks_month > 0 ? 'bg-primary-500/10 text-primary-400' : 'bg-dark-700/50 text-dark-400'
                        }`}>
                          {member.tasks_month}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Задачи отдела
            </h2>
            
            <div className="flex gap-2">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700/50 text-dark-400 hover:bg-dark-700'
                  }`}
                >
                  {status === 'all' ? 'Все' : taskStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              Нет задач
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
                const isDueToday = isToday(new Date(task.deadline));
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all hover:border-primary-500/30 cursor-pointer ${
                      isOverdue ? 'bg-red-500/5 border-red-500/20' : 
                      isDueToday ? 'bg-amber-500/5 border-amber-500/20' : 
                      'bg-dark-800/50 border-dark-700/50'
                    }`}
                    onClick={() => setViewingTask(task)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {task.task_number && (
                            <span className="text-xs font-mono text-dark-500">#{task.task_number}</span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {taskStatusLabels[task.status]}
                          </span>
                        </div>
                        <h3 className="font-medium text-dark-100 truncate">{task.title}</h3>
                        <p className="text-sm text-dark-400 mt-1 flex items-center gap-1">
                          Исполнитель: {task.executor_name}
                          {task.executor_username && task.executor_username !== 'admin' && (
                            <a
                              href={`https://t.me/${task.executor_username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title={`@${task.executor_username}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-dark-300'}`}>
                          {format(new Date(task.deadline), 'd MMM', { locale: ru })}
                        </p>
                        <p className="text-xs text-dark-500">
                          {format(new Date(task.deadline), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {viewingTask && !editingTask && (
        <TaskViewModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={() => setEditingTask(viewingTask)}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          members={members}
          onClose={() => {
            setEditingTask(null);
            setViewingTask(null);
          }}
          onSave={(updates) => updateMutation.mutate({ taskId: editingTask.id, updates })}
        />
      )}
    </div>
  );
}

export default HeadDashboard;

