import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckSquare, Plus, X, Calendar, User, Clock, 
  AlertCircle, PlayCircle, CheckCircle, XCircle, Edit2, Trash2,
  Eye, FileText, ArrowRight, Upload, Download, Image, Video, 
  FileArchive, File, Paperclip, Loader2
} from 'lucide-react';
import { tasksApi, authApi, filesApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { Task, TaskStatus, TaskType, taskTypeLabels, taskStatusLabels, User as UserType, TaskFile } from '../types';
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

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

// Компонент отображения файла
function FileItem({ 
  file, 
  onDelete, 
  canDelete 
}: { 
  file: TaskFile; 
  onDelete: () => void;
  canDelete: boolean;
}) {
  const Icon = getFileIcon(file.mime_type);
  const isImage = file.mime_type.startsWith('image/');
  const isVideo = file.mime_type.startsWith('video/');
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
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

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50 group hover:border-primary-500/30 transition-colors">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isImage ? 'bg-green-500/10 text-green-400' :
          isVideo ? 'bg-purple-500/10 text-purple-400' :
          'bg-blue-500/10 text-blue-400'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark-100 truncate">{file.original_name}</p>
          <p className="text-xs text-dark-500">{formatFileSize(file.size)}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {(isImage || isVideo) && (
            <button
              onClick={() => setShowPreview(true)}
              className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
              title="Просмотреть"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
            title="Скачать"
          >
            <Download className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-10 right-0 text-white hover:text-primary-400 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            {isImage && (
              <img 
                src={`/api/files/view/${file.id}`} 
                alt={file.original_name}
                className="max-w-full max-h-[80vh] rounded-xl"
              />
            )}
            {isVideo && (
              <video 
                src={`/api/files/view/${file.id}`}
                controls
                className="max-w-full max-h-[80vh] rounded-xl"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface TaskFormData {
  title: string;
  description: string;
  task_type: TaskType;
  executor_id: string;
  deadline: string;
  files?: File[];
}

function TaskModal({
  task,
  users,
  currentUserId,
  onClose,
  onSave,
}: {
  task?: Task;
  users: UserType[];
  currentUserId: string;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    task_type: task?.task_type || 'create_landing',
    executor_id: task?.executor_id || '',
    deadline: task?.deadline 
      ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  });

  // Загрузка существующих файлов для редактирования
  const { data: existingFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['task-files', task?.id],
    queryFn: () => task?.id ? filesApi.getTaskFiles(task.id) : Promise.resolve([]),
    enabled: !!task?.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.executor_id || !formData.deadline) {
      toast.error('Заполните обязательные поля');
      return;
    }
    onSave({ ...formData, files: pendingFiles });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setPendingFiles(prev => [...prev, ...Array.from(selectedFiles)]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Удаление существующего файла
  const handleDeleteExistingFile = async (fileId: string) => {
    if (!confirm('Удалить файл?')) return;
    setIsUploading(true);
    try {
      await filesApi.delete(fileId);
      queryClient.invalidateQueries({ queryKey: ['task-files', task?.id] });
      toast.success('Файл удалён');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления файла');
    } finally {
      setIsUploading(false);
    }
  };

  const otherUsers = users.filter(u => u.id !== currentUserId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-100">
            {task ? 'Редактировать задачу' : 'Новая задача'}
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
              Заголовок *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-input w-full"
              placeholder="Краткое описание задачи"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input w-full h-24 resize-none"
              placeholder="Подробное описание задачи..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Тип задачи *
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as TaskType })}
                className="glass-input w-full"
              >
                {Object.entries(taskTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Исполнитель *
              </label>
              <select
                value={formData.executor_id}
                onChange={(e) => setFormData({ ...formData, executor_id: e.target.value })}
                className="glass-input w-full"
              >
                <option value="">Выберите...</option>
                <option value={currentUserId}>Я (себе)</option>
                {otherUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Дедлайн *
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="glass-input w-full"
            />
          </div>

          {/* Files section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-300 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Файлы
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.zip,.rar,.7z,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/20 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Добавить файлы
              </button>
            </div>

            {/* Existing files (for editing) */}
            {task && (
              <div className="mb-2">
                {filesLoading ? (
                  <div className="skeleton h-10 rounded-lg" />
                ) : existingFiles.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-dark-500 mb-1">Загруженные файлы:</p>
                    {existingFiles.map((file) => {
                      const Icon = getFileIcon(file.mime_type);
                      return (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-dark-800/50 rounded-lg text-sm">
                          <Icon className="w-4 h-4 text-primary-400" />
                          <span className="flex-1 truncate text-dark-200">{file.original_name}</span>
                          <span className="text-xs text-dark-500">{formatFileSize(file.size)}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingFile(file.id)}
                            disabled={isUploading}
                            className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Pending files (new files to upload) */}
            {pendingFiles.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-dark-500 mb-1">
                  {task ? 'Новые файлы для загрузки:' : 'Файлы для загрузки:'}
                </p>
                {pendingFiles.map((file, index) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-primary-500/5 border border-primary-500/20 rounded-lg text-sm">
                      <Icon className="w-4 h-4 text-primary-400" />
                      <span className="flex-1 truncate text-dark-200">{file.name}</span>
                      <span className="text-xs text-dark-500">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {existingFiles.length === 0 && pendingFiles.length === 0 && (
              <div className="text-center py-4 bg-dark-800/30 rounded-lg border border-dashed border-dark-600">
                <Paperclip className="w-6 h-6 text-dark-600 mx-auto mb-1" />
                <p className="text-xs text-dark-500">Нет прикреплённых файлов</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              {task ? 'Сохранить' : 'Создать'}
              {pendingFiles.length > 0 && ` (+ ${pendingFiles.length} файлов)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно просмотра задачи
function TaskViewModal({
  task,
  currentUserId,
  onClose,
  onEdit,
  onStatusChange,
}: {
  task: Task;
  currentUserId: string;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueToday = isToday(new Date(task.deadline));
  const canChangeStatus = task.customer_id === currentUserId || task.executor_id === currentUserId;
  const canEdit = task.customer_id === currentUserId;
  const canUpload = task.customer_id === currentUserId || task.executor_id === currentUserId;
  const isMyTask = task.executor_id === currentUserId;
  const isMyCreatedTask = task.customer_id === currentUserId;

  // Загрузка файлов задачи
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['task-files', task.id],
    queryFn: () => filesApi.getTaskFiles(task.id),
  });

  // Загрузка файлов
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await filesApi.upload(task.id, Array.from(selectedFiles));
      queryClient.invalidateQueries({ queryKey: ['task-files', task.id] });
      toast.success(`Загружено файлов: ${selectedFiles.length}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка загрузки файлов');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Удаление файла
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Удалить файл?')) return;
    try {
      await filesApi.delete(fileId);
      queryClient.invalidateQueries({ queryKey: ['task-files', task.id] });
      toast.success('Файл удалён');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления файла');
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl p-0 animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b border-dark-700 ${isOverdue ? 'bg-red-500/5' : isDueToday ? 'bg-yellow-500/5' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {taskStatusLabels[task.status]}
                </span>
                <span className="px-2 py-1 bg-dark-700/50 text-dark-300 text-xs rounded">
                  {taskTypeLabels[task.task_type]}
                </span>
              </div>
              <h2 className={`text-2xl font-bold ${task.status === 'completed' ? 'text-dark-400 line-through' : 'text-dark-100'}`}>
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-dark-200 transition-colors p-2 hover:bg-dark-700/50 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-dark-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Описание
            </h3>
            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              {task.description ? (
                <p className="text-dark-200 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-dark-500 italic">Описание не указано</p>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-2">Заказчик</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                  {task.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-dark-100">
                    {isMyCreatedTask ? 'Вы' : task.customer_name}
                  </p>
                  <p className="text-xs text-dark-500">создал задачу</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-2">Исполнитель</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {task.executor_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-dark-100">
                    {isMyTask ? 'Вы' : task.executor_name}
                  </p>
                  <p className="text-xs text-dark-500">выполняет задачу</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-1">Создано</h3>
              <p className="text-dark-200 font-medium">
                {format(new Date(task.created_at), 'd MMMM yyyy', { locale: ru })}
              </p>
              <p className="text-xs text-dark-500">
                {format(new Date(task.created_at), 'HH:mm')}
              </p>
            </div>

            <div className={`rounded-xl p-4 border ${isOverdue ? 'bg-red-500/10 border-red-500/30' : isDueToday ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-dark-800/50 border-dark-700/50'}`}>
              <h3 className="text-xs font-medium text-dark-500 mb-1 flex items-center gap-1">
                {isOverdue && <AlertCircle className="w-3 h-3 text-red-400" />}
                Дедлайн
              </h3>
              <p className={`font-medium ${isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-dark-200'}`}>
                {format(new Date(task.deadline), 'd MMMM yyyy', { locale: ru })}
              </p>
              <p className={`text-xs ${isOverdue ? 'text-red-400/70' : 'text-dark-500'}`}>
                {format(new Date(task.deadline), 'HH:mm')} • {formatDistanceToNow(new Date(task.deadline), { locale: ru, addSuffix: true })}
              </p>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-1">Завершено</h3>
              {task.completed_at ? (
                <>
                  <p className="text-green-400 font-medium">
                    {format(new Date(task.completed_at), 'd MMMM yyyy', { locale: ru })}
                  </p>
                  <p className="text-xs text-dark-500">
                    {format(new Date(task.completed_at), 'HH:mm')}
                  </p>
                </>
              ) : (
                <p className="text-dark-500 italic">Ещё не завершено</p>
              )}
            </div>
          </div>

          {/* Files section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-dark-400 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Файлы ({files.length})
              </h3>
              {canUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.zip,.rar,.7z,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? 'Загрузка...' : 'Загрузить'}
                  </button>
                </>
              )}
            </div>
            
            {filesLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700/50 text-center">
                <Paperclip className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                <p className="text-dark-500 text-sm">Нет прикреплённых файлов</p>
                {canUpload && (
                  <p className="text-dark-600 text-xs mt-1">
                    Нажмите "Загрузить" чтобы добавить файлы
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onDelete={() => handleDeleteFile(file.id)}
                    canDelete={file.uploaded_by === currentUserId || task.customer_id === currentUserId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status change */}
          {canChangeStatus && task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-3">Изменить статус</h3>
              <div className="flex flex-wrap gap-2">
                {task.status !== 'pending' && (
                  <button
                    onClick={() => onStatusChange('pending')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Ожидает
                  </button>
                )}
                {task.status !== 'in_progress' && (
                  <button
                    onClick={() => onStatusChange('in_progress')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    В работе
                  </button>
                )}
                <button
                  onClick={() => onStatusChange('completed')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Завершить
                </button>
                <button
                  onClick={() => onStatusChange('cancelled')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Отменить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Закрыть
          </button>
          {canEdit && (
            <button onClick={onEdit} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Edit2 className="w-4 h-4" />
              Редактировать
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusButton({ 
  status, 
  currentStatus, 
  onClick, 
  disabled 
}: { 
  status: TaskStatus; 
  currentStatus: TaskStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  const icons: Record<TaskStatus, typeof CheckCircle> = {
    pending: Clock,
    in_progress: PlayCircle,
    completed: CheckCircle,
    cancelled: XCircle,
  };
  
  const Icon = icons[status];
  const isActive = status === currentStatus;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isActive}
      className={`p-2 rounded-lg transition-all ${
        isActive 
          ? `status-${status}` 
          : 'text-dark-500 hover:text-dark-300 hover:bg-dark-700/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={taskStatusLabels[status]}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function TaskCard({ 
  task, 
  currentUserId,
  onStatusChange,
  onEdit,
  onDelete,
  onView,
}: { 
  task: Task;
  currentUserId: string;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueToday = isToday(new Date(task.deadline));
  const isDueTomorrow = isTomorrow(new Date(task.deadline));
  
  const canChangeStatus = task.customer_id === currentUserId || task.executor_id === currentUserId;
  const canEdit = task.customer_id === currentUserId;
  const isMyTask = task.executor_id === currentUserId;
  const isMyCreatedTask = task.customer_id === currentUserId;

  return (
    <div 
      className={`glass-card p-5 animate-fade-in transition-all cursor-pointer hover:border-primary-500/30 ${
        isOverdue 
          ? 'border-red-500/30 bg-red-500/5' 
          : isDueToday 
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : ''
      }`}
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        {/* Status buttons */}
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <StatusButton 
            status="pending" 
            currentStatus={task.status} 
            onClick={() => onStatusChange('pending')}
            disabled={!canChangeStatus}
          />
          <StatusButton 
            status="in_progress" 
            currentStatus={task.status} 
            onClick={() => onStatusChange('in_progress')}
            disabled={!canChangeStatus}
          />
          <StatusButton 
            status="completed" 
            currentStatus={task.status} 
            onClick={() => onStatusChange('completed')}
            disabled={!canChangeStatus}
          />
          <StatusButton 
            status="cancelled" 
            currentStatus={task.status} 
            onClick={() => onStatusChange('cancelled')}
            disabled={!canChangeStatus}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold text-lg ${
                task.status === 'completed' ? 'text-dark-400 line-through' : 'text-dark-100'
              }`}>
                {task.title}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-dark-700/50 text-dark-300 text-xs rounded mt-1">
                {taskTypeLabels[task.task_type]}
              </span>
            </div>
            
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onView}
                className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                title="Открыть задачу"
              >
                <Eye className="w-4 h-4" />
              </button>
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={onDelete}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-dark-400 text-sm mt-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-dark-500" />
              <span className="text-dark-400">
                {isMyCreatedTask ? 'Вы' : task.customer_name}
                <ArrowRight className="w-3 h-3 inline mx-1 text-dark-600" />
                {isMyTask ? 'Вам' : task.executor_name}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${
              isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-dark-400'
            }`}>
              {isOverdue && <AlertCircle className="w-4 h-4" />}
              <Calendar className="w-4 h-4" />
              <span>
                {isDueToday 
                  ? `Сегодня, ${format(new Date(task.deadline), 'HH:mm')}`
                  : isDueTomorrow
                    ? `Завтра, ${format(new Date(task.deadline), 'HH:mm')}`
                    : format(new Date(task.deadline), 'd MMM, HH:mm', { locale: ru })
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tasks() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewingTask, setViewingTask] = useState<Task | undefined>();
  const [filter, setFilter] = useState<'all' | 'my' | 'created'>('my');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'active' | 'all'>('active');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const task = await tasksApi.create(data);
      // Загружаем файлы если есть
      if (data.files && data.files.length > 0) {
        try {
          await filesApi.upload(task.id, data.files);
        } catch (err) {
          console.error('File upload error:', err);
          toast.error('Задача создана, но некоторые файлы не загрузились');
        }
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      toast.success('Задача создана');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }) => {
      const task = await tasksApi.update(id, data);
      // Загружаем новые файлы если есть
      if (data.files && data.files.length > 0) {
        try {
          await filesApi.upload(id, data.files);
          queryClient.invalidateQueries({ queryKey: ['task-files', id] });
        } catch (err) {
          console.error('File upload error:', err);
          toast.error('Задача обновлена, но некоторые файлы не загрузились');
        }
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(undefined);
      toast.success('Задача обновлена');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка обновления');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка обновления статуса');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Задача удалена');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка удаления');
    },
  });

  const handleSave = (data: TaskFormData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (task: Task) => {
    if (confirm(`Удалить задачу "${task.title}"?`)) {
      deleteMutation.mutate(task.id);
    }
  };

  // Filter tasks
  let filteredTasks = tasks;
  
  if (filter === 'my') {
    filteredTasks = tasks.filter(t => t.executor_id === user?.id);
  } else if (filter === 'created') {
    filteredTasks = tasks.filter(t => t.customer_id === user?.id);
  }

  if (statusFilter === 'active') {
    filteredTasks = filteredTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  } else if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
  }

  // Sort: overdue first, then by deadline
  filteredTasks = [...filteredTasks].sort((a, b) => {
    const aOverdue = isPast(new Date(a.deadline)) && a.status !== 'completed';
    const bOverdue = isPast(new Date(b.deadline)) && b.status !== 'completed';
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-primary-400" />
            Задачи
          </h1>
          <p className="text-dark-400 mt-1">
            Управление задачами команды
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Новая задача
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex bg-dark-800 rounded-xl p-1">
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'my' 
                ? 'bg-primary-500 text-white' 
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Мне назначены
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'created' 
                ? 'bg-primary-500 text-white' 
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Я создал
          </button>
          {hasRole('admin') && (
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Все
            </button>
          )}
        </div>

        <div className="flex bg-dark-800 rounded-xl p-1">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'active' 
                ? 'bg-dark-600 text-white' 
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'completed' 
                ? 'bg-dark-600 text-white' 
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Завершённые
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'all' 
                ? 'bg-dark-600 text-white' 
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Все
          </button>
        </div>
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5">
              <div className="skeleton h-6 w-64 rounded mb-3" />
              <div className="skeleton h-4 w-48 rounded" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300">Нет задач</h3>
          <p className="text-dark-500 mt-1">
            {statusFilter === 'active' 
              ? 'Все задачи выполнены! 🎉' 
              : 'Создайте первую задачу'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task, index) => (
            <div key={task.id} style={{ animationDelay: `${index * 50}ms` }}>
              <TaskCard
                task={task}
                currentUserId={user?.id || ''}
                onStatusChange={(status) => statusMutation.mutate({ id: task.id, status })}
                onEdit={() => setEditingTask(task)}
                onDelete={() => handleDelete(task)}
                onView={() => setViewingTask(task)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {(showModal || editingTask) && (
        <TaskModal
          task={editingTask}
          users={users}
          currentUserId={user?.id || ''}
          onClose={() => {
            setShowModal(false);
            setEditingTask(undefined);
          }}
          onSave={handleSave}
        />
      )}

      {/* View Modal */}
      {viewingTask && (
        <TaskViewModal
          task={viewingTask}
          currentUserId={user?.id || ''}
          onClose={() => setViewingTask(undefined)}
          onEdit={() => {
            setViewingTask(undefined);
            setEditingTask(viewingTask);
          }}
          onStatusChange={(status) => {
            statusMutation.mutate({ id: viewingTask.id, status });
            setViewingTask(undefined);
          }}
        />
      )}
    </div>
  );
}

export default Tasks;

