import axios from 'axios';
import { User, Partner, Offer, Task, TaskStatus, TaskFile, Notification } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обрабатываем ошибки авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  getUsers: async () => {
    const { data } = await api.get<User[]>('/auth/users');
    return data;
  },

  register: async (userData: { username: string; password: string; full_name: string; role: string }) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },
};

// Partners API
export const partnersApi = {
  getAll: async () => {
    const { data } = await api.get<Partner[]>('/partners');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Partner>(`/partners/${id}`);
    return data;
  },

  create: async (partner: { name: string; description?: string; website?: string }) => {
    const { data } = await api.post<Partner>('/partners', partner);
    return data;
  },

  update: async (id: string, partner: Partial<Partner>) => {
    const { data } = await api.put<Partner>(`/partners/${id}`, partner);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/partners/${id}`);
    return data;
  },
};

// Offers API
export const offersApi = {
  getAll: async (partnerId?: string) => {
    const params = partnerId ? { partner_id: partnerId } : {};
    const { data } = await api.get<Offer[]>('/offers', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Offer>(`/offers/${id}`);
    return data;
  },

  create: async (offer: {
    partner_id: string;
    name: string;
    theme: string;
    partner_link?: string;
    landing_price?: string;
    promo_link?: string;
    payout?: string;
  }) => {
    const { data } = await api.post<Offer>('/offers', offer);
    return data;
  },

  update: async (id: string, offer: Partial<Offer>) => {
    const { data } = await api.put<Offer>(`/offers/${id}`, offer);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/offers/${id}`);
    return data;
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (filters?: { status?: TaskStatus; executor_id?: string; customer_id?: string }) => {
    const { data } = await api.get<Task[]>('/tasks', { params: filters });
    return data;
  },

  getMy: async () => {
    const { data } = await api.get<Task[]>('/tasks/my');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Task>(`/tasks/${id}`);
    return data;
  },

  create: async (task: {
    title: string;
    description?: string;
    task_type: string;
    executor_id: string;
    deadline: string;
  }) => {
    const { data } = await api.post<Task>('/tasks', task);
    return data;
  },

  updateStatus: async (id: string, status: TaskStatus) => {
    const { data } = await api.patch<Task>(`/tasks/${id}/status`, { status });
    return data;
  },

  update: async (id: string, task: Partial<Task>) => {
    const { data } = await api.put<Task>(`/tasks/${id}`, task);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (unreadOnly?: boolean) => {
    const params = unreadOnly ? { unread_only: 'true' } : {};
    const { data } = await api.get<Notification[]>('/notifications', { params });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  markAsRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};

// Telegram API
export const telegramApi = {
  getLink: async () => {
    const { data } = await api.get<{ linked: boolean; link_url?: string; telegram_username?: string; code?: string }>('/telegram/link');
    return data;
  },

  getStatus: async () => {
    const { data } = await api.get<{ linked: boolean; telegram_username?: string }>('/telegram/status');
    return data;
  },

  unlink: async () => {
    const { data } = await api.delete('/telegram/unlink');
    return data;
  },

  sendTest: async () => {
    const { data } = await api.post('/telegram/test');
    return data;
  },
};

// Files API
export const filesApi = {
  getTaskFiles: async (taskId: string) => {
    const { data } = await api.get<TaskFile[]>(`/files/task/${taskId}`);
    return data;
  },

  upload: async (taskId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await api.post<TaskFile[]>(`/files/upload/${taskId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getDownloadUrl: (fileId: string) => {
    const token = localStorage.getItem('token');
    return `/api/files/download/${fileId}?token=${token}`;
  },

  getViewUrl: (fileId: string) => {
    const token = localStorage.getItem('token');
    return `/api/files/view/${fileId}?token=${token}`;
  },

  delete: async (fileId: string) => {
    const { data } = await api.delete(`/files/${fileId}`);
    return data;
  },
};

export default api;

