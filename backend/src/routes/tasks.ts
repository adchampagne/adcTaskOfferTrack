import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { getNextTaskNumber } from '../database';
import { authenticateToken } from '../middleware/auth';
import { Task, TaskWithUsers, Department, departmentHeadRole, UserRole } from '../types';
import { notifyTaskAssigned, notifyStatusChanged, notifySubtaskCompleted } from './notifications';

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
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             pt.title as parent_task_title,
             pt.task_number as parent_task_number,
             (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) as subtasks_count,
             (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status = 'completed') as subtasks_completed
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
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
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             pt.title as parent_task_title,
             pt.task_number as parent_task_number,
             (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) as subtasks_count,
             (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status = 'completed') as subtasks_completed
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
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
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             pt.title as parent_task_title,
             pt.task_number as parent_task_number
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      WHERE t.id = ?
    `).get(req.params.id) as TaskWithUsers | undefined;

    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Считаем количество подзадач
    const subtasksStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tasks
      WHERE parent_task_id = ?
    `).get(req.params.id) as { total: number; completed: number };

    const taskWithSubtasks = {
      ...task,
      subtasks_count: subtasksStats.total,
      subtasks_completed: subtasksStats.completed
    };

    res.json(taskWithSubtasks);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать таск (все могут)
router.post('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { title, description, task_type, executor_id, deadline, geo, priority, department, offer_id } = req.body;
    const currentUserRole = req.user?.role as UserRole;

    if (!title || !task_type || !deadline || !geo || !priority) {
      res.status(400).json({ error: 'Заголовок, тип, GEO, приоритет и дедлайн обязательны' });
      return;
    }

    // Обрабатываем offer_id: 'none' означает отсутствие оффера
    const finalOfferId = offer_id === 'none' ? null : offer_id;

    // Проверяем существование оффера (если указан)
    if (finalOfferId) {
      const offer = db.prepare('SELECT id FROM offers WHERE id = ?').get(finalOfferId);
      if (!offer) {
        res.status(400).json({ error: 'Оффер не найден' });
        return;
      }
    }

    if (!['high', 'normal', 'low'].includes(priority)) {
      res.status(400).json({ error: 'Неверный приоритет' });
      return;
    }

    // Определяем исполнителя
    let finalExecutorId = executor_id;
    const customer_id_check = req.user?.userId;
    
    // Админ может указать исполнителя напрямую
    if (currentUserRole === 'admin') {
      if (!executor_id) {
        res.status(400).json({ error: 'Исполнитель обязателен' });
        return;
      }
      finalExecutorId = executor_id;
    } else if (executor_id && executor_id === customer_id_check) {
      // Пользователь назначает задачу себе - не требуем отдел
      finalExecutorId = executor_id;
    } else {
      // Все остальные должны указать отдел
      if (!department) {
        res.status(400).json({ error: 'Необходимо указать отдел для задачи' });
        return;
      }
      if (!['buying', 'creo', 'development'].includes(department)) {
        res.status(400).json({ error: 'Неверный отдел' });
        return;
      }

      // Если указан executor_id - это руководитель назначает задачу сотруднику своего отдела
      if (executor_id) {
        finalExecutorId = executor_id;
      } else {
        // Иначе находим руководителя отдела
        const headRole = departmentHeadRole[department as Department];
        const departmentHead = db.prepare('SELECT id FROM users WHERE role = ?').get(headRole) as { id: string } | undefined;
        
        if (!departmentHead) {
          res.status(400).json({ error: `Руководитель отдела "${department}" не найден` });
          return;
        }
        
        finalExecutorId = departmentHead.id;
      }
    }

    if (!finalExecutorId) {
      res.status(400).json({ error: 'Исполнитель обязателен' });
      return;
    }

    const executor = db.prepare('SELECT id FROM users WHERE id = ?').get(finalExecutorId);
    if (!executor) {
      res.status(400).json({ error: 'Исполнитель не найден' });
      return;
    }

    const id = uuidv4();
    const customer_id = req.user?.userId;
    const task_number = getNextTaskNumber();

    db.prepare(`
      INSERT INTO tasks (id, task_number, title, description, task_type, geo, priority, department, offer_id, customer_id, executor_id, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, task_number, title, description || null, task_type, geo, priority, department || null, finalOfferId, customer_id, finalExecutorId, deadline);

    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    // Отправляем уведомление исполнителю
    notifyTaskAssigned(task, task.customer_name || 'Пользователь');

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
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             pt.title as parent_task_title,
             pt.task_number as parent_task_number
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    // Получаем имя пользователя, который изменил статус
    const currentUser = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user?.userId) as { full_name: string } | undefined;
    
    // Отправляем уведомления об изменении статуса
    notifyStatusChanged(task, status, req.user?.userId || '', currentUser?.full_name || 'Пользователь');

    // Если это подзадача и она завершена — уведомляем заказчика родительской задачи
    if (existing.parent_task_id && status === 'completed') {
      const parentTask = db.prepare(`
        SELECT t.*, 
               c.full_name as customer_name,
               e.full_name as executor_name
        FROM tasks t
        LEFT JOIN users c ON t.customer_id = c.id
        LEFT JOIN users e ON t.executor_id = e.id
        WHERE t.id = ?
      `).get(existing.parent_task_id) as Task & { customer_name: string; executor_name: string } | undefined;

      if (parentTask) {
        // Уведомляем исполнителя родительской задачи (который создал подзадачу)
        notifySubtaskCompleted(task, parentTask, currentUser?.full_name || 'Пользователь');

        // Копируем файлы-результаты из подзадачи в родительскую задачу
        const resultFiles = db.prepare(`
          SELECT * FROM task_files WHERE task_id = ? AND is_result = 1
        `).all(id) as Array<{
          id: string;
          original_name: string;
          stored_name: string;
          mime_type: string;
          size: number;
          uploaded_by: string;
        }>;

        for (const file of resultFiles) {
          const newFileId = uuidv4();
          db.prepare(`
            INSERT INTO task_files (id, task_id, original_name, stored_name, mime_type, size, uploaded_by, is_result)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
          `).run(newFileId, existing.parent_task_id, file.original_name, file.stored_name, file.mime_type, file.size, file.uploaded_by);
        }
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить таск
router.put('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { title, description, task_type, executor_id, deadline, geo, priority, department, offer_id } = req.body;
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

    // Для задач типа "завести ленд" требуем GEO
    const finalTaskType = task_type || existing.task_type;
    if (finalTaskType === 'create_landing' && !geo && !existing.geo) {
      res.status(400).json({ error: 'Для задачи "Завести ленд" необходимо указать GEO' });
      return;
    }

    // Обрабатываем offer_id: 'none' означает отсутствие оффера
    const updateOfferId = offer_id === 'none' ? null : offer_id;

    db.prepare(`
      UPDATE tasks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          task_type = COALESCE(?, task_type),
          geo = COALESCE(?, geo),
          priority = COALESCE(?, priority),
          department = COALESCE(?, department),
          offer_id = COALESCE(?, offer_id),
          executor_id = COALESCE(?, executor_id),
          deadline = COALESCE(?, deadline)
      WHERE id = ?
    `).run(title, description, task_type, geo, priority, department, updateOfferId, executor_id, deadline, id);

    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
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

// Оценить выполненную задачу (только заказчик)
router.patch('/:id/rate', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { rating } = req.body;
    const { id } = req.params;

    if (!['bad', 'ok', 'top'].includes(rating)) {
      res.status(400).json({ error: 'Неверная оценка. Допустимые значения: bad, ok, top' });
      return;
    }

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Оценивать может только заказчик
    if (existing.customer_id !== req.user?.userId) {
      res.status(403).json({ error: 'Только заказчик может оценить задачу' });
      return;
    }

    // Оценивать можно только выполненные задачи
    if (existing.status !== 'completed') {
      res.status(400).json({ error: 'Можно оценить только выполненную задачу' });
      return;
    }

    db.prepare('UPDATE tasks SET rating = ? WHERE id = ?').run(rating, id);

    const task = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    res.json(task);
  } catch (error) {
    console.error('Rate task error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить типы тасков
router.get('/types/list', authenticateToken, (_req: Request, res: Response): void => {
  res.json(taskTypeLabels);
});

// ===== ПОДЗАДАЧИ =====

// Получить подзадачи для задачи
router.get('/:id/subtasks', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    // Проверяем существование родительской задачи
    const parentTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);
    if (!parentTask) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    const subtasks = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.parent_task_id = ?
      ORDER BY t.created_at ASC
    `).all(id) as TaskWithUsers[];

    res.json(subtasks);
  } catch (error) {
    console.error('Get subtasks error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать подзадачу (только исполнитель родительской задачи)
router.post('/:id/subtasks', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id: parentTaskId } = req.params;
    const { title, description, task_type, deadline, geo, priority, department, offer_id } = req.body;
    const userId = req.user?.userId;

    // Проверяем родительскую задачу
    const parentTask = db.prepare(`
      SELECT t.*, o.name as offer_name 
      FROM tasks t
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.id = ?
    `).get(parentTaskId) as Task & { offer_name?: string } | undefined;

    if (!parentTask) {
      res.status(404).json({ error: 'Родительская задача не найдена' });
      return;
    }

    // Подзадачу может создать только исполнитель родительской задачи
    if (parentTask.executor_id !== userId) {
      res.status(403).json({ error: 'Только исполнитель задачи может создавать подзадачи' });
      return;
    }

    // Нельзя создавать подзадачи для уже выполненных или отменённых задач
    if (parentTask.status === 'completed' || parentTask.status === 'cancelled') {
      res.status(400).json({ error: 'Нельзя создать подзадачу для завершённой или отменённой задачи' });
      return;
    }

    if (!title || !task_type || !deadline || !priority) {
      res.status(400).json({ error: 'Заголовок, тип, приоритет и дедлайн обязательны' });
      return;
    }

    if (!department) {
      res.status(400).json({ error: 'Необходимо указать отдел для подзадачи' });
      return;
    }

    if (!['buying', 'creo', 'development'].includes(department)) {
      res.status(400).json({ error: 'Неверный отдел' });
      return;
    }

    // Находим руководителя отдела
    const headRole = departmentHeadRole[department as Department];
    const departmentHead = db.prepare('SELECT id FROM users WHERE role = ?').get(headRole) as { id: string } | undefined;
    
    if (!departmentHead) {
      res.status(400).json({ error: `Руководитель отдела "${department}" не найден` });
      return;
    }

    // Обрабатываем offer_id: 'none' означает отсутствие оффера
    // По умолчанию наследуем от родительской задачи
    let finalOfferId = offer_id === 'none' ? null : (offer_id || parentTask.offer_id);

    // Проверяем существование оффера (если указан)
    if (finalOfferId) {
      const offer = db.prepare('SELECT id FROM offers WHERE id = ?').get(finalOfferId);
      if (!offer) {
        res.status(400).json({ error: 'Оффер не найден' });
        return;
      }
    }

    const id = uuidv4();
    const task_number = getNextTaskNumber();
    const finalGeo = geo || parentTask.geo;

    db.prepare(`
      INSERT INTO tasks (id, task_number, title, description, task_type, geo, priority, department, offer_id, customer_id, executor_id, deadline, parent_task_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, task_number, title, description || null, task_type, finalGeo, priority, department, finalOfferId, userId, departmentHead.id, deadline, parentTaskId);

    const subtask = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name, 
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             pt.title as parent_task_title,
             pt.task_number as parent_task_number
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    // Отправляем уведомление исполнителю (руководителю отдела)
    const currentUser = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as { full_name: string } | undefined;
    notifyTaskAssigned(subtask, currentUser?.full_name || 'Пользователь');

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

