export type UserRole = 'admin' | 'buyer' | 'webdev';

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
  partner_link: string | null;
  landing_price: string | null;
  promo_link: string | null;
  payout: string | null;
  created_at: string;
  created_by: string | null;
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
}

export interface TaskWithUsers extends Task {
  customer_name: string;
  executor_name: string;
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

