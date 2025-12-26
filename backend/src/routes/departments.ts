import { Router, Request, Response } from 'express';
import db from '../database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Department {
  id: string;
  name: string;
  code: string;
  head_id: string | null;
  created_at: string;
}

interface DepartmentWithDetails extends Department {
  head_name: string | null;
  members_count: number;
}

interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

// Получить все отделы
router.get('/', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const departments = db.prepare(`
      SELECT 
        d.*,
        u.full_name as head_name,
        (SELECT COUNT(*) FROM user_departments WHERE department_id = d.id) as members_count
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      ORDER BY d.name ASC
    `).all() as DepartmentWithDetails[];

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить отдел по ID
router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const department = db.prepare(`
      SELECT 
        d.*,
        u.full_name as head_name
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = ?
    `).get(req.params.id) as DepartmentWithDetails | undefined;

    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить участников отдела
router.get('/:id/members', authenticateToken, (req: Request, res: Response): void => {
  try {
    const members = db.prepare(`
      SELECT 
        ud.*,
        u.full_name as user_name,
        u.role as user_role
      FROM user_departments ud
      JOIN users u ON ud.user_id = u.id
      WHERE ud.department_id = ?
      ORDER BY u.full_name ASC
    `).all(req.params.id) as UserDepartment[];

    res.json(members);
  } catch (error) {
    console.error('Get department members error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Назначить руководителя отдела (только админ)
router.patch('/:id/head', authenticateToken, requireAdmin, (req: Request, res: Response): void => {
  try {
    const { head_id } = req.body;
    const { id } = req.params;

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined;
    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    if (head_id) {
      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(head_id);
      if (!user) {
        res.status(400).json({ error: 'Пользователь не найден' });
        return;
      }
    }

    db.prepare('UPDATE departments SET head_id = ? WHERE id = ?').run(head_id || null, id);

    const updated = db.prepare(`
      SELECT 
        d.*,
        u.full_name as head_name,
        (SELECT COUNT(*) FROM user_departments WHERE department_id = d.id) as members_count
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = ?
    `).get(id) as DepartmentWithDetails;

    res.json(updated);
  } catch (error) {
    console.error('Update department head error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить пользователя в отдел (админ или руководитель этого отдела)
router.post('/:id/members', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { user_id } = req.body;
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined;
    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    // Проверяем права: админ или руководитель этого отдела
    const isHead = department.head_id === currentUserId;
    if (!isAdmin && !isHead) {
      res.status(403).json({ error: 'Только администратор или руководитель отдела может добавлять сотрудников' });
      return;
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!user) {
      res.status(400).json({ error: 'Пользователь не найден' });
      return;
    }

    // Проверяем, не добавлен ли уже
    const existing = db.prepare('SELECT id FROM user_departments WHERE user_id = ? AND department_id = ?').get(user_id, id);
    if (existing) {
      res.status(400).json({ error: 'Пользователь уже в этом отделе' });
      return;
    }

    const membershipId = uuidv4();
    db.prepare('INSERT INTO user_departments (id, user_id, department_id) VALUES (?, ?, ?)').run(membershipId, user_id, id);

    res.status(201).json({ id: membershipId, user_id, department_id: id });
  } catch (error) {
    console.error('Add department member error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить пользователя из отдела (админ или руководитель этого отдела)
router.delete('/:id/members/:userId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined;
    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    // Проверяем права: админ или руководитель этого отдела
    const isHead = department.head_id === currentUserId;
    if (!isAdmin && !isHead) {
      res.status(403).json({ error: 'Только администратор или руководитель отдела может удалять сотрудников' });
      return;
    }

    const existing = db.prepare('SELECT id FROM user_departments WHERE user_id = ? AND department_id = ?').get(userId, id);
    if (!existing) {
      res.status(404).json({ error: 'Пользователь не в этом отделе' });
      return;
    }

    db.prepare('DELETE FROM user_departments WHERE user_id = ? AND department_id = ?').run(userId, id);

    res.json({ message: 'Пользователь удалён из отдела' });
  } catch (error) {
    console.error('Remove department member error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

