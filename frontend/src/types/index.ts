export type UserRole = 'admin' | 'buyer' | 'webdev';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  created_at: string;
  created_by: string | null;
  creator_name?: string;
}

export interface Offer {
  id: string;
  partner_id: string;
  name: string;
  theme: string;
  partner_link: string | null;
  landing_price: string | null;
  promo_link: string | null;
  payout: string | null;
  created_at: string;
  created_by: string | null;
  partner_name?: string;
  creator_name?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskType = 
  | 'create_landing' 
  | 'prepare_creatives' 
  | 'setup_keitaro' 
  | 'setup_partner'
  | 'other';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  customer_id: string;
  executor_id: string;
  deadline: string;
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
  customer_name?: string;
  executor_name?: string;
}

export interface TaskFile {
  id: string;
  task_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
  uploader_name?: string;
}

export const taskTypeLabels: Record<TaskType, string> = {
  'create_landing': 'Завести ленд',
  'prepare_creatives': 'Подготовить крео',
  'setup_keitaro': 'Завести в Keitaro',
  'setup_partner': 'Завести партнёра',
  'other': 'Другое'
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  'pending': 'Ожидает',
  'in_progress': 'В работе',
  'completed': 'Выполнено',
  'cancelled': 'Отменено'
};

export const roleLabels: Record<UserRole, string> = {
  'admin': 'Админ',
  'buyer': 'Байер',
  'webdev': 'Веб-разраб'
};

