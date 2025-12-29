import { Router, Request, Response } from 'express';
import db from '../database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Department {
  id: string;
  name: string;
  code: string;
  head_id: string | null; // Deprecated, для обратной совместимости
  created_at: string;
}

interface DepartmentHead {
  user_id: string;
  user_name: string;
  user_username: string;
  user_role: string;
}

interface DepartmentWithDetails extends Department {
  head_name: string | null; // Deprecated
  heads: DepartmentHead[];
  members_count: number;
}

// Вспомогательная функция: проверка является ли пользователь руководителем отдела
function isDepartmentHead(userId: string, departmentId: string): boolean {
  const result = db.prepare(`
    SELECT 1 FROM department_heads WHERE user_id = ? AND department_id = ?
  `).get(userId, departmentId);
  return !!result;
}

// Получить руководителей отдела
function getDepartmentHeads(departmentId: string): DepartmentHead[] {
  return db.prepare(`
    SELECT dh.user_id, u.full_name as user_name, u.username as user_username, u.role as user_role
    FROM department_heads dh
    JOIN users u ON dh.user_id = u.id
    WHERE dh.department_id = ?
    ORDER BY u.full_name ASC
  `).all(departmentId) as DepartmentHead[];
}

interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  created_at: string;
  user_name?: string;
  user_username?: string;
  user_role?: string;
}

// Получить все отделы
router.get('/', authenticateToken, (_req: Request, res: Response): void => {
  try {
    const departments = db.prepare(`
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM user_departments WHERE department_id = d.id) as members_count
      FROM departments d
      ORDER BY d.name ASC
    `).all() as (Department & { members_count: number })[];

    // Добавляем руководителей к каждому отделу
    const result = departments.map(dept => ({
      ...dept,
      heads: getDepartmentHeads(dept.id),
      head_name: null, // Deprecated
    }));

    res.json(result);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить отдел по ID
router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const department = db.prepare(`
      SELECT d.* FROM departments d WHERE d.id = ?
    `).get(req.params.id) as Department | undefined;

    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    res.json({
      ...department,
      heads: getDepartmentHeads(department.id),
      head_name: null, // Deprecated
    });
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
        u.username as user_username,
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

// Получить руководителей отдела
router.get('/:id/heads', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(id);
    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    res.json(getDepartmentHeads(id));
  } catch (error) {
    console.error('Get department heads error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить руководителя отдела (только админ)
router.post('/:id/heads', authenticateToken, requireAdmin, (req: Request, res: Response): void => {
  try {
    const { user_id } = req.body;
    const { id } = req.params;

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined;
    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!user) {
      res.status(400).json({ error: 'Пользователь не найден' });
      return;
    }

    // Проверяем, не назначен ли уже
    const existing = db.prepare('SELECT id FROM department_heads WHERE user_id = ? AND department_id = ?').get(user_id, id);
    if (existing) {
      res.status(400).json({ error: 'Пользователь уже является руководителем этого отдела' });
      return;
    }

    const headId = uuidv4();
    db.prepare('INSERT INTO department_heads (id, user_id, department_id) VALUES (?, ?, ?)').run(headId, user_id, id);

    // Также обновляем head_id для обратной совместимости (первый руководитель)
    const headsCount = db.prepare('SELECT COUNT(*) as count FROM department_heads WHERE department_id = ?').get(id) as { count: number };
    if (headsCount.count === 1) {
      db.prepare('UPDATE departments SET head_id = ? WHERE id = ?').run(user_id, id);
    }

    res.status(201).json({ 
      message: 'Руководитель добавлен',
      heads: getDepartmentHeads(id)
    });
  } catch (error) {
    console.error('Add department head error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить руководителя отдела (только админ)
router.delete('/:id/heads/:userId', authenticateToken, requireAdmin, (req: Request, res: Response): void => {
  try {
    const { id, userId } = req.params;

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as Department | undefined;
    if (!department) {
      res.status(404).json({ error: 'Отдел не найден' });
      return;
    }

    const existing = db.prepare('SELECT id FROM department_heads WHERE user_id = ? AND department_id = ?').get(userId, id);
    if (!existing) {
      res.status(404).json({ error: 'Пользователь не является руководителем этого отдела' });
      return;
    }

    db.prepare('DELETE FROM department_heads WHERE user_id = ? AND department_id = ?').run(userId, id);

    // Обновляем head_id для обратной совместимости
    if (department.head_id === userId) {
      const firstHead = db.prepare('SELECT user_id FROM department_heads WHERE department_id = ? LIMIT 1').get(id) as { user_id: string } | undefined;
      db.prepare('UPDATE departments SET head_id = ? WHERE id = ?').run(firstHead?.user_id || null, id);
    }

    res.json({ 
      message: 'Руководитель удалён',
      heads: getDepartmentHeads(id)
    });
  } catch (error) {
    console.error('Remove department head error:', error);
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
    const isHead = currentUserId ? isDepartmentHead(currentUserId, id) : false;
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
    const isHead = currentUserId ? isDepartmentHead(currentUserId, id) : false;
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

