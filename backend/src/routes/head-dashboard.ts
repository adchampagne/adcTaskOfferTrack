import { Router, Request, Response } from 'express';
import db, { getNextTaskNumber } from '../database';
import { authenticateToken } from '../middleware/auth';
import { TaskWithUsers, Department } from '../types';
import { notifyTaskReassigned } from './notifications';
import { v4 as uuidv4 } from 'uuid';

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

// Роли, связанные с отделами
const departmentRoles: Record<string, string[]> = {
  'buying': ['buyer', 'bizdev', 'buying_head'],
  'creo': ['creo_manager', 'creo_head'],
  'development': ['webdev', 'dev_head']
};

// Получить сотрудников отдела (из user_departments)
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

// Получить всех сотрудников отдела (из user_departments + по ролям)
function getAllDepartmentMembers(departmentId: string, departmentCode: string): DepartmentMember[] {
  const fromUserDepartments = getDepartmentMembers(departmentId);
  const memberIds = new Set(fromUserDepartments.map(m => m.user_id));
  
  // Также добавляем пользователей с ролями этого отдела
  const roles = departmentRoles[departmentCode] || [];
  if (roles.length > 0) {
    const placeholders = roles.map(() => '?').join(',');
    const byRole = db.prepare(`
      SELECT 
        u.id as user_id,
        u.full_name as user_name,
        u.username as user_username,
        u.role as user_role
      FROM users u
      WHERE u.role IN (${placeholders})
      ORDER BY u.full_name ASC
    `).all(...roles) as DepartmentMember[];
    
    for (const member of byRole) {
      if (!memberIds.has(member.user_id)) {
        fromUserDepartments.push(member);
        memberIds.add(member.user_id);
      }
    }
  }
  
  return fromUserDepartments;
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

// Получить задачи, созданные сотрудниками моего отдела (для внешних отделов)
router.get('/created-by-members', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    // Используем расширенный список сотрудников (user_departments + по ролям)
    const members = getAllDepartmentMembers(department.id, department.code);
    const memberIds = members.map(m => m.user_id);
    
    // Исключаем самого руководителя из списка - его задачи он видит и так
    const filteredMemberIds = memberIds.filter(id => id !== userId);

    if (filteredMemberIds.length === 0) {
      res.json([]);
      return;
    }

    const placeholders = filteredMemberIds.map(() => '?').join(',');
    
    // Показываем задачи, созданные сотрудниками отдела (НЕ руководителем)
    // на другие отделы или без указания отдела
    const tasks = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name,
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             o.promo_link as offer_promo_link,
             pt.title as parent_task_title,
             pt.task_number as parent_task_number
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      WHERE t.customer_id IN (${placeholders})
      ORDER BY 
        CASE t.status 
          WHEN 'in_progress' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'completed' THEN 3 
          WHEN 'cancelled' THEN 4 
        END,
        t.created_at DESC
    `).all(...filteredMemberIds) as TaskWithUsers[];

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks created by members error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить задачу, созданную сотрудником (руководитель может редактировать)
router.put('/created-by-members/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, description, task_type, executor_id, deadline, geo, priority, department: taskDepartment, offer_id } = req.body;

    const headDepartment = getHeadDepartment(userId!);
    
    if (!headDepartment) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    // Получаем сотрудников отдела (расширенный список)
    const members = getAllDepartmentMembers(headDepartment.id, headDepartment.code);
    const memberIds = members.map(m => m.user_id);

    // Проверяем, что задача создана сотрудником отдела
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskWithUsers | undefined;
    
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    if (!memberIds.includes(task.customer_id)) {
      res.status(403).json({ error: 'Эта задача не создана сотрудником вашего отдела' });
      return;
    }

    // Сохраняем старого исполнителя для проверки изменения
    const oldExecutorId = task.executor_id;

    // Проверяем существование нового исполнителя
    if (executor_id) {
      const executor = db.prepare('SELECT id FROM users WHERE id = ?').get(executor_id);
      if (!executor) {
        res.status(400).json({ error: 'Исполнитель не найден' });
        return;
      }
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
    `).run(title, description, task_type, geo, priority, taskDepartment, updateOfferId, executor_id, deadline, id);

    const updated = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name,
             c.username as customer_username,
             e.full_name as executor_name,
             e.username as executor_username,
             o.name as offer_name,
             o.promo_link as offer_promo_link
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      LEFT JOIN users e ON t.executor_id = e.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers;

    // Если исполнитель изменился - уведомляем нового исполнителя
    if (executor_id && executor_id !== oldExecutorId) {
      const headUser = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as { full_name: string } | undefined;
      notifyTaskReassigned(updated, headUser?.full_name || 'Руководитель', executor_id);
    }

    res.json(updated);
  } catch (error) {
    console.error('Update task created by member error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить задачу, созданную сотрудником (руководитель может удалить)
router.delete('/created-by-members/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const headDepartment = getHeadDepartment(userId!);
    
    if (!headDepartment) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    // Получаем сотрудников отдела (расширенный список)
    const members = getAllDepartmentMembers(headDepartment.id, headDepartment.code);
    const memberIds = members.map(m => m.user_id);

    // Проверяем, что задача создана сотрудником отдела
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskWithUsers | undefined;
    
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    if (!memberIds.includes(task.customer_id)) {
      res.status(403).json({ error: 'Эта задача не создана сотрудником вашего отдела' });
      return;
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    res.json({ message: 'Задача удалена' });
  } catch (error) {
    console.error('Delete task created by member error:', error);
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

// Массовое назначение задачи нескольким сотрудникам
// Создаёт копии задачи для каждого выбранного исполнителя
router.post('/tasks/:id/assign-multiple', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { executor_ids } = req.body as { executor_ids: string[] };

    if (!executor_ids || !Array.isArray(executor_ids) || executor_ids.length === 0) {
      res.status(400).json({ error: 'Необходимо указать хотя бы одного исполнителя' });
      return;
    }

    const department = getHeadDepartment(userId!);
    
    if (!department) {
      res.status(403).json({ error: 'Вы не являетесь руководителем отдела' });
      return;
    }

    // Получаем сотрудников отдела
    const members = getDepartmentMembers(department.id);
    const memberIds = members.map(m => m.user_id);

    // Проверяем, что все указанные исполнители - сотрудники отдела
    const invalidExecutors = executor_ids.filter(eid => !memberIds.includes(eid));
    if (invalidExecutors.length > 0) {
      res.status(400).json({ error: 'Все исполнители должны быть сотрудниками вашего отдела' });
      return;
    }

    // Добавляем руководителя в список для проверки доступа к задаче
    const allMemberIds = [...memberIds, userId!];

    // Получаем оригинальную задачу
    const originalTask = db.prepare(`
      SELECT t.*, 
             c.full_name as customer_name,
             c.username as customer_username
      FROM tasks t
      LEFT JOIN users c ON t.customer_id = c.id
      WHERE t.id = ?
    `).get(id) as TaskWithUsers | undefined;
    
    if (!originalTask) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    // Проверяем, что задача принадлежит отделу (назначена руководителю или сотруднику)
    if (!allMemberIds.includes(originalTask.executor_id)) {
      res.status(403).json({ error: 'Эта задача не принадлежит вашему отделу' });
      return;
    }

    const createdTasks: TaskWithUsers[] = [];
    const headName = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as { full_name: string } | undefined;

    // Если только один исполнитель - просто переназначаем оригинальную задачу
    if (executor_ids.length === 1) {
      const executorId = executor_ids[0];
      const oldExecutorId = originalTask.executor_id;
      
      db.prepare('UPDATE tasks SET executor_id = ? WHERE id = ?').run(executorId, id);
      
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

      if (executorId !== oldExecutorId) {
        notifyTaskReassigned(updated, headName?.full_name || 'Руководитель', executorId);
      }

      res.json({ tasks: [updated], message: 'Задача назначена сотруднику' });
      return;
    }

    // Если несколько исполнителей - создаём копии задачи для каждого
    for (const executorId of executor_ids) {
      const newTaskId = uuidv4();
      const taskNumber = getNextTaskNumber();

      db.prepare(`
        INSERT INTO tasks (
          id, task_number, title, description, task_type, geo, priority, 
          department, offer_id, customer_id, executor_id, deadline, parent_task_id, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        newTaskId,
        taskNumber,
        originalTask.title,
        originalTask.description,
        originalTask.task_type,
        originalTask.geo,
        originalTask.priority,
        originalTask.department,
        originalTask.offer_id,
        originalTask.customer_id,
        executorId,
        originalTask.deadline,
        originalTask.parent_task_id
      );

      const newTask = db.prepare(`
        SELECT t.*, 
               c.full_name as customer_name,
               c.username as customer_username,
               e.full_name as executor_name,
               e.username as executor_username
        FROM tasks t
        LEFT JOIN users c ON t.customer_id = c.id
        LEFT JOIN users e ON t.executor_id = e.id
        WHERE t.id = ?
      `).get(newTaskId) as TaskWithUsers;

      createdTasks.push(newTask);

      // Отправляем уведомление каждому исполнителю
      notifyTaskReassigned(newTask, headName?.full_name || 'Руководитель', executorId);
    }

    // Отменяем оригинальную задачу (опционально - можно удалить или оставить)
    db.prepare("UPDATE tasks SET status = 'cancelled' WHERE id = ?").run(id);

    res.json({ 
      tasks: createdTasks, 
      message: `Задача назначена ${createdTasks.length} сотрудникам` 
    });
  } catch (error) {
    console.error('Assign multiple error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

