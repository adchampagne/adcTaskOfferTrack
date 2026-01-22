import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, X, Check, CheckCheck, Trash2, 
  AlertCircle, Clock, CheckCircle, UserPlus, RefreshCw
} from 'lucide-react';
import { notificationsApi } from '../api';
import { Notification, NotificationType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'task_assigned':
      return <UserPlus className="w-4 h-4 text-blue-400" />;
    case 'task_status_changed':
      return <RefreshCw className="w-4 h-4 text-yellow-400" />;
    case 'task_deadline_soon':
      return <Clock className="w-4 h-4 text-orange-400" />;
    case 'task_overdue':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case 'task_completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    default:
      return <Bell className="w-4 h-4 text-primary-400" />;
  }
}

function NotificationItem({ 
  notification, 
  onRead, 
  onDelete,
  onClick 
}: { 
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const isUnread = notification.is_read === 0;

  return (
    <div 
      className={`p-3 rounded-xl transition-all cursor-pointer group ${
        isUnread 
          ? 'bg-primary-500/5 border border-primary-500/20 hover:bg-primary-500/10' 
          : 'bg-dark-800/30 hover:bg-dark-700/50 border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isUnread ? 'bg-primary-500/10' : 'bg-dark-700/50'
        }`}>
          <NotificationIcon type={notification.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${isUnread ? 'text-dark-100' : 'text-dark-300'}`}>
              {notification.title}
            </p>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-dark-500 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true, 
              locale: ru 
            })}
          </p>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUnread && (
            <button
              onClick={(e) => { e.stopPropagation(); onRead(); }}
              className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
              title="Отметить как прочитанное"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Получаем количество непрочитанных
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000, // Проверяем каждые 30 секунд
  });

  // При изменении количества уведомлений - обновляем задачи
  const prevUnreadCountRef = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      // Появились новые уведомления - обновляем задачи
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['head-tasks'] });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, queryClient]);

  // Получаем все уведомления когда дропдаун открыт
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
    enabled: isOpen,
  });

  // Отметить как прочитанное
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Отметить все как прочитанные
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Удалить уведомление
  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      
      if (isOutsideDropdown && isOutsideButton) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    // Отмечаем как прочитанное
    if (notification.is_read === 0) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Если есть привязанная задача - переходим к задачам
    if (notification.task_id) {
      // Обновляем кэш задач перед переходом
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsOpen(false);
      navigate(`/tasks?task=${notification.task_id}`);
    }
  };

  return (
    <div className="relative">
      {/* Кнопка */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen 
            ? 'bg-primary-500/10 text-primary-400' 
            : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown через Portal - рендерится прямо в body */}
      {isOpen && createPortal(
        <div 
          className="fixed left-5 lg:left-[324px] bottom-5 w-[calc(100%-40px)] sm:w-96 glass-card p-0 shadow-2xl animate-scale-in z-[9999] max-h-[70vh] flex flex-col rounded-2xl"
          ref={dropdownRef}
        >
          {/* Header */}
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <h3 className="font-semibold text-dark-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-400" />
              Уведомления
              {unreadCount > 0 && (
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                  {unreadCount} новых
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                  title="Отметить все как прочитанные"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsReadMutation.mutate(notification.id)}
                  onDelete={() => deleteMutation.mutate(notification.id)}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

