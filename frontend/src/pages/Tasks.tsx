import React, { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckSquare, Plus, X, Calendar, User, Clock, 
  AlertCircle, PlayCircle, CheckCircle, XCircle, Edit2, Trash2,
  Eye, FileText, ArrowRight, Upload, Download, Image, Video, 
  FileArchive, File, Paperclip, Loader2, HelpCircle, Filter, Send, MessageSquare,
  GitBranch, ChevronRight, RotateCcw, ExternalLink, ArrowUp, ArrowDown
} from 'lucide-react';
import UserLink from '../components/UserLink';
import { tasksApi, authApi, filesApi, headDashboardApi, offersApi, commentsApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { Task, TaskStatus, TaskType, TaskPriority, TaskRating, Department, taskTypeLabels, taskStatusLabels, taskPriorityLabels, taskRatingLabels, departmentLabels, User as UserType, TaskFile, roleLabels } from '../types';
import GeoSelect from '../components/GeoSelect';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { formatMoscow, toMoscowTime } from '../utils/dateUtils';
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

  // URL с токеном для просмотра файла
  const getViewUrl = () => {
    const token = localStorage.getItem('token');
    return `/api/files/view/${file.id}?token=${token}`;
  };

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
                src={getViewUrl()} 
                alt={file.original_name}
                className="max-w-full max-h-[80vh] rounded-xl"
              />
            )}
            {isVideo && (
              <video 
                src={getViewUrl()}
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
  geo?: string;
  priority: TaskPriority;
  department?: Department;
  executor_id: string;
  deadline: string;
  offer_id: string;
  files?: File[];
}

function TaskModal({
  task,
  users,
  currentUserRole,
  onClose,
  onSave,
  pendingFiles,
  setPendingFiles,
}: {
  task?: Task;
  users: UserType[];
  currentUserRole: string;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLandingHelp, setShowLandingHelp] = useState(false);
  const [showCreoHelp, setShowCreoHelp] = useState(false);
  
  // Проверяем, является ли текущий пользователь руководителем отдела
  const { data: headCheck } = useQuery({
    queryKey: ['head-check'],
    queryFn: headDashboardApi.check,
  });

  // Получаем сотрудников своего отдела (если руководитель)
  const { data: myDepartmentMembers = [] } = useQuery({
    queryKey: ['head-members'],
    queryFn: headDashboardApi.getMembers,
    enabled: headCheck?.isHead,
  });

  // Загружаем офферы
  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => offersApi.getAll(),
  });

  const isHead = headCheck?.isHead;
  const myDepartmentCode = headCheck?.department?.code as Department | undefined;
  const isAdmin = currentUserRole === 'admin';

  // Получаем текущего пользователя
  const { user: currentUser } = useAuthStore();

  // Состояние "Назначить себе"
  const [assignToSelf, setAssignToSelf] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    task_type: task?.task_type || 'create_landing',
    geo: task?.geo || '',
    priority: task?.priority || 'normal',
    department: task?.department || undefined,
    executor_id: task?.executor_id || '',
    offer_id: task?.offer_id || 'none',
    deadline: task?.deadline 
      ? format(toMoscowTime(new Date(task.deadline)), "yyyy-MM-dd'T'HH:mm")
      : format(toMoscowTime(new Date(Date.now() + 24 * 60 * 60 * 1000)), "yyyy-MM-dd'T'HH:mm"),
  });

  // При включении "Назначить себе" устанавливаем executor_id
  const handleAssignToSelfChange = (checked: boolean) => {
    setAssignToSelf(checked);
    if (checked && currentUser) {
      setFormData(prev => ({ 
        ...prev, 
        executor_id: currentUser.id,
        department: undefined // Сбрасываем отдел
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        executor_id: '',
        department: undefined
      }));
    }
  };

  // Показывать выбор сотрудника только если выбран свой отдел
  const showEmployeeSelect = isHead && formData.department === myDepartmentCode;

  // Загрузка существующих файлов для редактирования
  const { data: existingFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['task-files', task?.id],
    queryFn: () => task?.id ? filesApi.getTaskFiles(task.id) : Promise.resolve([]),
    enabled: !!task?.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Базовая валидация
    if (!formData.title.trim() || !formData.deadline || !formData.geo || !formData.priority) {
      toast.error('Заполните обязательные поля');
      return;
    }

    // Если задача назначена себе - не требуем отдел
    if (assignToSelf) {
      if (!formData.executor_id) {
        toast.error('Ошибка назначения себе');
        return;
      }
    } else if (isAdmin) {
      // Админ может выбрать любого исполнителя напрямую
      if (!formData.executor_id) {
        toast.error('Выберите исполнителя');
        return;
      }
    } else {
      // Все остальные должны выбрать отдел
      if (!formData.department) {
        toast.error('Выберите отдел');
        return;
      }
      // Если это свой отдел - нужен исполнитель
      if (showEmployeeSelect && !formData.executor_id) {
        toast.error('Выберите исполнителя из своего отдела');
        return;
      }
    }
    
    // Передаём флаг assignToSelf через executor_id (если себе - он уже установлен)
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-card w-full h-full sm:h-auto sm:max-w-2xl p-4 sm:p-6 animate-scale-in sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-dark-100">
            {task ? 'Редактировать задачу' : 'Новая задача'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors p-2 -mr-2"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Тип задачи *
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as TaskType, geo: '' })}
                className="glass-input w-full"
              >
                {Object.entries(taskTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Кнопка "Назначить себе" */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-xl border border-dark-600 hover:border-primary-500/50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={assignToSelf}
                  onChange={(e) => handleAssignToSelfChange(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                />
                <div>
                  <span className="text-sm font-medium text-dark-200">Назначить себе</span>
                  <p className="text-xs text-dark-500">Задача будет назначена вам</p>
                </div>
              </label>
            </div>
          </div>

          {/* Выбор отдела/исполнителя - только если не назначено себе */}
          {!assignToSelf && (
            <div>
              {isAdmin ? (
                /* Админ выбирает исполнителя напрямую */
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
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({roleLabels[u.role]})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Все остальные выбирают отдел */
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Отдел *
                  </label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => {
                      const dept = e.target.value as Department;
                      setFormData({ 
                        ...formData, 
                        department: dept,
                        // Сбрасываем исполнителя при смене отдела
                        executor_id: ''
                      });
                    }}
                    className="glass-input w-full"
                  >
                    <option value="">Выберите отдел...</option>
                    {Object.entries(departmentLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                        {isHead && value === myDepartmentCode && ' (мой отдел)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Выбор сотрудника - только если руководитель выбрал свой отдел и не назначено себе */}
          {!assignToSelf && showEmployeeSelect && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Назначить сотруднику *
              </label>
              <select
                value={formData.executor_id}
                onChange={(e) => setFormData({ ...formData, executor_id: e.target.value })}
                className="glass-input w-full"
              >
                <option value="">Выберите сотрудника...</option>
                {myDepartmentMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
              Описание
              {formData.task_type === 'create_landing' && (
                <button
                  type="button"
                  onClick={() => setShowLandingHelp(true)}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                  title="Показать пример описания"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
              {formData.task_type === 'prepare_creatives' && (
                <button
                  type="button"
                  onClick={() => setShowCreoHelp(true)}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                  title="Показать пример описания"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input w-full h-24 resize-none"
              placeholder={
                formData.task_type === 'create_landing' 
                  ? "Укажите название оффера, ссылку на промо, требования к лендингу..."
                  : formData.task_type === 'prepare_creatives'
                    ? "Укажите оффер, формат видео, тип воронки, язык озвучки..."
                    : "Подробное описание задачи..."
              }
            />
          </div>

          {/* Оффер */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Оффер *
            </label>
            <select
              value={formData.offer_id}
              onChange={(e) => setFormData({ ...formData, offer_id: e.target.value })}
              className="glass-input w-full"
            >
              <option value="none">Не про оффер</option>
              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name} {offer.geo ? `[${offer.geo.toUpperCase()}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Landing Help Modal */}
          {showLandingHelp && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setShowLandingHelp(false)}
            >
              <div 
                className="glass-card w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary-400" />
                    Как заполнить задачу "Завести ленд"
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowLandingHelp(false)}
                    className="text-dark-400 hover:text-dark-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-dark-100 mb-2">📝 Пример описания:</h4>
                    <div className="bg-dark-700/50 rounded-lg p-3 text-dark-300 border border-dark-600">
                      <p><strong>Оффер:</strong> Casino Vulkan</p>
                      <p><strong>ПП:</strong> LemonAd</p>
                      <p><strong>Ссылка на промо:</strong> https://promo.example.com/vulkan</p>
                      <p><strong>Требования:</strong></p>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        <li>Адаптив под мобильные</li>
                        <li>Прелендинг в стиле новостного сайта</li>
                        <li>Кнопка регистрации с якорем</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-dark-100 mb-2">📁 Требования к файлам:</h4>
                    <div className="space-y-2 text-dark-300">
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span>
                          <strong>Изображения:</strong>только форматы PNG, WebP, SVG (до 2 МБ каждый файл).{' '}
                          <Link to="/tools/image-converter" className="text-primary-400 hover:text-primary-300 underline">
                            Конвертировать в WebP →
                          </Link>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Видео:</strong>только формат mp4 (до 80 МБ каждый файл)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Архивы:</strong> ZIP, RAR, 7z (исходники, макеты)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Документы:</strong> PDF, DOC, TXT (ТЗ, описания)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400">💡</span>
                        <span>Если есть готовые макеты в Figma/PSD — предоставьте ссылку</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-dark-100 mb-2">⚠️ Важно указать:</h4>
                    <ul className="list-disc list-inside text-dark-300 space-y-1">
                      <li>Название оффера и партнёрку</li>
                      <li>Ссылку на промо-материалы</li>
                      <li>GEO (страну) для локализации</li>
                      <li>Цену товара</li>
                      <li>Особые требования к дизайну</li>
                      <li>Сроки и приоритет</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLandingHelp(false)}
                  className="btn-primary w-full mt-6"
                >
                  Понятно
                </button>
              </div>
            </div>
          )}

          {/* Creo Help Modal */}
          {showCreoHelp && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setShowCreoHelp(false)}
            >
              <div 
                className="glass-card w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary-400" />
                    Как заполнить задачу "Подготовить крео"
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreoHelp(false)}
                    className="text-dark-400 hover:text-dark-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-dark-100 mb-2">📝 Что указать в описании:</h4>
                    <div className="bg-dark-700/50 rounded-lg p-3 text-dark-300 border border-dark-600 space-y-2">
                      <p><strong>1. Оффер и тематика:</strong> название оффера + тематика продукта</p>
                      <p><strong>2. Формат видео:</strong> вертикаль/горизонталь/квадрат (9:16, 1:1, 16:9)</p>
                      <p><strong>3. Хронометраж:</strong> длительность видеоряда (15 сек, 30 сек, 60 сек)</p>
                      <p><strong>4. Тип воронки:</strong> нарезка кадров / дипфейк / история героя / новости / тизеры</p>
                      <p><strong>5. Язык и GEO:</strong> язык озвучки и особенности локализации</p>
                      <p><strong>6. Важные детали:</strong> специальные вставки, акценты, CTA</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-dark-100 mb-2">🎤 Дополнительно приложить:</h4>
                    <div className="space-y-2 text-dark-300">
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Текст для озвучки</strong> — готовый скрипт</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Селеб/спикер</strong> — с прикреплённым исходником</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-dark-100 mb-2">📁 Обязательные файлы:</h4>
                    <div className="space-y-2 text-dark-300">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <span><strong>Исходники</strong> — видео, фото материалы для монтажа</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-400">⚠️</span>
                        <span><strong>Примеры</strong> — референсы готовых крео для понимания стиля</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400">💡</span>
                        <span>Чем больше материалов — тем лучше результат!</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
                    <p className="text-primary-400 text-xs">
                      💡 <strong>Совет:</strong> Обязательно прикрепите исходники или примеры для лучшего выполнения ТЗ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreoHelp(false)}
                  className="btn-primary w-full mt-6"
                >
                  Понятно
                </button>
              </div>
            </div>
          )}

          {/* GEO and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                GEO (страна) *
              </label>
              <GeoSelect
                value={formData.geo || ''}
                onChange={(geo) => setFormData({ ...formData, geo })}
                placeholder="Выберите страну..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Приоритет *
              </label>
              <div className="flex gap-2">
                {(['high', 'normal', 'low'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                      formData.priority === p
                        ? p === 'high'
                          ? 'bg-red-500 text-white border-red-500'
                          : p === 'normal'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-500 text-white border-gray-500'
                        : 'bg-dark-700/50 text-dark-400 border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    {taskPriorityLabels[p]}
                  </button>
                ))}
              </div>
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
                accept="image/*,video/*,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/gzip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.zip,.rar,.7z,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt"
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

// Модальное окно завершения задачи с загрузкой результатов
function CompleteTaskModal({
  task,
  onClose,
  onComplete,
}: {
  task: Task;
  onClose: () => void;
  onComplete: (files: File[], comment: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [completionComment, setCompletionComment] = useState('');

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

  const handleSubmit = () => {
    onComplete(pendingFiles, completionComment);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Завершение задачи
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-dark-300 text-sm mb-4">
          Задача: <span className="text-dark-100 font-medium">#{task.task_number} {task.title}</span>
        </p>

        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 mb-4">
          <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Результаты работы
          </h3>
          <p className="text-xs text-dark-500 mb-3">
            Приложите файлы с результатами выполнения задачи (лендинги, креативы, архивы и т.д.)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/gzip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.zip,.rar,.7z,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-dark-600 rounded-xl text-dark-400 hover:border-primary-500/50 hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Выбрать файлы
          </button>

          {pendingFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {pendingFiles.map((file, index) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                    <Icon className="w-4 h-4 text-green-400" />
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
        </div>

        {/* Комментарий к завершению */}
        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 mb-4">
          <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Комментарий
          </h3>
          <p className="text-xs text-dark-500 mb-3">
            Добавьте комментарий, ссылку или описание результата (необязательно)
          </p>
          <textarea
            value={completionComment}
            onChange={(e) => setCompletionComment(e.target.value)}
            placeholder="Ссылка на результат, описание выполненной работы..."
            className="glass-input w-full resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {pendingFiles.length > 0 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Завершить (+{pendingFiles.length})
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Без вложений
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Модальное окно возврата на доработку
function RevisionModal({
  task,
  onClose,
  onSubmit,
  isLoading,
}: {
  task: Task;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  isLoading: boolean;
}) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Укажите причину возврата на доработку');
      return;
    }
    onSubmit(comment.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-400" />
            Возврат на доработку
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-dark-300 text-sm mb-4">
          Задача: <span className="text-dark-100 font-medium">#{task.task_number} {task.title}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 mb-4">
            <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Причина возврата *
            </h3>
            <p className="text-xs text-dark-500 mb-3">
              Опишите, что нужно доработать или исправить
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Что нужно исправить..."
              className="glass-input w-full resize-none"
              rows={4}
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              disabled={isLoading || !comment.trim()}
            >
              <RotateCcw className="w-4 h-4" />
              {isLoading ? 'Отправка...' : 'Вернуть на доработку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно запроса уточнения (исполнитель -> заказчик)
function ClarificationModal({
  task,
  onClose,
  onSubmit,
  isLoading,
}: {
  task: Task;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  isLoading: boolean;
}) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Укажите что требует уточнения');
      return;
    }
    onSubmit(comment.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            Запрос уточнения
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-dark-300 text-sm mb-4">
          Задача: <span className="text-dark-100 font-medium">#{task.task_number} {task.title}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 mb-4">
            <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Что требует уточнения *
            </h3>
            <p className="text-xs text-dark-500 mb-3">
              Опишите, какая информация вам нужна для выполнения задачи
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Какая информация вам нужна..."
              className="glass-input w-full resize-none"
              rows={4}
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              disabled={isLoading || !comment.trim()}
            >
              <HelpCircle className="w-4 h-4" />
              {isLoading ? 'Отправка...' : 'Запросить уточнение'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно создания подзадачи
function SubtaskModal({
  parentTask,
  onClose,
  onSave,
}: {
  parentTask: Task;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    task_type: TaskType;
    geo?: string;
    priority: TaskPriority;
    department: Department;
    deadline: string;
  }) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other' as TaskType,
    geo: parentTask.geo || '',
    priority: 'normal' as TaskPriority,
    department: '' as Department | '',
    deadline: format(toMoscowTime(new Date(Date.now() + 24 * 60 * 60 * 1000)), "yyyy-MM-dd'T'HH:mm"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.deadline || !formData.department) {
      toast.error('Заполните обязательные поля');
      return;
    }

    onSave({
      ...formData,
      department: formData.department as Department,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass-card w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary-400" />
            Создать подзадачу
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-700/50 mb-4">
          <p className="text-xs text-dark-500 mb-1">Родительская задача:</p>
          <p className="text-dark-200 font-medium">
            {parentTask.task_number && <span className="text-primary-400">#{parentTask.task_number}</span>}{' '}
            {parentTask.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Заголовок <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-input w-full"
              placeholder="Например: Подготовить GIF для ленда"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input w-full resize-none"
              rows={3}
              placeholder="Подробности подзадачи..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Тип задачи
              </label>
              <select
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as TaskType })}
                className="glass-input w-full"
              >
                {Object.entries(taskTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Приоритет
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="glass-input w-full"
              >
                {Object.entries(taskPriorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Отдел <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
              className="glass-input w-full"
            >
              <option value="">Выберите отдел...</option>
              {Object.entries(departmentLabels).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <p className="text-xs text-dark-500 mt-1">
              Подзадача будет назначена руководителю выбранного отдела
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              GEO
            </label>
            <GeoSelect
              value={formData.geo}
              onChange={(value) => setFormData({ ...formData, geo: value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Дедлайн <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="glass-input w-full"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <GitBranch className="w-4 h-4" />
              Создать подзадачу
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
  onCompleteWithFiles,
}: {
  task: Task;
  currentUserId: string;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onCompleteWithFiles: (files: File[], comment: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAssignSelect, setShowAssignSelect] = useState(false);
  const [selectedExecutors, setSelectedExecutors] = useState<string[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [showStartWorkModal, setShowStartWorkModal] = useState(false);

  // Отмечаем просмотр задачи исполнителем при открытии
  React.useEffect(() => {
    if (task.executor_id === currentUserId) {
      tasksApi.markViewed(task.id).catch(() => {
        // Игнорируем ошибки — это некритичная функция
      });
    }
  }, [task.id, task.executor_id, currentUserId]);

  // Обработчик закрытия модалки с проверкой статуса
  const handleClose = () => {
    // Если я исполнитель и задача в статусе "Ожидает" — показываем попап
    if (task.executor_id === currentUserId && task.status === 'pending') {
      setShowStartWorkModal(true);
    } else {
      onClose();
    }
  };

  // Проверяем, является ли пользователь руководителем
  const { data: headCheck } = useQuery({
    queryKey: ['head-check'],
    queryFn: headDashboardApi.check,
  });

  // Загружаем сотрудников отдела (если руководитель)
  const { data: departmentMembers = [] } = useQuery({
    queryKey: ['head-members'],
    queryFn: headDashboardApi.getMembers,
    enabled: headCheck?.isHead,
  });

  // Мутация для назначения задачи (одному или нескольким сотрудникам)
  const reassignMutation = useMutation({
    mutationFn: (executorIds: string[]) => headDashboardApi.assignMultiple(task.id, executorIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['head-tasks'] });
      setShowAssignSelect(false);
      setSelectedExecutors([]);
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка назначения');
    },
  });

  // Переключение выбора сотрудника
  const toggleExecutorSelection = (userId: string) => {
    setSelectedExecutors(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueToday = isToday(new Date(task.deadline));
  const canChangeStatus = task.customer_id === currentUserId || task.executor_id === currentUserId;
  const canEdit = task.customer_id === currentUserId;
  const canUpload = task.customer_id === currentUserId || task.executor_id === currentUserId;
  const isMyTask = task.executor_id === currentUserId;
  const isMyCreatedTask = task.customer_id === currentUserId;
  
  // Исполнитель может создавать подзадачи, если задача не является подзадачей и не завершена/отменена
  const canCreateSubtask = isMyTask && !task.parent_task_id && task.status !== 'completed' && task.status !== 'cancelled';
  const isSubtask = !!task.parent_task_id;

  // Руководитель может переназначить задачу, если она назначена на него и не завершена
  const canReassign = headCheck?.isHead && isMyTask && task.status !== 'completed' && task.status !== 'cancelled';

  // Заказчик может оценить выполненную задачу
  const canRate = isMyCreatedTask && task.status === 'completed' && !task.rating;

  // Заказчик может вернуть выполненную задачу на доработку
  const canReturnToRevision = isMyCreatedTask && task.status === 'completed';

  // Исполнитель может запросить уточнение у заказчика
  const canRequestClarification = isMyTask && (task.status === 'pending' || task.status === 'in_progress');

  // Мутация для оценки задачи
  const rateMutation = useMutation({
    mutationFn: (rating: TaskRating) => tasksApi.rate(task.id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Оценка сохранена');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка оценки');
    },
  });

  // Мутация для возврата на доработку
  const revisionMutation = useMutation({
    mutationFn: (comment: string) => tasksApi.returnToRevision(task.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setShowRevisionModal(false);
      toast.success('Задача возвращена на доработку');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка возврата на доработку');
    },
  });

  // Мутация для запроса уточнения
  const clarificationMutation = useMutation({
    mutationFn: (comment: string) => tasksApi.requestClarification(task.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setShowClarificationModal(false);
      toast.success('Запрос на уточнение отправлен заказчику');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка отправки запроса');
    },
  });

  // Загрузка файлов задачи
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['task-files', task.id],
    queryFn: () => filesApi.getTaskFiles(task.id),
  });

  // Загрузка подзадач (только для родительских задач)
  const { data: subtasks = [], isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', task.id],
    queryFn: () => tasksApi.getSubtasks(task.id),
    enabled: !task.parent_task_id, // Не загружаем подзадачи для подзадач
  });

  // Мутация для создания подзадачи
  const createSubtaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      task_type: TaskType;
      geo?: string;
      priority: TaskPriority;
      department: Department;
      deadline: string;
    }) => tasksApi.createSubtask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowSubtaskModal(false);
      toast.success('Подзадача создана');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Ошибка создания подзадачи');
    },
  });

  // Загрузка комментариев
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['task-comments', task.id],
    queryFn: () => commentsApi.getTaskComments(task.id),
  });

  // Состояние для нового комментария
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Добавление комментария
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await commentsApi.add(task.id, newComment.trim());
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setNewComment('');
      toast.success('Комментарий добавлен');
    } catch {
      toast.error('Ошибка добавления комментария');
    } finally {
      setIsSubmittingComment(false);
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

  // Для проверки авторства комментариев
  const { user: currentUserData } = useAuthStore();

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-card w-full h-full sm:h-auto sm:max-w-2xl p-0 animate-scale-in sm:max-h-[90vh] overflow-hidden flex flex-col sm:rounded-2xl rounded-none">
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b border-dark-700 ${isOverdue ? 'bg-red-500/5' : isDueToday ? 'bg-yellow-500/5' : ''}`}>
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {taskStatusLabels[task.status]}
                </span>
                <span className="px-2 py-1 bg-dark-700/50 text-dark-300 text-xs rounded">
                  {taskTypeLabels[task.task_type]}
                </span>
              </div>
              <h2 className={`text-lg sm:text-2xl font-bold ${task.status === 'completed' ? 'text-dark-400 line-through' : 'text-dark-100'}`}>
                {task.task_number && <span className="text-primary-400">#{task.task_number}</span>} {task.title}
                {task.geo && task.geo !== 'any' && <span className="ml-2 text-xs sm:text-sm font-normal text-dark-400 bg-dark-700/50 px-2 py-0.5 rounded">{task.geo.toUpperCase()}</span>}
              </h2>
              {task.offer_name && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/offers?search=${encodeURIComponent(task.offer_name)}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 text-xs sm:text-sm rounded border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📦 Оффер: {task.offer_name}
                  </Link>
                  {task.offer_promo_link && (
                    <a
                      href={task.offer_promo_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs sm:text-sm rounded border border-green-500/30 hover:bg-green-500/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Промо
                    </a>
                  )}
                </div>
              )}
              {/* Индикатор подзадачи */}
              {isSubtask && task.parent_task_title && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 text-xs sm:text-sm rounded border border-orange-500/30">
                    <GitBranch className="w-3 h-3" />
                    Подзадача к #{task.parent_task_number}: {task.parent_task_title}
                  </span>
                </div>
              )}
              {/* Счётчик подзадач */}
              {!isSubtask && (task.subtasks_count ?? 0) > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs sm:text-sm rounded border border-blue-500/30">
                    <GitBranch className="w-3 h-3" />
                    Подзадач: {task.subtasks_completed ?? 0}/{task.subtasks_count}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-dark-400 hover:text-dark-200 transition-colors p-2 hover:bg-dark-700/50 rounded-lg flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Description */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm font-medium text-dark-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Описание
            </h3>
            <div className="bg-dark-800/50 rounded-xl p-3 sm:p-4 border border-dark-700/50">
              {task.description ? (
                <p className="text-dark-200 whitespace-pre-wrap break-all text-sm sm:text-base">{task.description}</p>
              ) : (
                <p className="text-dark-500 italic text-sm">Описание не указано</p>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-dark-800/50 rounded-xl p-3 sm:p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-2">Заказчик</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {task.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-dark-100 truncate text-sm sm:text-base">
                    {isMyCreatedTask ? 'Вы' : (
                      <UserLink 
                        name={task.customer_name || ''} 
                        username={task.customer_username}
                      />
                    )}
                  </p>
                  <p className="text-xs text-dark-500">создал задачу</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-3 sm:p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-2">Исполнитель</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {task.executor_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-dark-100 truncate text-sm sm:text-base">
                    {isMyTask ? 'Вы' : (
                      <UserLink 
                        name={task.executor_name || ''} 
                        username={task.executor_username}
                      />
                    )}
                  </p>
                  <p className="text-xs text-dark-500">выполняет задачу</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-dark-800/50 rounded-xl p-3 sm:p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-1">Создано</h3>
              <p className="text-dark-200 font-medium text-sm sm:text-base">
                {formatMoscow(new Date(task.created_at), 'd MMM yyyy')}
              </p>
              <p className="text-xs text-dark-500">
                {formatMoscow(new Date(task.created_at), 'HH:mm')}
              </p>
            </div>

            <div className={`rounded-xl p-3 sm:p-4 border ${isOverdue ? 'bg-red-500/10 border-red-500/30' : isDueToday ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-dark-800/50 border-dark-700/50'}`}>
              <h3 className="text-xs font-medium text-dark-500 mb-1 flex items-center gap-1">
                {isOverdue && <AlertCircle className="w-3 h-3 text-red-400" />}
                Дедлайн
              </h3>
              <p className={`font-medium text-sm sm:text-base ${isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-dark-200'}`}>
                {formatMoscow(new Date(task.deadline), 'd MMM yyyy')}
              </p>
              <p className={`text-xs ${isOverdue ? 'text-red-400/70' : 'text-dark-500'}`}>
                {formatMoscow(new Date(task.deadline), 'HH:mm')}
              </p>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-3 sm:p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-1">Завершено</h3>
              {task.completed_at ? (
                <>
                  <p className="text-green-400 font-medium text-sm sm:text-base">
                    {formatMoscow(new Date(task.completed_at), 'd MMM yyyy')}
                  </p>
                  <p className="text-xs text-dark-500">
                    {formatMoscow(new Date(task.completed_at), 'HH:mm')}
                  </p>
                </>
              ) : (
                <p className="text-dark-500 italic text-sm">Ещё не завершено</p>
              )}
            </div>
          </div>

          {/* Files section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-sm font-medium text-dark-400 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline">Файлы ({files.length})</span>
                <span className="sm:hidden">({files.length})</span>
              </h3>
              {canUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/gzip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.zip,.rar,.7z,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-primary-500/10 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{isUploading ? 'Загрузка...' : 'Загрузить'}</span>
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
              <div className="space-y-4">
                {/* Вложения к задаче */}
                {files.filter(f => !f.is_result).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-dark-500 mb-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Вложения к задаче ({files.filter(f => !f.is_result).length})
                    </h4>
                    <div className="space-y-2">
                      {files.filter(f => !f.is_result).map((file) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          onDelete={() => handleDeleteFile(file.id)}
                          canDelete={file.uploaded_by === currentUserId || task.customer_id === currentUserId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Результаты работы */}
                {files.filter(f => f.is_result).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Результаты работы ({files.filter(f => f.is_result).length})
                    </h4>
                    <div className="space-y-2">
                      {files.filter(f => f.is_result).map((file) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          onDelete={() => handleDeleteFile(file.id)}
                          canDelete={file.uploaded_by === currentUserId || task.customer_id === currentUserId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Если все файлы одного типа - показываем их без категоризации */}
                {files.filter(f => !f.is_result).length === 0 && files.filter(f => f.is_result).length === 0 && (
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
            )}
          </div>

          {/* Подзадачи (только для родительских задач) */}
          {!isSubtask && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm font-medium text-dark-400 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Подзадачи ({subtasks.length})
                </h3>
                {canCreateSubtask && (
                  <button
                    onClick={() => setShowSubtaskModal(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Создать подзадачу</span>
                    <span className="sm:hidden">Добавить</span>
                  </button>
                )}
              </div>
              
              {subtasksLoading ? (
                <div className="skeleton h-16 rounded-xl" />
              ) : subtasks.length === 0 ? (
                <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700/50 text-center">
                  <GitBranch className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                  <p className="text-dark-500 text-sm">Нет подзадач</p>
                  {canCreateSubtask && (
                    <p className="text-dark-600 text-xs mt-1">
                      Создайте подзадачу, если вам нужна помощь другого отдела
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {subtasks.map((subtask) => {
                    const subtaskIsOverdue = isPast(new Date(subtask.deadline)) && subtask.status !== 'completed' && subtask.status !== 'cancelled';
                    return (
                      <div 
                        key={subtask.id}
                        className={`p-3 bg-dark-800/50 rounded-xl border transition-colors cursor-pointer hover:border-primary-500/30 ${
                          subtaskIsOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-dark-700/50'
                        }`}
                        onClick={() => {
                          onClose();
                          // Открыть подзадачу через небольшую задержку
                          setTimeout(() => {
                            const event = new CustomEvent('openTask', { detail: { taskId: subtask.id } });
                            window.dispatchEvent(event);
                          }, 100);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              subtask.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              subtask.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              subtask.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {taskStatusLabels[subtask.status]}
                            </span>
                            <span className="text-dark-200 truncate text-sm">
                              {subtask.task_number && <span className="text-primary-400">#{subtask.task_number}</span>} {subtask.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {subtask.department && (
                              <span className="text-xs text-dark-500 hidden sm:inline">
                                {departmentLabels[subtask.department]}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-dark-500" />
                          </div>
                        </div>
                        {subtask.executor_name && (
                          <p className="text-xs text-dark-500 mt-1 pl-[60px]">
                            Исполнитель: {subtask.executor_name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reassign task (для руководителей) */}
          {canReassign && (
            <div className="bg-orange-500/10 rounded-xl p-3 sm:p-4 border border-orange-500/30 mb-4 sm:mb-6">
              <h3 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Назначить задачу сотрудникам
              </h3>
              {!showAssignSelect ? (
                <button
                  onClick={() => setShowAssignSelect(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Назначить сотрудникам отдела
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-dark-400">
                    Выберите одного или нескольких сотрудников. При выборе нескольких будут созданы копии задачи для каждого.
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-dark-800/50 rounded-lg p-2">
                    {departmentMembers.map((m) => (
                      <label 
                        key={m.user_id} 
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedExecutors.includes(m.user_id) 
                            ? 'bg-primary-500/20 border border-primary-500/40' 
                            : 'hover:bg-dark-700/50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExecutors.includes(m.user_id)}
                          onChange={() => toggleExecutorSelection(m.user_id)}
                          className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {m.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-dark-200 truncate">{m.user_name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedExecutors.length > 0 && (
                    <p className="text-xs text-primary-400">
                      Выбрано: {selectedExecutors.length} {selectedExecutors.length === 1 ? 'сотрудник' : 
                        selectedExecutors.length < 5 ? 'сотрудника' : 'сотрудников'}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAssignSelect(false);
                        setSelectedExecutors([]);
                      }}
                      className="btn-secondary flex-1"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => selectedExecutors.length > 0 && reassignMutation.mutate(selectedExecutors)}
                      disabled={selectedExecutors.length === 0 || reassignMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {reassignMutation.isPending ? 'Назначаем...' : 
                        selectedExecutors.length > 1 ? `Назначить (${selectedExecutors.length})` : 'Назначить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Комментарии */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-dark-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Комментарии ({comments.length})
              </h3>
            </div>

            {commentsLoading ? (
              <div className="skeleton h-16 rounded-xl" />
            ) : (
              <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50 space-y-3">
                {/* Список комментариев */}
                {comments.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
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
                          {(comment.user_id === currentUserData?.id || currentUserData?.role === 'admin') && (
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

                {comments.length === 0 && (
                  <p className="text-dark-500 text-sm text-center py-2">Нет комментариев</p>
                )}

                {/* Форма добавления комментария */}
                <div className="flex gap-2 pt-2 border-t border-dark-700/50">
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
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="self-end px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-dark-600">Ctrl+Enter для отправки</p>
              </div>
            )}
          </div>

          {/* Rating (для выполненных задач) */}
          {task.status === 'completed' && (
            <div className={`rounded-xl p-3 sm:p-4 border mb-4 sm:mb-6 ${
              task.rating 
                ? 'bg-dark-800/50 border-dark-700/50' 
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <h3 className="text-sm font-medium text-dark-400 mb-3">
                {task.rating ? 'Оценка результата' : 'Оцените результат'}
              </h3>
              {task.rating ? (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-medium ${
                  task.rating === 'bad' ? 'bg-red-500/20 text-red-400' :
                  task.rating === 'ok' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {taskRatingLabels[task.rating]}
                </div>
              ) : canRate ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => rateMutation.mutate('bad')}
                    disabled={rateMutation.isPending}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <span className="text-2xl">👎</span>
                    <span className="text-xs font-medium">Дно</span>
                  </button>
                  <button
                    onClick={() => rateMutation.mutate('ok')}
                    disabled={rateMutation.isPending}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    <span className="text-2xl">👍</span>
                    <span className="text-xs font-medium">Норм</span>
                  </button>
                  <button
                    onClick={() => rateMutation.mutate('top')}
                    disabled={rateMutation.isPending}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <span className="text-2xl">🔥</span>
                    <span className="text-xs font-medium">Топ</span>
                  </button>
                </div>
              ) : (
                <p className="text-dark-500 text-sm italic">Ожидает оценки от заказчика</p>
              )}

              {/* Кнопка возврата на доработку */}
              {canReturnToRevision && (
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Вернуть на доработку
                </button>
              )}
            </div>
          )}

          {/* Status change */}
          {canChangeStatus && task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="bg-dark-800/50 rounded-xl p-3 sm:p-4 border border-dark-700/50">
              <h3 className="text-xs font-medium text-dark-500 mb-3">Изменить статус</h3>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {task.status !== 'pending' && (
                  <button
                    onClick={() => onStatusChange('pending')}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors text-xs sm:text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Ожидает</span>
                  </button>
                )}
                {task.status !== 'in_progress' && (
                  <button
                    onClick={() => onStatusChange('in_progress')}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-xs sm:text-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">В работе</span>
                  </button>
                )}
                {/* Кнопка "Завершить" - только для исполнителя открывает модальное окно */}
                {isMyTask ? (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors text-xs sm:text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Завершить</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusChange('completed')}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors text-xs sm:text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Завершить</span>
                  </button>
                )}
                <button
                  onClick={() => onStatusChange('cancelled')}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-xs sm:text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Отменить</span>
                </button>
              </div>

              {/* Кнопка запроса уточнения (для исполнителя) */}
              {canRequestClarification && (
                <button
                  onClick={() => setShowClarificationModal(true)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  Запросить уточнение
                </button>
              )}
            </div>
          )}
        </div>

        {/* Модальное окно завершения задачи */}
        {showCompleteModal && (
          <CompleteTaskModal
            task={task}
            onClose={() => setShowCompleteModal(false)}
            onComplete={(files, comment) => {
              setShowCompleteModal(false);
              onCompleteWithFiles(files, comment);
            }}
          />
        )}

        {/* Модальное окно возврата на доработку */}
        {showRevisionModal && (
          <RevisionModal
            task={task}
            onClose={() => setShowRevisionModal(false)}
            onSubmit={(comment) => revisionMutation.mutate(comment)}
            isLoading={revisionMutation.isPending}
          />
        )}

        {/* Модальное окно запроса уточнения */}
        {showClarificationModal && (
          <ClarificationModal
            task={task}
            onClose={() => setShowClarificationModal(false)}
            onSubmit={(comment) => clarificationMutation.mutate(comment)}
            isLoading={clarificationMutation.isPending}
          />
        )}

        {/* Модальное окно создания подзадачи */}
        {showSubtaskModal && (
          <SubtaskModal
            parentTask={task}
            onClose={() => setShowSubtaskModal(false)}
            onSave={(data) => createSubtaskMutation.mutate(data)}
          />
        )}

        {/* Модальное окно "Начать работу?" */}
        {showStartWorkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="glass-card w-full max-w-md p-6 animate-scale-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-dark-100 mb-2">Начать работу над задачей?</h3>
                <p className="text-dark-400 text-sm">
                  Задача всё ещё в статусе "Ожидает". Хотите изменить статус на "В работе"?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStartWorkModal(false);
                    onClose();
                  }}
                  className="btn-secondary flex-1"
                >
                  Нет, позже
                </button>
                <button
                  onClick={() => {
                    onStatusChange('in_progress');
                    setShowStartWorkModal(false);
                    onClose();
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Да, начать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 flex gap-3">
          <button onClick={handleClose} className="btn-secondary flex-1 text-sm sm:text-base">
            Закрыть
          </button>
          {canEdit && (
            <button onClick={onEdit} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm sm:text-base">
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Редактировать</span>
              <span className="sm:hidden">Изменить</span>
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
      className={`glass-card p-3 sm:p-5 animate-fade-in transition-all cursor-pointer hover:border-primary-500/30 ${
        isOverdue 
          ? 'border-red-500/30 bg-red-500/5' 
          : isDueToday 
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : ''
      }`}
      onClick={onView}
    >
      {/* Mobile: Status badge at top */}
      <div className="sm:hidden flex items-center justify-between gap-2 mb-3">
        <span className={`status-badge status-${task.status}`}>
          {taskStatusLabels[task.status]}
        </span>
        <div className={`flex items-center gap-1 text-xs ${
          isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-dark-400'
        }`}>
          {isOverdue && <AlertCircle className="w-3 h-3" />}
          <Calendar className="w-3 h-3" />
          <span>
            {isDueToday 
              ? formatMoscow(new Date(task.deadline), 'HH:mm')
              : isDueTomorrow
                ? 'Завтра'
                : formatMoscow(new Date(task.deadline), 'd MMM')
            }
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 sm:gap-4">
        {/* Status buttons - hidden on mobile */}
        <div className="hidden sm:flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
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
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base sm:text-lg truncate ${
                task.status === 'completed' ? 'text-dark-400 line-through' : 'text-dark-100'
              }`}>
                {task.task_number && <span className="text-primary-400 mr-1">#{task.task_number}</span>}
                {task.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-dark-700/50 text-dark-300 text-xs rounded">
                  {taskTypeLabels[task.task_type]}
                </span>
                {task.offer_name && (
                  <>
                    <Link
                      to={`/offers?search=${encodeURIComponent(task.offer_name)}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📦 {task.offer_name}
                    </Link>
                    {task.offer_promo_link && (
                      <a
                        href={task.offer_promo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30 hover:bg-green-500/20 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Промо
                      </a>
                    )}
                  </>
                )}
                {task.geo && task.geo !== 'any' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30">
                    {task.geo.toUpperCase()}
                  </span>
                )}
                {task.priority && task.priority !== 'normal' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${
                    task.priority === 'high' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {taskPriorityLabels[task.priority]}
                  </span>
                )}
                {task.rating && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${
                    task.rating === 'bad' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    task.rating === 'ok' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {taskRatingLabels[task.rating]}
                  </span>
                )}
                {/* Индикатор подзадачи */}
                {task.parent_task_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded border border-orange-500/30">
                    <GitBranch className="w-3 h-3" />
                    Подзадача
                  </span>
                )}
                {/* Счётчик подзадач */}
                {!task.parent_task_id && (task.subtasks_count ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30">
                    <GitBranch className="w-3 h-3" />
                    {task.subtasks_completed ?? 0}/{task.subtasks_count}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onView}
                className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                title="Открыть задачу"
              >
                <Eye className="w-4 h-4" />
              </button>
              {canEdit && (
                <>
                  <button
                    onClick={onEdit}
                    className="hidden sm:block p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="hidden sm:block p-2 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-dark-400 text-sm mt-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-dark-500" />
              <span className="text-dark-400 flex items-center gap-0.5">
                {isMyCreatedTask ? 'Вы' : (
                  <>
                    {task.customer_name?.split(' ')[0]}
                    {task.customer_username && task.customer_username !== 'admin' && (
                      <a
                        href={`https://t.me/${task.customer_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors ml-0.5"
                        onClick={(e) => e.stopPropagation()}
                        title={`@${task.customer_username}`}
                      >
                        <Send className="w-3 h-3" />
                      </a>
                    )}
                  </>
                )}
                <ArrowRight className="w-3 h-3 mx-0.5 sm:mx-1 text-dark-600" />
                {isMyTask ? 'Вам' : (
                  <>
                    {task.executor_name?.split(' ')[0]}
                    {task.executor_username && task.executor_username !== 'admin' && (
                      <a
                        href={`https://t.me/${task.executor_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors ml-0.5"
                        onClick={(e) => e.stopPropagation()}
                        title={`@${task.executor_username}`}
                      >
                        <Send className="w-3 h-3" />
                      </a>
                    )}
                  </>
                )}
              </span>
            </div>
            
            {/* Desktop deadline */}
            <div className={`hidden sm:flex items-center gap-2 ${
              isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-dark-400'
            }`}>
              {isOverdue && <AlertCircle className="w-4 h-4" />}
              <Calendar className="w-4 h-4" />
              <span>
                {isDueToday 
                  ? `Сегодня, ${formatMoscow(new Date(task.deadline), 'HH:mm')}`
                  : isDueTomorrow
                    ? `Завтра, ${formatMoscow(new Date(task.deadline), 'HH:mm')}`
                    : formatMoscow(new Date(task.deadline), 'd MMM, HH:mm')
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewingTask, setViewingTask] = useState<Task | undefined>();
  const [filter, setFilter] = useState<'all' | 'my' | 'created'>('my');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'active' | 'all'>('active');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Обработчик открытия задачи по URL-параметру
  React.useEffect(() => {
    const taskId = searchParams.get('task');
    const isNew = searchParams.get('new');
    
    if (isNew === '1') {
      setShowModal(true);
      setEditingTask(undefined);
      setSearchParams({}, { replace: true });
      return;
    }
    
    if (taskId) {
      (async () => {
        try {
          const task = await tasksApi.getById(taskId);
          setViewingTask(task);
          // Очищаем параметр из URL
          setSearchParams({}, { replace: true });
        } catch {
          toast.error('Задача не найдена');
          setSearchParams({}, { replace: true });
        }
      })();
    }
  }, [searchParams, setSearchParams]);

  // Обработчик события openTask (для открытия подзадач)
  React.useEffect(() => {
    const handleOpenTask = async (event: Event) => {
      const customEvent = event as CustomEvent<{ taskId: string }>;
      try {
        const task = await tasksApi.getById(customEvent.detail.taskId);
        setViewingTask(task);
      } catch {
        toast.error('Ошибка загрузки задачи');
      }
    };

    window.addEventListener('openTask', handleOpenTask);
    return () => {
      window.removeEventListener('openTask', handleOpenTask);
    };
  }, []);
  
  // Дополнительные фильтры
  const [showFilters, setShowFilters] = useState(false);
  const [geoFilter, setGeoFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('');
  const [offerFilter, setOfferFilter] = useState<string>('');
  const [deadlineFilter, setDeadlineFilter] = useState<'today' | 'tomorrow' | 'overdue' | ''>('');

  // Сортировка
  const [sortField, setSortField] = useState<'created_at' | 'deadline'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  });

  // Загружаем офферы для фильтра
  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => offersApi.getAll(),
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
      setPendingFiles([]);
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
      setPendingFiles([]);
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
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Обновляем viewingTask, если открыта та же задача
      if (viewingTask && updatedTask && viewingTask.id === updatedTask.id) {
        setViewingTask(updatedTask);
      }
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

  // Дополнительные фильтры
  if (geoFilter) {
    filteredTasks = filteredTasks.filter(t => t.geo === geoFilter);
  }
  if (departmentFilter) {
    filteredTasks = filteredTasks.filter(t => t.department === departmentFilter);
  }
  if (priorityFilter) {
    filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
  }
  if (taskTypeFilter) {
    filteredTasks = filteredTasks.filter(t => t.task_type === taskTypeFilter);
  }
  if (offerFilter) {
    filteredTasks = filteredTasks.filter(t => t.offer_id === offerFilter);
  }
  if (deadlineFilter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

    if (deadlineFilter === 'today') {
      filteredTasks = filteredTasks.filter(t => {
        const deadline = new Date(t.deadline);
        return deadline >= today && deadline < tomorrow;
      });
    } else if (deadlineFilter === 'tomorrow') {
      filteredTasks = filteredTasks.filter(t => {
        const deadline = new Date(t.deadline);
        return deadline >= tomorrow && deadline < dayAfterTomorrow;
      });
    } else if (deadlineFilter === 'overdue') {
      filteredTasks = filteredTasks.filter(t => 
        isPast(new Date(t.deadline)) && t.status !== 'completed' && t.status !== 'cancelled'
      );
    }
  }

  // Количество активных фильтров
  const activeFiltersCount = [geoFilter, departmentFilter, priorityFilter, taskTypeFilter, offerFilter, deadlineFilter].filter(Boolean).length;

  // Сортировка задач
  filteredTasks = [...filteredTasks].sort((a, b) => {
    // Просроченные задачи всегда наверху
    const aOverdue = isPast(new Date(a.deadline)) && a.status !== 'completed' && a.status !== 'cancelled';
    const bOverdue = isPast(new Date(b.deadline)) && b.status !== 'completed' && b.status !== 'cancelled';
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Сортировка по выбранному полю
    const dateA = new Date(sortField === 'created_at' ? a.created_at : a.deadline).getTime();
    const dateB = new Date(sortField === 'created_at' ? b.created_at : b.deadline).getTime();
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      {/* Sticky Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8 pb-4 space-y-4 border-b border-dark-700/50">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4 animate-slide-down">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2 sm:gap-3">
              <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
              Задачи
            </h1>
            <p className="text-dark-400 mt-1 text-sm sm:text-base hidden sm:block">
              Управление задачами команды
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Кнопка сортировки */}
            <div className="flex items-center">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as 'created_at' | 'deadline')}
                className="bg-dark-700/50 border border-dark-600 text-dark-300 text-sm rounded-l-xl px-3 h-10 sm:h-11 focus:outline-none focus:border-primary-500/50 hover:text-dark-100 transition-colors"
              >
                <option value="created_at">По дате создания</option>
                <option value="deadline">По дедлайну</option>
              </select>
              <button
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center w-10 sm:w-11 h-10 sm:h-11 bg-dark-700/50 border border-l-0 border-dark-600 text-dark-300 hover:text-dark-100 rounded-r-xl transition-colors"
                title={sortDirection === 'desc' ? 'Сначала новые' : 'Сначала старые'}
              >
                {sortDirection === 'desc' ? (
                  <ArrowDown className="w-4 h-4" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all text-sm ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-dark-700/50 border-dark-600 text-dark-300 hover:text-dark-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Новая задача</span>
              <span className="sm:hidden">Создать</span>
            </button>
          </div>
        </div>

        {/* Панель дополнительных фильтров */}
        {showFilters && (
          <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 animate-slide-down">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-dark-300">Фильтры</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setGeoFilter('');
                    setDepartmentFilter('');
                    setPriorityFilter('');
                    setTaskTypeFilter('');
                    setOfferFilter('');
                    setDeadlineFilter('');
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Сбросить все
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* GEO */}
              <div>
                <label className="block text-xs text-dark-500 mb-1">GEO</label>
                <select
                  value={geoFilter}
                  onChange={(e) => setGeoFilter(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">Все</option>
                  <option value="any">Не важно</option>
                  {Array.from(new Set(tasks.map(t => t.geo).filter(Boolean))).map(geo => (
                    <option key={geo} value={geo!}>{geo!.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Отдел */}
              <div>
                <label className="block text-xs text-dark-500 mb-1">Отдел</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">Все</option>
                  {Object.entries(departmentLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Приоритет */}
              <div>
                <label className="block text-xs text-dark-500 mb-1">Приоритет</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">Все</option>
                  {Object.entries(taskPriorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Тип задачи */}
              <div>
                <label className="block text-xs text-dark-500 mb-1">Тип</label>
                <select
                  value={taskTypeFilter}
                  onChange={(e) => setTaskTypeFilter(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">Все</option>
                  {Object.entries(taskTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Оффер */}
              <div>
                <label className="block text-xs text-dark-500 mb-1">Оффер</label>
                <select
                  value={offerFilter}
                  onChange={(e) => setOfferFilter(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">Все</option>
                  {offers.map(offer => (
                    <option key={offer.id} value={offer.id}>{offer.name}</option>
                  ))}
                </select>
              </div>

              {/* Дедлайн */}
              <div>
                <label className="block text-xs text-dark-500 mb-1">Дедлайн</label>
                <select
                  value={deadlineFilter}
                  onChange={(e) => setDeadlineFilter(e.target.value as typeof deadlineFilter)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">Все</option>
                  <option value="overdue">🔴 Просрочен</option>
                  <option value="today">🟡 Сегодня</option>
                  <option value="tomorrow">🟢 Завтра</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 overflow-x-auto pb-1">
          <div className="flex bg-dark-700 rounded-xl p-1 min-w-max">
            <button
              onClick={() => setFilter('my')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                filter === 'my' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <span className="hidden sm:inline">Мне назначены</span>
              <span className="sm:hidden">Мне</span>
            </button>
            <button
              onClick={() => setFilter('created')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                filter === 'created' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <span className="hidden sm:inline">Я создал</span>
              <span className="sm:hidden">Создал</span>
            </button>
            {hasRole('admin') && (
              <button
                onClick={() => setFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                Все
              </button>
            )}
          </div>

          <div className="flex bg-dark-700 rounded-xl p-1 min-w-max">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                statusFilter === 'active' 
                  ? 'bg-dark-600 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                statusFilter === 'completed' 
                  ? 'bg-dark-600 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <span className="hidden sm:inline">Завершённые</span>
              <span className="sm:hidden">Готово</span>
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                statusFilter === 'all' 
                  ? 'bg-dark-600 text-white' 
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Все
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Tasks list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-4">
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
      </div>

      {/* Edit Modal */}
      {(showModal || editingTask) && (
        <TaskModal
          task={editingTask}
          users={users}
          currentUserRole={user?.role || ''}
          onClose={() => {
            setShowModal(false);
            setEditingTask(undefined);
            setPendingFiles([]);
          }}
          onSave={handleSave}
          pendingFiles={pendingFiles}
          setPendingFiles={setPendingFiles}
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
            // Закрываем модалку только при завершении или отмене
            if (status === 'completed' || status === 'cancelled') {
              setViewingTask(undefined);
            }
          }}
          onCompleteWithFiles={async (files, comment) => {
            // Сначала загружаем файлы результатов (если есть)
            if (files.length > 0) {
              try {
                await filesApi.upload(viewingTask.id, files, true); // is_result = true
                queryClient.invalidateQueries({ queryKey: ['task-files', viewingTask.id] });
              } catch (err) {
                console.error('File upload error:', err);
                toast.error('Ошибка загрузки файлов результата');
              }
            }
            // Добавляем комментарий к завершению (если есть)
            if (comment.trim()) {
              try {
                await commentsApi.add(viewingTask.id, `✅ Завершение задачи:\n\n${comment.trim()}`);
                queryClient.invalidateQueries({ queryKey: ['task-comments', viewingTask.id] });
              } catch (err) {
                console.error('Comment add error:', err);
                toast.error('Ошибка добавления комментария');
              }
            }
            // Потом меняем статус на completed
            statusMutation.mutate({ id: viewingTask.id, status: 'completed' });
            setViewingTask(undefined);
          }}
        />
      )}
    </div>
  );
}

export default Tasks;

