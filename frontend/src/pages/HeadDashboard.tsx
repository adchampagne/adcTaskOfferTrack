import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, Users, CheckCircle, Clock, AlertCircle, 
  Calendar, TrendingUp, X, ArrowUpRight, Send, Paperclip,
  Download, MessageSquare, Trash2, Image, Video, FileArchive, File,
  ChevronDown, ChevronRight, ArrowUp, ArrowDown, ExternalLink
} from 'lucide-react';
import { headDashboardApi, filesApi, commentsApi } from '../api';
import { Task, TaskStatus, TaskPriority, taskStatusLabels, taskPriorityLabels, taskTypeLabels, TaskFile } from '../types';
import { format, isPast, isToday, isYesterday, isTomorrow, startOfDay, parseISO } from 'date-fns';
import { formatMoscow, toMoscowTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Функция для форматирования размера файла
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Функция для получения иконки по типу файла
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('gzip')) return FileArchive;
  return File;
}

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
    format(toMoscowTime(new Date(task.deadline)), "yyyy-MM-dd'T'HH:mm")
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
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueToday = isToday(new Date(task.deadline));

  // Загрузка файлов
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['task-files', task.id],
    queryFn: () => filesApi.getTaskFiles(task.id),
  });

  // Загрузка комментариев
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['task-comments', task.id],
    queryFn: () => commentsApi.getTaskComments(task.id),
  });

  // Скачивание файла
  const handleDownload = async (file: TaskFile) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/download/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Ошибка скачивания файла');
    }
  };

  // Добавление комментария
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await commentsApi.add(task.id, newComment.trim());
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setNewComment('');
      toast.success('Комментарий добавлен');
    } catch {
      toast.error('Ошибка добавления комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Удаление комментария
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий?')) return;
    try {
      await commentsApi.delete(commentId);
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      toast.success('Комментарий удалён');
    } catch {
      toast.error('Ошибка удаления комментария');
    }
  };

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

  // Разделение файлов
  const attachments = files.filter(f => !f.is_result);
  const results = files.filter(f => f.is_result);

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
              {formatMoscow(new Date(task.deadline), 'd MMMM yyyy, HH:mm')}
              {isOverdue && ' (просрочено)'}
              {isDueToday && !isOverdue && ' (сегодня)'}
            </p>
          </div>

          {task.description && (
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <p className="text-xs text-dark-400 mb-2">Описание</p>
              <p className="text-dark-200 whitespace-pre-wrap break-all">{task.description}</p>
            </div>
          )}

          {/* Файлы */}
          <div className="p-4 bg-dark-800/50 rounded-xl">
            <p className="text-xs text-dark-400 mb-3 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              Файлы ({files.length})
            </p>
            
            {filesLoading ? (
              <div className="skeleton h-12 rounded-lg" />
            ) : files.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-2">Нет прикреплённых файлов</p>
            ) : (
              <div className="space-y-3">
                {/* Вложения к задаче */}
                {attachments.length > 0 && (
                  <div>
                    <p className="text-xs text-dark-500 mb-2">Вложения к задаче:</p>
                    <div className="space-y-2">
                      {attachments.map((file) => {
                        const Icon = getFileIcon(file.mime_type);
                        return (
                          <div key={file.id} className="flex items-center gap-3 p-2 bg-dark-700/50 rounded-lg group">
                            <Icon className="w-5 h-5 text-primary-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-dark-200 truncate">{file.original_name}</p>
                              <p className="text-xs text-dark-500">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
                              title="Скачать"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Результаты работы */}
                {results.length > 0 && (
                  <div>
                    <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Результаты работы:
                    </p>
                    <div className="space-y-2">
                      {results.map((file) => {
                        const Icon = getFileIcon(file.mime_type);
                        return (
                          <div key={file.id} className="flex items-center gap-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg group">
                            <Icon className="w-5 h-5 text-green-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-dark-200 truncate">{file.original_name}</p>
                              <p className="text-xs text-dark-500">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-2 text-dark-400 hover:text-green-400 transition-colors"
                              title="Скачать"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Комментарии */}
          <div className="p-4 bg-dark-800/50 rounded-xl">
            <p className="text-xs text-dark-400 mb-3 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Комментарии ({comments.length})
            </p>

            {commentsLoading ? (
              <div className="skeleton h-12 rounded-lg" />
            ) : (
              <div className="space-y-3">
                {/* Список комментариев */}
                {comments.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-dark-700/50 rounded-lg group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                              {comment.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-dark-200">{comment.user_name}</span>
                            <span className="text-xs text-dark-500">
                              {formatMoscow(new Date(comment.created_at), 'd MMM, HH:mm')}
                            </span>
                          </div>
                          {(comment.user_id === user?.id || user?.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Удалить"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-dark-300 whitespace-pre-wrap pl-8">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Форма добавления комментария */}
                <div className="flex gap-2">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Написать комментарий..."
                    className="glass-input flex-1 resize-none text-sm"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleAddComment();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="self-end px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-dark-600">Ctrl+Enter для отправки</p>
              </div>
            )}
          </div>

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

type SortDirection = 'asc' | 'desc';

function HeadDashboard() {
  const queryClient = useQueryClient();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

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

  // Задачи, созданные сотрудниками отдела (на другие отделы)
  const { data: memberCreatedTasks = [], isLoading: memberTasksLoading } = useQuery({
    queryKey: ['head-member-created-tasks'],
    queryFn: headDashboardApi.getTasksCreatedByMembers,
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

  // Группировка задач по дням (должен быть ДО условных return)
  const groupedTasks = useMemo(() => {
    // Фильтрация
    const filtered = statusFilter === 'all' 
      ? tasks 
      : tasks.filter(t => t.status === statusFilter);

    // Сортировка по времени
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Группировка по дням
    const groups: { [key: string]: { date: Date; label: string; tasks: Task[] } } = {};
    
    sorted.forEach(task => {
      const taskDate = toMoscowTime(parseISO(task.deadline));
      const dayKey = format(startOfDay(taskDate), 'yyyy-MM-dd');
      
      if (!groups[dayKey]) {
        let label = formatMoscow(taskDate, 'd MMMM yyyy');
        
        if (isToday(taskDate)) {
          label = 'Сегодня';
        } else if (isYesterday(taskDate)) {
          label = 'Вчера';
        } else if (isTomorrow(taskDate)) {
          label = 'Завтра';
        }
        
        groups[dayKey] = {
          date: startOfDay(taskDate),
          label,
          tasks: []
        };
      }
      
      groups[dayKey].tasks.push(task);
    });

    // Сортировка групп
    return Object.entries(groups)
      .sort(([keyA], [keyB]) => {
        return sortDirection === 'asc' 
          ? keyA.localeCompare(keyB) 
          : keyB.localeCompare(keyA);
      })
      .map(([key, value]) => ({ dayKey: key, ...value }));
  }, [tasks, statusFilter, sortDirection]);

  const toggleDayCollapse = (dayKey: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedDays(new Set(groupedTasks.map(g => g.dayKey)));
  };

  const expandAll = () => {
    setCollapsedDays(new Set());
  };

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

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

        {/* Tasks Created By Members - Задачи, созданные сотрудниками */}
        {memberCreatedTasks.length > 0 && (
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-amber-400" />
              Задачи от сотрудников
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">
                {memberCreatedTasks.length}
              </span>
            </h2>
            <p className="text-dark-400 text-sm mb-4">
              Задачи, которые ваши сотрудники поставили на другие отделы
            </p>
            
            {memberTasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700/50">
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Задача</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Создал</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Исполнитель</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Статус</th>
                      <th className="text-left py-3 px-4 text-dark-400 font-medium">Дедлайн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberCreatedTasks.map((task) => {
                      const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
                      const isDueToday = isToday(new Date(task.deadline));
                      
                      return (
                        <tr 
                          key={task.id} 
                          className="border-b border-dark-700/30 hover:bg-dark-800/30 transition-colors cursor-pointer"
                          onClick={() => setViewingTask(task)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {task.task_number && (
                                <span className="text-xs font-mono text-dark-500">#{task.task_number}</span>
                              )}
                              <span className="text-dark-100 font-medium truncate max-w-[200px]">{task.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
                                {task.customer_name?.charAt(0)}
                              </div>
                              <span className="text-dark-200 text-sm">{task.customer_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-dark-300 text-sm">{task.executor_name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                              {getStatusIcon(task.status)}
                              {taskStatusLabels[task.status]}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-dark-300'}`}>
                              {formatMoscow(new Date(task.deadline), 'd MMM, HH:mm')}
                              {isOverdue && ' (!)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tasks List */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Задачи отдела
            </h2>
            
            <div className="flex flex-wrap gap-2">
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

          {/* Контролы сортировки и сворачивания */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-dark-700/50">
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-300 hover:bg-dark-700 transition-colors text-sm"
            >
              {sortDirection === 'desc' ? (
                <>
                  <ArrowDown className="w-4 h-4" />
                  Сначала новые
                </>
              ) : (
                <>
                  <ArrowUp className="w-4 h-4" />
                  Сначала старые
                </>
              )}
            </button>
            
            <div className="h-4 w-px bg-dark-700/50 mx-1" />
            
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-300 hover:bg-dark-700 transition-colors text-sm"
            >
              Развернуть все
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-dark-300 hover:bg-dark-700 transition-colors text-sm"
            >
              Свернуть все
            </button>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : groupedTasks.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              Нет задач
            </p>
          ) : (
            <div className="space-y-4">
              {groupedTasks.map(({ dayKey, label, tasks: dayTasks, date }) => {
                const isCollapsed = collapsedDays.has(dayKey);
                const isTodayGroup = isToday(date);
                const isPastGroup = isPast(date) && !isToday(date);
                
                // Считаем статистику по дню
                const pendingCount = dayTasks.filter(t => t.status === 'pending').length;
                const inProgressCount = dayTasks.filter(t => t.status === 'in_progress').length;
                const completedCount = dayTasks.filter(t => t.status === 'completed').length;
                
                return (
                  <div key={dayKey} className="rounded-xl border border-dark-700/50 overflow-hidden">
                    {/* Заголовок дня */}
                    <button
                      onClick={() => toggleDayCollapse(dayKey)}
                      className={`w-full flex items-center justify-between p-4 transition-colors ${
                        isTodayGroup 
                          ? 'bg-primary-500/10 hover:bg-primary-500/15' 
                          : isPastGroup 
                            ? 'bg-dark-800/80 hover:bg-dark-800' 
                            : 'bg-dark-800/50 hover:bg-dark-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isCollapsed ? (
                          <ChevronRight className="w-5 h-5 text-dark-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-dark-400" />
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${isTodayGroup ? 'text-primary-400' : 'text-dark-500'}`} />
                          <span className={`font-semibold ${isTodayGroup ? 'text-primary-400' : 'text-dark-200'}`}>
                            {label}
                          </span>
                          <span className="text-sm text-dark-500">
                            ({dayTasks.length} {dayTasks.length === 1 ? 'задача' : dayTasks.length < 5 ? 'задачи' : 'задач'})
                          </span>
                        </div>
                      </div>
                      
                      {/* Мини-статистика по дню */}
                      <div className="flex items-center gap-2">
                        {pendingCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">
                            <Clock className="w-3 h-3" />
                            {pendingCount}
                          </span>
                        )}
                        {inProgressCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400">
                            <AlertCircle className="w-3 h-3" />
                            {inProgressCount}
                          </span>
                        )}
                        {completedCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            {completedCount}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    {/* Задачи дня */}
                    {!isCollapsed && (
                      <div className="divide-y divide-dark-700/30">
                        {dayTasks.map((task) => {
                          const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
                          const isDueToday = isToday(new Date(task.deadline));
                          
                          return (
                            <div
                              key={task.id}
                              className={`p-4 transition-all hover:bg-dark-700/30 cursor-pointer ${
                                isOverdue ? 'bg-red-500/5' : 
                                isDueToday ? 'bg-amber-500/5' : 
                                'bg-dark-800/30'
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
                                    {formatMoscow(new Date(task.deadline), 'HH:mm')}
                                  </p>
                                  {isOverdue && (
                                    <p className="text-xs text-red-400">просрочено</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

