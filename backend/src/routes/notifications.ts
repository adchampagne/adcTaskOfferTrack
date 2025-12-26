import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from '../middleware/auth';
import { sendNotificationToUser } from '../services/telegram';

const router = Router();

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  task_id: string | null;
  is_read: number;
  created_at: string;
}

interface Task {
  id: string;
  task_number?: number;
  title: string;
  description?: string | null;
  deadline?: string;
  geo?: string | null;
  department?: string | null;
  customer_id: string;
  executor_id: string;
  customer_name?: string;
  executor_name?: string;
}

// Названия отделов
const departmentLabels: Record<string, string> = {
  buying: 'Баинг',
  creo: 'Крео',
  development: 'Разработка',
};

// Форматирование даты для уведомлений
function formatDeadline(deadline?: string): string {
  if (!deadline) return '';
  try {
    const date = new Date(deadline);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return deadline;
  }
}

// Обрезать описание до 150 символов
function truncateDescription(desc?: string | null): string {
  if (!desc) return '';
  if (desc.length <= 150) return desc;
  return desc.substring(0, 150) + '...';
}

// Типы уведомлений
export const NotificationTypes = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_REASSIGNED: 'task_reassigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_DEADLINE_SOON: 'task_deadline_soon',
  TASK_OVERDUE: 'task_overdue',
  TASK_COMPLETED: 'task_completed',
} as const;

// Получить уведомления текущего пользователя
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { unread_only } = req.query;

    let query = `
      SELECT n.*, t.title as task_title
      FROM notifications n
      LEFT JOIN tasks t ON n.task_id = t.id
      WHERE n.user_id = ?
    `;

    if (unread_only === 'true') {
      query += ' AND n.is_read = 0';
    }

    query += ' ORDER BY n.created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(userId);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить количество непрочитанных уведомлений
router.get('/unread-count', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;

    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as { count: number };

    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отметить уведомление как прочитанное
router.patch('/:id/read', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!notification) {
      res.status(404).json({ error: 'Уведомление не найдено' });
      return;
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);

    res.json({ message: 'Уведомление прочитано' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отметить все уведомления как прочитанные
router.patch('/read-all', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;

    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
      .run(userId);

    res.json({ message: 'Все уведомления прочитаны' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить уведомление
router.delete('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, userId);

    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ===== Вспомогательные функции для создания уведомлений =====

// Создать уведомление
export function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  taskId?: string
): void {
  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, task_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, type, title, message, taskId || null);

    // Отправляем уведомление в Telegram
    sendNotificationToUser(userId, title, message).catch((err) => {
      console.error('Telegram notification error:', err);
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

// Уведомление о новой задаче (исполнителю/руководителю отдела)
export function notifyTaskAssigned(task: Task, creatorName: string): void {
  if (task.customer_id === task.executor_id) return; // Не уведомляем себя

  const taskNum = task.task_number ? `#${task.task_number}` : '';
  const desc = truncateDescription(task.description);
  const deadline = formatDeadline(task.deadline);
  const geoInfo = task.geo ? ` [${task.geo.toUpperCase()}]` : '';
  const deptInfo = task.department ? departmentLabels[task.department] || task.department : '';
  
  let message = `📋 Задача ${taskNum}${geoInfo}: ${task.title}\n`;
  if (deptInfo) message += `\n🏢 Отдел: ${deptInfo}\n`;
  if (desc) message += `\n${desc}\n`;
  message += `\n👤 Заказчик: ${creatorName}`;
  if (deadline) message += `\n⏰ Дедлайн: ${deadline}`;

  // Если задача назначена на отдел - это уведомление для руководителя
  const title = task.department 
    ? `Новая задача ${taskNum} для отдела ${deptInfo}`
    : `Новая задача ${taskNum}`;

  createNotification(
    task.executor_id,
    NotificationTypes.TASK_ASSIGNED,
    title,
    message,
    task.id
  );
}

// Уведомление о переназначении задачи сотруднику (от руководителя)
export function notifyTaskReassigned(task: Task, headName: string, newExecutorId: string): void {
  if (task.executor_id === newExecutorId) return; // Уже назначен

  const taskNum = task.task_number ? `#${task.task_number}` : '';
  const desc = truncateDescription(task.description);
  const deadline = formatDeadline(task.deadline);
  const geoInfo = task.geo ? ` [${task.geo.toUpperCase()}]` : '';
  const deptInfo = task.department ? departmentLabels[task.department] || task.department : '';
  
  let message = `📋 Задача ${taskNum}${geoInfo}: ${task.title}\n`;
  if (deptInfo) message += `\n🏢 Отдел: ${deptInfo}\n`;
  if (desc) message += `\n${desc}\n`;
  message += `\n👤 Назначил: ${headName}`;
  if (deadline) message += `\n⏰ Дедлайн: ${deadline}`;

  createNotification(
    newExecutorId,
    NotificationTypes.TASK_REASSIGNED,
    `Вам назначена задача ${taskNum}`,
    message,
    task.id
  );
}

// Уведомление об изменении статуса
export function notifyStatusChanged(
  task: Task,
  newStatus: string,
  changedByUserId: string,
  changedByName: string
): void {
  const statusLabels: Record<string, string> = {
    pending: '⏳ Ожидает',
    in_progress: '🔄 В работе',
    completed: '✅ Выполнено',
    cancelled: '❌ Отменено',
  };

  const statusLabel = statusLabels[newStatus] || newStatus;
  const taskNum = task.task_number ? `#${task.task_number}` : '';
  const usersToNotify = new Set<string>();

  // Уведомляем заказчика и исполнителя (кроме того, кто изменил)
  if (task.customer_id !== changedByUserId) {
    usersToNotify.add(task.customer_id);
  }
  if (task.executor_id !== changedByUserId) {
    usersToNotify.add(task.executor_id);
  }

  const message = `📋 Задача ${taskNum}: ${task.title}\n\n${changedByName} изменил статус на: ${statusLabel}`;

  usersToNotify.forEach((userId) => {
    createNotification(
      userId,
      newStatus === 'completed' 
        ? NotificationTypes.TASK_COMPLETED 
        : NotificationTypes.TASK_STATUS_CHANGED,
      newStatus === 'completed' ? `Задача ${taskNum} выполнена` : `Статус задачи ${taskNum} изменён`,
      message,
      task.id
    );
  });
}

// Уведомление о приближающемся дедлайне
export function notifyDeadlineSoon(task: Task): void {
  const usersToNotify = new Set<string>([task.customer_id, task.executor_id]);
  const taskNum = task.task_number ? `#${task.task_number}` : '';
  const deadline = formatDeadline(task.deadline);

  const message = `⚠️ Задача ${taskNum}: ${task.title}\n\nДедлайн: ${deadline}\nОсталось менее 24 часов!`;

  usersToNotify.forEach((userId) => {
    createNotification(
      userId,
      NotificationTypes.TASK_DEADLINE_SOON,
      `Дедлайн задачи ${taskNum} скоро`,
      message,
      task.id
    );
  });
}

// Уведомление о просроченной задаче
export function notifyTaskOverdue(task: Task): void {
  const usersToNotify = new Set<string>([task.customer_id, task.executor_id]);
  const taskNum = task.task_number ? `#${task.task_number}` : '';
  const deadline = formatDeadline(task.deadline);

  const message = `🚨 Задача ${taskNum}: ${task.title}\n\nДедлайн был: ${deadline}\nЗадача просрочена!`;

  usersToNotify.forEach((userId) => {
    createNotification(
      userId,
      NotificationTypes.TASK_OVERDUE,
      `Задача ${taskNum} просрочена!`,
      message,
      task.id
    );
  });
}

export default router;

