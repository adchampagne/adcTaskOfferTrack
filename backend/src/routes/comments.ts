import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from '../middleware/auth';
import { notifyTaskComment } from './notifications';

const router = Router();

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_username?: string;
}

// Получить комментарии к задаче
router.get('/task/:taskId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params;

    // Проверяем существование задачи
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    const comments = db.prepare(`
      SELECT c.*, u.full_name as user_name, u.username as user_username
      FROM task_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(taskId) as TaskComment[];

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Интерфейс для задачи с полной информацией
interface TaskForNotification {
  id: string;
  task_number?: number;
  title: string;
  description?: string | null;
  deadline?: string;
  geo?: string | null;
  department?: string | null;
  customer_id: string;
  executor_id: string;
}

// Добавить комментарий к задаче
router.post('/task/:taskId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Сообщение не может быть пустым' });
      return;
    }

    // Проверяем существование задачи и получаем полную информацию
    const task = db.prepare(`
      SELECT id, task_number, title, description, deadline, geo, department, customer_id, executor_id 
      FROM tasks WHERE id = ?
    `).get(taskId) as TaskForNotification | undefined;
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO task_comments (id, task_id, user_id, message)
      VALUES (?, ?, ?, ?)
    `).run(id, taskId, userId, message.trim());

    const comment = db.prepare(`
      SELECT c.*, u.full_name as user_name, u.username as user_username
      FROM task_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id) as TaskComment;

    // Отправляем уведомления связанным пользователям
    if (userId && comment.user_name) {
      notifyTaskComment(task, userId, comment.user_name, message.trim());
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить комментарий (только автор или админ)
router.delete('/:commentId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as TaskComment | undefined;

    if (!comment) {
      res.status(404).json({ error: 'Комментарий не найден' });
      return;
    }

    // Удалять может только автор или админ
    if (comment.user_id !== userId && userRole !== 'admin') {
      res.status(403).json({ error: 'Недостаточно прав для удаления комментария' });
      return;
    }

    db.prepare('DELETE FROM task_comments WHERE id = ?').run(commentId);

    res.json({ message: 'Комментарий удалён' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

