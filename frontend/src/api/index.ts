import axios from 'axios';
import { User, Partner, Offer, Task, TaskStatus, TaskFile, Notification, UserRole } from '../types';

export interface DepartmentHead {
  user_id: string;
  user_name: string;
  user_username: string;
  user_role: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head_id: string | null; // Deprecated
  head_name: string | null; // Deprecated
  heads: DepartmentHead[];
  members_count: number;
  created_at: string;
}

export interface DepartmentMember {
  id: string;
  user_id: string;
  department_id: string;
  user_name: string;
  user_username: string;
  user_role: string;
  created_at: string;
}

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
    // Разлогиниваем только при 401 (неавторизован), но НЕ при 403 (запрещено)
    // 403 может означать просто недостаток прав, а не проблему с токеном
    if (error.response?.status === 401) {
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

  updateUserRole: async (userId: string, role: UserRole) => {
    const { data } = await api.patch<User>(`/auth/users/${userId}/role`, { role });
    return data;
  },

  updateUser: async (userId: string, userData: { username?: string; password?: string; full_name?: string; role?: string }) => {
    const { data } = await api.put<User>(`/auth/users/${userId}`, userData);
    return data;
  },

  deleteUser: async (userId: string) => {
    const { data } = await api.delete(`/auth/users/${userId}`);
    return data;
  },

  // Права пользователей
  getPermissionsList: async () => {
    const { data } = await api.get<{ code: string; label: string; description: string }[]>('/auth/permissions/list');
    return data;
  },

  getUserPermissions: async (userId: string) => {
    const { data } = await api.get<string[]>(`/auth/users/${userId}/permissions`);
    return data;
  },

  updateUserPermissions: async (userId: string, permissions: string[]) => {
    const { data } = await api.put(`/auth/users/${userId}/permissions`, { permissions });
    return data;
  },

  getMyPermissions: async () => {
    const { data } = await api.get<string[]>('/auth/me/permissions');
    return data;
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const { data } = await api.post<{ message: string }>('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
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

  rate: async (id: string, rating: 'bad' | 'ok' | 'top') => {
    const { data } = await api.patch<Task>(`/tasks/${id}/rate`, { rating });
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

// Departments API
export const departmentsApi = {
  getAll: async () => {
    const { data } = await api.get<Department[]>('/departments');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Department>(`/departments/${id}`);
    return data;
  },

  getMembers: async (departmentId: string) => {
    const { data } = await api.get<DepartmentMember[]>(`/departments/${departmentId}/members`);
    return data;
  },

  getHeads: async (departmentId: string) => {
    const { data } = await api.get<DepartmentHead[]>(`/departments/${departmentId}/heads`);
    return data;
  },

  addHead: async (departmentId: string, userId: string) => {
    const { data } = await api.post<{ message: string; heads: DepartmentHead[] }>(`/departments/${departmentId}/heads`, { user_id: userId });
    return data;
  },

  removeHead: async (departmentId: string, userId: string) => {
    const { data } = await api.delete<{ message: string; heads: DepartmentHead[] }>(`/departments/${departmentId}/heads/${userId}`);
    return data;
  },

  addMember: async (departmentId: string, userId: string) => {
    const { data } = await api.post(`/departments/${departmentId}/members`, { user_id: userId });
    return data;
  },

  removeMember: async (departmentId: string, userId: string) => {
    const { data } = await api.delete(`/departments/${departmentId}/members/${userId}`);
    return data;
  },
};

// Head Dashboard API (для руководителей отделов)
export const headDashboardApi = {
  check: async () => {
    const { data } = await api.get<{ isHead: boolean; department?: { id: string; name: string; code: string } }>('/head-dashboard/check');
    return data;
  },

  getTasks: async () => {
    const { data } = await api.get<Task[]>('/head-dashboard/tasks');
    return data;
  },

  getStats: async () => {
    const { data } = await api.get<{
      department: { id: string; name: string; code: string };
      members: Array<{ user_id: string; user_name: string; tasks_week: number; tasks_month: number }>;
    }>('/head-dashboard/stats');
    return data;
  },

  getMembers: async () => {
    const { data } = await api.get<Array<{ user_id: string; user_name: string; user_role: string }>>('/head-dashboard/members');
    return data;
  },

  updateTask: async (taskId: string, updates: { deadline?: string; priority?: string; executor_id?: string }) => {
    const { data } = await api.patch<Task>(`/head-dashboard/tasks/${taskId}`, updates);
    return data;
  },
};

// Knowledge Base API (База знаний)
export interface KnowledgeCategory {
  id: string;
  department_code: string;
  title: string;
  icon: string;
  sort_order: number;
  created_at: string;
  instructions: KnowledgeInstruction[];
}

export interface KnowledgeInstruction {
  id: string;
  category_id: string;
  title: string;
  content: string;
  tags: string[];
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const knowledgeApi = {
  getByDepartment: async (departmentCode: string) => {
    const { data } = await api.get<KnowledgeCategory[]>(`/knowledge/${departmentCode}`);
    return data;
  },

  canEdit: async (departmentCode: string) => {
    const { data } = await api.get<{ canEdit: boolean }>(`/knowledge/${departmentCode}/can-edit`);
    return data;
  },

  createCategory: async (category: { department_code: string; title: string; icon?: string }) => {
    const { data } = await api.post<KnowledgeCategory>('/knowledge/categories', category);
    return data;
  },

  updateCategory: async (id: string, updates: { title?: string; icon?: string; sort_order?: number }) => {
    const { data } = await api.patch<KnowledgeCategory>(`/knowledge/categories/${id}`, updates);
    return data;
  },

  deleteCategory: async (id: string) => {
    await api.delete(`/knowledge/categories/${id}`);
  },

  createInstruction: async (instruction: { category_id: string; title: string; content: string; tags?: string[] }) => {
    const { data } = await api.post<KnowledgeInstruction>('/knowledge/instructions', instruction);
    return data;
  },

  updateInstruction: async (id: string, updates: { title?: string; content?: string; tags?: string[]; sort_order?: number; category_id?: string }) => {
    const { data } = await api.patch<KnowledgeInstruction>(`/knowledge/instructions/${id}`, updates);
    return data;
  },

  deleteInstruction: async (id: string) => {
    await api.delete(`/knowledge/instructions/${id}`);
  },
};

export default api;

