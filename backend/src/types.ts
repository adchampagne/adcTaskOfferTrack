export type UserRole = 'admin' | 'buyer' | 'webdev' | 'creo_manager' | 'buying_head' | 'bizdev' | 'creo_head' | 'dev_head';

export interface User {
  id: string;
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface UserPublic {
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
}

export interface Offer {
  id: string;
  partner_id: string;
  name: string;
  theme: string;
  geo: string | null;
  partner_link: string | null;
  landing_price: string | null;
  promo_link: string | null;
  payout: string | null;
  created_at: string;
  created_by: string | null;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'high' | 'normal' | 'low';

export type TaskRating = 'bad' | 'ok' | 'top';

export type Department = 'buying' | 'creo' | 'development';

// Маппинг отдел -> роль руководителя
export const departmentHeadRole: Record<Department, UserRole> = {
  'buying': 'buying_head',
  'creo': 'creo_head',
  'development': 'dev_head'
};

export type TaskType = 
  | 'create_landing' 
  | 'prepare_creatives' 
  | 'setup_keitaro' 
  | 'setup_partner'
  | 'other';

export interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string | null;
  task_type: TaskType;
  geo: string | null;
  priority: TaskPriority;
  department: Department | null;
  offer_id: string | null;
  customer_id: string;
  executor_id: string;
  deadline: string;
  status: TaskStatus;
  rating: TaskRating | null;
  created_at: string;
  completed_at: string | null;
  parent_task_id: string | null;
}

export interface TaskWithUsers extends Task {
  customer_name: string;
  customer_username: string;
  executor_name: string;
  executor_username: string;
  offer_name?: string;
  parent_task_title?: string;
  parent_task_number?: number;
  subtasks_count?: number;
  subtasks_completed?: number;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

