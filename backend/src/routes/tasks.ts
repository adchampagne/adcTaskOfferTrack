import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from '../middleware/auth';
import { Task, TaskWithUsers } from '../types';

const router = Router();

// Типы тасков на русском
const taskTypeLabels: Record<string, string> = {
  'create_landing': 'Завести ленд',
  'prepare_creatives': 'Подготовить крео',
  'setup_keitaro': 'Завести в Keitaro',
  'setup_partner': 'Завести партнёра',
  'other': 'Другое'
};

// Получить все таски
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { status, executor_id, customer_id } = req.query;

    let query = `
      SELECT t.*, 
             c.full_name as customer_name, 
             e.full_name as executor_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE 1=1
    `;

    const params: string[] = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status as string);
    }

    if (executor_id) {
      query += ' AND t.executor_id = ?';
      params.push(executor_id as string);
    }

    if (customer_id) {
      query += ' AND t.customer_id = ?';
      params.push(customer_id as string);
    }

    query += ' ORDER BY t.deadline ASC';

    const tasks = db.prepare(query).all(...params) as TaskWithUsers[];

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить мои таски (где я исполнитель или заказчик)
router.get('/my', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;

    const tasks = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             e.full_name as executor_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.customer_id = ? OR t.executor_id = ?
      ORDER BY t.deadline ASC
    `).all(userId, userId) as TaskWithUsers[];

    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить таск по ID
router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             e.full_name as executor_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.id = ?
    `).get(req.params.id) as TaskWithUsers | undefined;

    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать таск (все могут)
router.post('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { title, description, task_type, executor_id, deadline } = req.body;

    if (!title || !task_type || !executor_id || !deadline) {
      res.status(400).json({ error: 'Заголовок, тип, исполнитель и дедлайн обязательны' });
      return;
    }

    const executor = db.prepare('SELECT id FROM users WHERE id = ?').get(executor_id);
    if (!executor) {
      res.status(400).json({ error: 'Исполнитель не найден' });
      return;
    }

    const id = uuidv4();
    const customer_id = req.user?.userId;

    db.prepare(`
      INSERT INTO tasks (id, title, description, task_type, customer_id, executor_id, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description || null, task_type, customer_id, executor_id, deadline);

    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             e.full_name as executor_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить статус таска
router.patch('/:id/status', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Неверный статус' });
      return;
    }

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Проверяем права - менять может заказчик или исполнитель
    if (existing.customer_id !== req.user?.userId && existing.executor_id !== req.user?.userId) {
      res.status(403).json({ error: 'Вы не можете изменить статус этой задачи' });
      return;
    }

    const completed_at = status === 'completed' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE tasks 
      SET status = ?, completed_at = ?
      WHERE id = ?
    `).run(status, completed_at, id);

    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             e.full_name as executor_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить таск
router.put('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { title, description, task_type, executor_id, deadline } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Редактировать может только заказчик
    if (existing.customer_id !== req.user?.userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только заказчик или админ может редактировать задачу' });
      return;
    }

    if (executor_id) {
      const executor = db.prepare('SELECT id FROM users WHERE id = ?').get(executor_id);
      if (!executor) {
        res.status(400).json({ error: 'Исполнитель не найден' });
        return;
      }
    }

    db.prepare(`
      UPDATE tasks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          task_type = COALESCE(?, task_type),
          executor_id = COALESCE(?, executor_id),
          deadline = COALESCE(?, deadline)
      WHERE id = ?
    `).run(title, description, task_type, executor_id, deadline, id);

    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             e.full_name as executor_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить таск
router.delete('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Удалять может заказчик или админ
    if (existing.customer_id !== req.user?.userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только заказчик или админ может удалить задачу' });
      return;
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    res.json({ message: 'Задача удалена' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить типы тасков
router.get('/types/list', authenticateToken, (_req: Request, res: Response): void => {
  res.json(taskTypeLabels);
});

export default router;

