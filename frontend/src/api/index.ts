import axios from 'axios';
import { User, Partner, Offer, Task, TaskStatus, TaskFile, Notification, UserRole, TaskComment } from '../types';

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

  getProfile: async () => {
    const { data } = await api.get<User & { 
      telegram_username: string | null;
      department: { id: string; name: string; code: string } | null;
    }>('/auth/me/profile');
    return data;
  },

  updateProfile: async (full_name: string) => {
    const { data } = await api.patch<User>('/auth/me/profile', { full_name });
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

  // Настройки персонализации
  getSettings: async () => {
    const { data } = await api.get<Record<string, unknown>>('/auth/me/settings');
    return data;
  },

  saveSettings: async (settings: Record<string, unknown>) => {
    const { data } = await api.put<{ message: string; settings: Record<string, unknown> }>('/auth/me/settings', settings);
    return data;
  },

  // Загрузка фона
  uploadBackground: async (file: File) => {
    const formData = new FormData();
    formData.append('background', file);
    const { data } = await api.post<{ message: string; backgroundUrl: string; filename: string }>('/auth/me/background', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteBackground: async () => {
    const { data } = await api.delete<{ message: string }>('/auth/me/background');
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
    geo?: string;
    payment_type?: string | null;
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

  returnToRevision: async (id: string, comment: string) => {
    const { data } = await api.patch<Task>(`/tasks/${id}/revision`, { comment });
    return data;
  },

  requestClarification: async (id: string, comment: string) => {
    const { data } = await api.patch<Task>(`/tasks/${id}/clarification`, { comment });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },

  // Подзадачи
  getSubtasks: async (taskId: string) => {
    const { data } = await api.get<Task[]>(`/tasks/${taskId}/subtasks`);
    return data;
  },

  createSubtask: async (parentTaskId: string, subtask: {
    title: string;
    description?: string;
    task_type: string;
    geo?: string;
    priority: string;
    department: string;
    deadline: string;
    offer_id?: string;
  }) => {
    const { data } = await api.post<Task>(`/tasks/${parentTaskId}/subtasks`, subtask);
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

// Comments API
export const commentsApi = {
  getTaskComments: async (taskId: string) => {
    const { data } = await api.get<TaskComment[]>(`/comments/task/${taskId}`);
    return data;
  },

  add: async (taskId: string, message: string) => {
    const { data } = await api.post<TaskComment>(`/comments/task/${taskId}`, { message });
    return data;
  },

  delete: async (commentId: string) => {
    const { data } = await api.delete(`/comments/${commentId}`);
    return data;
  },
};

// Files API
export const filesApi = {
  getTaskFiles: async (taskId: string) => {
    const { data } = await api.get<TaskFile[]>(`/files/task/${taskId}`);
    return data;
  },

  upload: async (taskId: string, files: File[], isResult: boolean = false) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('is_result', isResult ? '1' : '0');

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
      members: Array<{ user_id: string; user_name: string; user_username: string; tasks_week: number; tasks_month: number }>;
    }>('/head-dashboard/stats');
    return data;
  },

  getMembers: async () => {
    const { data } = await api.get<Array<{ user_id: string; user_name: string; user_username: string; user_role: string }>>('/head-dashboard/members');
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

// Metadata Cleaner API (Очистка метаданных)
export const metadataApi = {
  checkAccess: async () => {
    const { data } = await api.get<{ hasAccess: boolean; allowedRoles: string[] }>('/metadata/check-access');
    return data;
  },

  cleanFile: async (file: File, onProgress?: (progress: number) => void): Promise<Blob> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/metadata/clean', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  cleanBatch: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/metadata/clean-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    // Если один файл, возвращается blob
    if (response.headers['content-type']?.includes('application/json')) {
      return response.data as {
        batchId: string;
        filesCount: number;
        files: { id: string; originalName: string }[];
      };
    }
    
    return response.data;
  },

  downloadBatchFile: async (batchId: string, fileIndex: number): Promise<Blob> => {
    const response = await api.get(`/metadata/batch/${batchId}/${fileIndex}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteBatch: async (batchId: string) => {
    const { data } = await api.delete(`/metadata/batch/${batchId}`);
    return data;
  },
};

// Analytics API (Аналитика)
export interface AnalyticsSummary {
  tasksThisWeek: number;
  tasksThisMonth: number;
  monthChange: number;
  totalCompleted: number;
  activeTasks: number;
  departmentCode: string | null;
}

export interface TasksByDay {
  date: string;
  count: number;
}

export interface TasksByWeek {
  week: string;
  weekStart: string;
  weekEnd: string;
  count: number;
}

export interface AvgCompletionTime {
  task_type: string;
  total_tasks: number;
  avg_hours: number;
  avg_days: number;
}

export interface DepartmentStats {
  department: string;
  total: number;
  completed: number;
  completed_month: number;
}

export interface TopExecutor {
  id: string;
  full_name: string;
  username: string;
  tasks_completed: number;
  avg_hours: number;
  avg_hours_total: number | null;
  avg_hours_work: number | null;
}

export const analyticsApi = {
  checkAccess: async () => {
    const { data } = await api.get<{ hasAccess: boolean }>('/analytics/check-access');
    return data;
  },

  getSummary: async () => {
    const { data } = await api.get<AnalyticsSummary>('/analytics/summary');
    return data;
  },

  getTasksCompleted: async () => {
    const { data } = await api.get<TasksByDay[]>('/analytics/tasks-completed');
    return data;
  },

  getTasksByWeek: async () => {
    const { data } = await api.get<TasksByWeek[]>('/analytics/tasks-by-week');
    return data;
  },

  getAvgCompletionTime: async () => {
    const { data } = await api.get<AvgCompletionTime[]>('/analytics/avg-completion-time');
    return data;
  },

  getByDepartment: async () => {
    const { data } = await api.get<DepartmentStats[]>('/analytics/by-department');
    return data;
  },

  getTopExecutors: async (
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month',
    dateFrom?: string,
    dateTo?: string
  ) => {
    const params: Record<string, string> = { period };
    if (period === 'custom' && dateFrom) {
      params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
    }
    const { data } = await api.get<TopExecutor[]>('/analytics/top-executors', { params });
    return data;
  },
};

// Achievements types
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
  sort_order: number;
  earned: boolean;
  earned_at: string | null;
}

export interface AchievementsResponse {
  achievements: Record<string, Achievement[]>;
  total: number;
  earned: number;
}

export interface LeaderboardUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  rank: number;
  completed_tasks: number;
  top_rated: number;
  early_completed: number;
  achievements_count: number;
}

export interface LeaderboardResponse {
  department: { id: string; name: string; code: string } | null;
  period: string;
  leaderboard: LeaderboardUser[];
}

export const achievementsApi = {
  getAll: async () => {
    const { data } = await api.get<AchievementsResponse>('/achievements');
    return data;
  },

  getUserAchievements: async (userId: string) => {
    const { data } = await api.get<Achievement[]>(`/achievements/user/${userId}`);
    return data;
  },

  check: async () => {
    const { data } = await api.post<{ newAchievements: Achievement[]; message: string }>('/achievements/check');
    return data;
  },

  getLeaderboard: async (departmentCode: string, period: 'week' | 'month' | 'all' = 'month') => {
    const { data } = await api.get<LeaderboardResponse>(`/achievements/leaderboard/${departmentCode}`, {
      params: { period }
    });
    return data;
  },
};

export default api;

