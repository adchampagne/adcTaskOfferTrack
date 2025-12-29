import { Router, Request, Response } from 'express';
import db from '../database';
import { authenticateToken } from '../middleware/auth';
import { TaskWithUsers, Department } from '../types';
import { notifyTaskReassigned } from './notifications';

const router = Router();

interface DepartmentMember {
  user_id: string;
  user_name: string;
  user_username: string;
  user_role: string;
}

interface MemberStats {
  user_id: string;
  user_name: string;
  user_username: string;
  tasks_week: number;
  tasks_month: number;
}

// Получить отделы, которыми руководит текущий пользователь
function getHeadDepartments(userId: string): { id: string; name: string; code: string }[] {
  return db.prepare(`
    SELECT d.id, d.name, d.code 
    FROM departments d
    JOIN department_heads dh ON d.id = dh.department_id
    WHERE dh.user_id = ?
    ORDER BY d.name ASC
  `).all(userId) as { id: string; name: string; code: string }[];
}

// Получить первый отдел, которым руководит пользователь (для обратной совместимости)
function getHeadDepartment(userId: string): { id: string; name: string; code: string } | null {
  const departments = getHeadDepartments(userId);
  return departments.length > 0 ? departments[0] : null;
}

// Получить сотрудников отдела
function getDepartmentMembers(departmentId: string): DepartmentMember[] {
  return db.prepare(`
    SELECT 
      ud.user_id,
      u.full_name as user_name,
      u.username as user_username,
      u.role as user_role
    FROM user_departments ud
    JOIN users u ON ud.user_id = u.id
    WHERE ud.department_id = ?
    ORDER BY u.full_name ASC
  `).all(departmentId) as DepartmentMember[];
}

// Проверка, является ли пользователь руководителем отдела
router.get('/check', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.json({ isHead: false });
      return;
    }

    res.json({ 
      isHead: true, 
      department: {
        id: department.id,
        name: department.name,
        code: department.code
      }
    });
  } catch (error) {
    console.error('Check head error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить задачи сотрудников моего отдела и мои (как руководителя)
router.get('/tasks', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    const members = getDepartmentMembers(department.id);
    const memberIds = members.map(m => m.user_id);
    
    // Добавляем самого руководителя - задачи могут быть назначены ему
    memberIds.push(userId!);

    const placeholders = memberIds.map(() => '?').join(',');
    
    // Показываем задачи:
    // 1. Где исполнитель - сотрудник отдела или сам руководитель
    // 2. ИЛИ задача назначена на отдел (department = код отдела)
    const tasks = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name,
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.executor_id IN (${placeholders})
         OR t.department = ?
      ORDER BY 
        CASE t.status 
          WHEN 'in_progress' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'completed' THEN 3 
          WHEN 'cancelled' THEN 4 
        END,
        t.deadline ASC
    `).all(...memberIds, department.code) as TaskWithUsers[];

    res.json(tasks);
  } catch (error) {
    console.error('Get head tasks error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику по сотрудникам
router.get('/stats', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    const members = getDepartmentMembers(department.id);
    
    // Получаем даты для фильтрации
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const stats: MemberStats[] = members.map(member => {
      // Задачи за неделю
      const weekTasks = db.prepare(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE executor_id = ? 
        AND status = 'completed' 
        AND completed_at >= ?
      `).get(member.user_id, weekAgo) as { count: number };

      // Задачи за месяц
      const monthTasks = db.prepare(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE executor_id = ? 
        AND status = 'completed' 
        AND completed_at >= ?
      `).get(member.user_id, monthAgo) as { count: number };

      return {
        user_id: member.user_id,
        user_name: member.user_name,
        user_username: member.user_username,
        tasks_week: weekTasks.count,
        tasks_month: monthTasks.count
      };
    });

    res.json({
      department: {
        id: department.id,
        name: department.name,
        code: department.code
      },
      members: stats
    });
  } catch (error) {
    console.error('Get head stats error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить задачу (дедлайн, приоритет, исполнитель)
router.patch('/tasks/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { deadline, priority, executor_id } = req.body;

    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    // Получаем сотрудников отдела + самого руководителя
    const members = getDepartmentMembers(department.id);
    const memberIds = members.map(m => m.user_id);
    // Добавляем руководителя в список (задачи могут быть назначены ему)
    memberIds.push(userId!);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as { executor_id: string } | undefined;
    
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Проверяем, что задача назначена сотруднику отдела или руководителю
    if (!memberIds.includes(task.executor_id)) {
      res.status(403).json({ error: 'Эта задача не принадлежит вашему отделу' });
      return;
    }

    // Валидация приоритета
    if (priority && !['high', 'normal', 'low'].includes(priority)) {
      res.status(400).json({ error: 'Неверный приоритет' });
      return;
    }

    // Валидация нового исполнителя - должен быть сотрудником отдела
    if (executor_id) {
      const departmentMemberIds = members.map(m => m.user_id);
      if (!departmentMemberIds.includes(executor_id)) {
        res.status(400).json({ error: 'Исполнитель должен быть сотрудником вашего отдела' });
        return;
      }
    }

    // Обновляем
    const updates: string[] = [];
    const values: (string | undefined)[] = [];

    if (deadline) {
      updates.push('deadline = ?');
      values.push(deadline);
    }
    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (executor_id) {
      updates.push('executor_id = ?');
      values.push(executor_id);
    }

    // Сохраняем старый executor_id для проверки изменения
    const oldExecutorId = task.executor_id;

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name,
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    // Отправляем уведомление новому исполнителю, если executor_id изменился
    if (executor_id && executor_id !== oldExecutorId) {
      const head = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as { full_name: string } | undefined;
      notifyTaskReassigned(updated, head?.full_name || 'Руководитель', executor_id);
    }

    res.json(updated);
  } catch (error) {
    console.error('Update head task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить список сотрудников отдела для назначения
router.get('/members', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    const members = getDepartmentMembers(department.id);
    res.json(members);
  } catch (error) {
    console.error('Get head members error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

