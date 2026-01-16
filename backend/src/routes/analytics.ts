import { Router, Request, Response } from 'express';
import db from '../database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Роли с доступом к аналитике
const ANALYTICS_ROLES = ['admin', 'buying_head', 'creo_head', 'dev_head', 'bizdev'];

// Проверка доступа к аналитике
function hasAnalyticsAccess(role: string): boolean {
  return ANALYTICS_ROLES.includes(role);
}

// Получить отдел пользователя (для руководителей)
function getUserDepartment(userId: string, role: string): string | null {
  if (role === 'admin' || role === 'bizdev') {
    return null; // Видят все отделы
  }
  
  const department = db.prepare(`
    SELECT d.code FROM departments d
    JOIN department_heads dh ON d.id = dh.department_id
    WHERE dh.user_id = ?
  `).get(userId) as { code: string } | undefined;
  
  return department?.code || null;
}

// Проверка доступа
router.get('/check-access', authenticateToken, (req: Request, res: Response): void => {
  try {
    const role = req.user?.role;
    
    if (!role || !hasAnalyticsAccess(role)) {
      res.json({ hasAccess: false });
      return;
    }
    
    res.json({ hasAccess: true });
  } catch (error) {
    console.error('Check analytics access error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика выполненных задач по дням (за последние 30 дней)
router.get('/tasks-completed', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!role || !hasAnalyticsAccess(role)) {
      res.status(403).json({ error: 'Нет доступа к аналитике' });
      return;
    }

    const departmentCode = getUserDepartment(userId!, role);
    
    // Получаем данные за последние 30 дней
    const days = 30;
    const results: { date: string; count: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let query = `
        SELECT COUNT(*) as count FROM tasks 
        WHERE status = 'completed' 
        AND date(completed_at) = ?
      `;
      const params: string[] = [dateStr];
      
      // Фильтруем по отделу если нужно
      if (departmentCode) {
        query += ' AND department = ?';
        params.push(departmentCode);
      }
      
      const row = db.prepare(query).get(...params) as { count: number };
      
      results.push({
        date: dateStr,
        count: row.count
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Get tasks completed error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика выполненных задач по неделям (за последние 12 недель)
router.get('/tasks-by-week', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!role || !hasAnalyticsAccess(role)) {
      res.status(403).json({ error: 'Нет доступа к аналитике' });
      return;
    }

    const departmentCode = getUserDepartment(userId!, role);
    
    // Получаем данные за последние 12 недель
    const weeks = 12;
    const results: { week: string; weekStart: string; weekEnd: string; count: number }[] = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      // Находим конец недели (воскресенье)
      const dayOfWeek = endDate.getDay();
      endDate.setDate(endDate.getDate() + (7 - dayOfWeek) % 7);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      let query = `
        SELECT COUNT(*) as count FROM tasks 
        WHERE status = 'completed' 
        AND date(completed_at) >= ? 
        AND date(completed_at) <= ?
      `;
      const params: string[] = [startStr, endStr];
      
      if (departmentCode) {
        query += ' AND department = ?';
        params.push(departmentCode);
      }
      
      const row = db.prepare(query).get(...params) as { count: number };
      
      // Форматируем дату для отображения
      const weekLabel = `${startDate.getDate()}.${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      
      results.push({
        week: weekLabel,
        weekStart: startStr,
        weekEnd: endStr,
        count: row.count
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Get tasks by week error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Среднее время выполнения задач по типам
router.get('/avg-completion-time', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!role || !hasAnalyticsAccess(role)) {
      res.status(403).json({ error: 'Нет доступа к аналитике' });
      return;
    }

    const departmentCode = getUserDepartment(userId!, role);
    
    let query = `
      SELECT 
        task_type,
        COUNT(*) as total_tasks,
        AVG(
          CAST((julianday(completed_at) - julianday(created_at)) * 24 AS REAL)
        ) as avg_hours
      FROM tasks 
      WHERE status = 'completed' 
      AND completed_at IS NOT NULL
    `;
    const params: string[] = [];
    
    if (departmentCode) {
      query += ' AND department = ?';
      params.push(departmentCode);
    }
    
    query += ' GROUP BY task_type ORDER BY avg_hours DESC';
    
    const results = db.prepare(query).all(...params) as Array<{
      task_type: string;
      total_tasks: number;
      avg_hours: number;
    }>;
    
    // Конвертируем часы в более читаемый формат
    const formatted = results.map(r => ({
      task_type: r.task_type,
      total_tasks: r.total_tasks,
      avg_hours: Math.round(r.avg_hours * 10) / 10, // Округляем до 1 знака
      avg_days: Math.round((r.avg_hours / 24) * 10) / 10
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Get avg completion time error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Общая сводка
router.get('/summary', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    if (!role || !hasAnalyticsAccess(role)) {
      res.status(403).json({ error: 'Нет доступа к аналитике' });
      return;
    }

    const departmentCode = getUserDepartment(userId!, role);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const prevMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    
    let baseWhere = "WHERE status = 'completed'";
    const params: Record<string, string[]> = {
      week: [weekAgo],
      month: [monthAgo],
      prevMonth: [prevMonthStart, monthAgo],
      total: [],
      active: []
    };
    
    if (departmentCode) {
      baseWhere += ' AND department = ?';
      params.week.push(departmentCode);
      params.month.push(departmentCode);
      params.prevMonth.push(departmentCode);
      params.total.push(departmentCode);
      params.active.push(departmentCode);
    }
    
    // Задачи за неделю
    const weekTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      ${baseWhere} AND completed_at >= ?
    `).get(...params.week) as { count: number };
    
    // Задачи за месяц
    const monthTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      ${baseWhere} AND completed_at >= ?
    `).get(...params.month) as { count: number };
    
    // Задачи за предыдущий месяц (для сравнения)
    const prevMonthTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      ${baseWhere} AND completed_at >= ? AND completed_at < ?
    `).get(...params.prevMonth) as { count: number };
    
    // Всего выполненных задач
    const totalCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      ${baseWhere}
    `).get(...params.total) as { count: number };
    
    // Активные задачи (pending + in_progress)
    let activeWhere = "WHERE status IN ('pending', 'in_progress')";
    if (departmentCode) {
      activeWhere += ' AND department = ?';
    }
    const activeTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks ${activeWhere}
    `).get(...params.active) as { count: number };
    
    // Рассчитываем изменение по сравнению с прошлым месяцем
    const monthChange = prevMonthTasks.count > 0 
      ? Math.round(((monthTasks.count - prevMonthTasks.count) / prevMonthTasks.count) * 100)
      : 0;
    
    res.json({
      tasksThisWeek: weekTasks.count,
      tasksThisMonth: monthTasks.count,
      monthChange,
      totalCompleted: totalCompleted.count,
      activeTasks: activeTasks.count,
      departmentCode
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика по отделам (только для админа и биздева)
router.get('/by-department', authenticateToken, (req: Request, res: Response): void => {
  try {
    const role = req.user?.role;
    
    if (!role || !['admin', 'bizdev'].includes(role)) {
      res.status(403).json({ error: 'Нет доступа' });
      return;
    }

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const results = db.prepare(`
      SELECT 
        COALESCE(department, 'other') as department,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'completed' AND completed_at >= ? THEN 1 ELSE 0 END) as completed_month
      FROM tasks 
      GROUP BY department
    `).all(monthAgo) as Array<{
      department: string;
      total: number;
      completed: number;
      completed_month: number;
    }>;
    
    res.json(results);
  } catch (error) {
    console.error('Get by department error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Топ исполнителей
router.get('/top-executors', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const period = req.query.period as string || 'month';
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    
    if (!role || !hasAnalyticsAccess(role)) {
      res.status(403).json({ error: 'Нет доступа к аналитике' });
      return;
    }

    const departmentCode = getUserDepartment(userId!, role);
    
    // Вычисляем дату начала и конца периода
    let periodStart: Date;
    let periodEnd: Date | null = null;
    const now = new Date();
    
    // Если переданы кастомные даты
    if (period === 'custom' && dateFrom) {
      periodStart = new Date(dateFrom);
      periodStart.setHours(0, 0, 0, 0);
      if (dateTo) {
        periodEnd = new Date(dateTo);
        periodEnd.setHours(23, 59, 59, 999);
      }
    } else {
      switch (period) {
        case 'day':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Понедельник = начало недели
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          periodStart = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }
    
    const periodStartISO = periodStart.toISOString();
    const periodEndISO = periodEnd ? periodEnd.toISOString() : null;
    
    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.username,
        COUNT(*) as tasks_completed,
        AVG(
          CAST((julianday(t.completed_at) - julianday(t.created_at)) * 24 AS REAL)
        ) as avg_hours_total,
        AVG(
          CASE 
            WHEN t.started_at IS NOT NULL 
            THEN CAST((julianday(t.completed_at) - julianday(t.started_at)) * 24 AS REAL)
            ELSE NULL
          END
        ) as avg_hours_work
      FROM tasks t
      JOIN users u ON t.executor_id = u.id
      WHERE t.status = 'completed' 
      AND t.completed_at >= ?
    `;
    const params: string[] = [periodStartISO];
    
    // Добавляем конец периода если задан
    if (periodEndISO) {
      query += ' AND t.completed_at <= ?';
      params.push(periodEndISO);
    }
    
    if (departmentCode) {
      query += ' AND t.department = ?';
      params.push(departmentCode);
    }
    
    query += `
      GROUP BY u.id
      ORDER BY tasks_completed DESC
      LIMIT 10
    `;
    
    const results = db.prepare(query).all(...params) as Array<{
      id: string;
      full_name: string;
      username: string;
      tasks_completed: number;
      avg_hours_total: number | null;
      avg_hours_work: number | null;
    }>;
    
    const formatted = results.map(r => ({
      ...r,
      avg_hours_total: r.avg_hours_total ? Math.round(r.avg_hours_total * 10) / 10 : null,
      avg_hours_work: r.avg_hours_work ? Math.round(r.avg_hours_work * 10) / 10 : null,
      // Для обратной совместимости оставляем avg_hours
      avg_hours: r.avg_hours_total ? Math.round(r.avg_hours_total * 10) / 10 : 0
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Get top executors error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

