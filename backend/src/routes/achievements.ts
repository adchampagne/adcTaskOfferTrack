import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
  sort_order: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

// Получить все достижения с информацией о том, какие получил текущий пользователь
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;

    const achievements = db.prepare(`
      SELECT a.*, 
             ua.earned_at,
             CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as earned
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY a.category, a.sort_order
    `).all(userId) as (Achievement & { earned: number; earned_at: string | null })[];

    // Группируем по категориям
    const grouped = achievements.reduce((acc, a) => {
      if (!acc[a.category]) {
        acc[a.category] = [];
      }
      acc[a.category].push({
        ...a,
        earned: Boolean(a.earned),
      });
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      achievements: grouped,
      total: achievements.length,
      earned: achievements.filter(a => a.earned).length,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить достижения конкретного пользователя
router.get('/user/:userId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;

    const achievements = db.prepare(`
      SELECT a.*, ua.earned_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `).all(userId) as (Achievement & { earned_at: string })[];

    res.json(achievements);
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверить и начислить достижения для пользователя
router.post('/check', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const newAchievements = checkAndGrantAchievements(userId);

    res.json({
      newAchievements,
      message: newAchievements.length > 0 
        ? `Получено достижений: ${newAchievements.length}` 
        : 'Новых достижений нет'
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Лидерборд по отделу
router.get('/leaderboard/:departmentCode', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { departmentCode } = req.params;
    const { period = 'month' } = req.query; // week, month, all

    // Определяем дату начала периода
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND t.completed_at >= date('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "AND t.completed_at >= date('now', '-30 days')";
    }

    // Получаем статистику по пользователям отдела
    const leaderboard = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        COUNT(DISTINCT t.id) as completed_tasks,
        COUNT(DISTINCT CASE WHEN t.rating = 'top' THEN t.id END) as top_rated,
        COUNT(DISTINCT CASE WHEN t.completed_at < t.deadline THEN t.id END) as early_completed,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as achievements_count
      FROM users u
      JOIN user_departments ud ON u.id = ud.user_id
      JOIN departments d ON ud.department_id = d.id
      LEFT JOIN tasks t ON t.executor_id = u.id AND t.status = 'completed' ${dateFilter}
      WHERE d.code = ?
      GROUP BY u.id
      ORDER BY completed_tasks DESC, top_rated DESC, early_completed DESC
    `).all(departmentCode) as {
      id: string;
      username: string;
      full_name: string;
      role: string;
      completed_tasks: number;
      top_rated: number;
      early_completed: number;
      achievements_count: number;
    }[];

    // Получаем информацию об отделе
    const department = db.prepare(`
      SELECT id, name, code FROM departments WHERE code = ?
    `).get(departmentCode) as { id: string; name: string; code: string } | undefined;

    res.json({
      department,
      period,
      leaderboard: leaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      })),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Функция расчёта стрика рабочих дней (пн-пт)
function calculateWorkdayStreak(userId: string): number {
  // Получаем все уникальные даты выполнения задач
  const completedDates = db.prepare(`
    SELECT DISTINCT date(completed_at) as date_only
    FROM tasks 
    WHERE executor_id = ? AND status = 'completed' AND completed_at IS NOT NULL
    ORDER BY date_only DESC
  `).all(userId) as { date_only: string }[];
  
  if (completedDates.length === 0) return 0;
  
  // Создаём Set для быстрой проверки дат
  const completedSet = new Set(completedDates.map(d => d.date_only));
  
  // Функция проверки рабочего дня (0=вс, 1=пн, ..., 6=сб)
  const isWorkday = (date: Date): boolean => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Пн-Пт
  };
  
  // Функция получения предыдущего рабочего дня
  const getPreviousWorkday = (date: Date): Date => {
    const prev = new Date(date);
    do {
      prev.setDate(prev.getDate() - 1);
    } while (!isWorkday(prev));
    return prev;
  };
  
  // Функция форматирования даты в YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Начинаем с сегодня и ищем текущий/последний рабочий день
  let currentDate = new Date();
  currentDate.setHours(12, 0, 0, 0); // Убираем проблемы с часовыми поясами
  
  // Если сегодня выходной, начинаем с последней пятницы
  while (!isWorkday(currentDate)) {
    currentDate = getPreviousWorkday(currentDate);
  }
  
  let streak = 0;
  
  // Считаем стрик: идём назад по рабочим дням
  while (true) {
    const dateStr = formatDate(currentDate);
    
    if (completedSet.has(dateStr)) {
      streak++;
      currentDate = getPreviousWorkday(currentDate);
    } else {
      // Если в текущий рабочий день нет задач - проверяем, может это сегодня 
      // и день ещё не закончился, тогда смотрим предыдущий рабочий день
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      if (formatDate(currentDate) === formatDate(today)) {
        // Сегодня ещё не выполнили задачу - проверяем стрик от вчера
        currentDate = getPreviousWorkday(currentDate);
        continue;
      }
      
      // Стрик прерывается
      break;
    }
  }
  
  return streak;
}

// Функция проверки и начисления достижений
export function checkAndGrantAchievements(userId: string): Achievement[] {
  const newAchievements: Achievement[] = [];

  // Получаем статистику пользователя
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_completed,
      COUNT(CASE WHEN rating = 'top' THEN 1 END) as top_rated,
      COUNT(CASE WHEN completed_at < deadline THEN 1 END) as early_completed
    FROM tasks 
    WHERE executor_id = ? AND status = 'completed'
  `).get(userId) as { total_completed: number; top_rated: number; early_completed: number };

  // Получаем дату регистрации
  const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId) as { created_at: string } | undefined;
  const daysInSystem = user ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Статистика по времени выполнения
  const timeStats = db.prepare(`
    SELECT 
      COUNT(CASE WHEN CAST(strftime('%H', completed_at) AS INTEGER) < 9 THEN 1 END) as early_morning,
      COUNT(CASE WHEN CAST(strftime('%H', completed_at) AS INTEGER) >= 22 THEN 1 END) as late_night
    FROM tasks 
    WHERE executor_id = ? AND status = 'completed' AND completed_at IS NOT NULL
  `).get(userId) as { early_morning: number; late_night: number };

  // Количество комментариев
  const commentsCount = db.prepare(`
    SELECT COUNT(*) as count FROM task_comments WHERE user_id = ?
  `).get(userId) as { count: number };

  // Количество подзадач, где пользователь участвовал
  const subtasksCount = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE executor_id = ? AND parent_task_id IS NOT NULL AND status = 'completed'
  `).get(userId) as { count: number };

  // Количество оценок "Топ", которые пользователь поставил как заказчик
  const mentorCount = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE customer_id = ? AND rating = 'top'
  `).get(userId) as { count: number };

  // Задачи за последнюю неделю
  const weekTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE executor_id = ? AND status = 'completed' 
    AND completed_at >= datetime('now', '-7 days')
  `).get(userId) as { count: number };

  // Уникальные типы задач
  const uniqueTaskTypes = db.prepare(`
    SELECT COUNT(DISTINCT task_type) as count FROM tasks 
    WHERE executor_id = ? AND status = 'completed'
  `).get(userId) as { count: number };

  // Задачи выполненные ровно в дедлайн (в тот же день)
  const onTimeExact = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE executor_id = ? AND status = 'completed' 
    AND date(completed_at) = date(deadline)
  `).get(userId) as { count: number };

  // Задачи выполненные в выходные (0 = воскресенье, 6 = суббота)
  const weekendTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE executor_id = ? AND status = 'completed' AND completed_at IS NOT NULL
    AND (CAST(strftime('%w', completed_at) AS INTEGER) = 0 
         OR CAST(strftime('%w', completed_at) AS INTEGER) = 6)
  `).get(userId) as { count: number };

  // Получаем все достижения
  const allAchievements = db.prepare('SELECT * FROM achievements').all() as Achievement[];

  // Получаем уже полученные достижения
  const earnedIds = db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?')
    .all(userId)
    .map((ua: any) => ua.achievement_id);

  for (const achievement of allAchievements) {
    // Пропускаем уже полученные
    if (earnedIds.includes(achievement.id)) continue;

    let earned = false;

    switch (achievement.category) {
      case 'tasks':
        earned = stats.total_completed >= achievement.threshold;
        break;
      case 'quality':
        earned = stats.top_rated >= achievement.threshold;
        break;
      case 'speed':
        earned = stats.early_completed >= achievement.threshold;
        break;
      case 'special':
        switch (achievement.code) {
          case 'first_task':
            earned = stats.total_completed >= 1;
            break;
          case 'veteran_year':
            earned = daysInSystem >= 365;
            break;
          case 'veteran_2years':
            earned = daysInSystem >= 730;
            break;
          case 'early_bird':
            earned = timeStats.early_morning >= achievement.threshold;
            break;
          case 'night_owl':
            earned = timeStats.late_night >= achievement.threshold;
            break;
          case 'commentator':
            earned = commentsCount.count >= achievement.threshold;
            break;
          case 'team_player':
            earned = subtasksCount.count >= achievement.threshold;
            break;
          case 'mentor':
            earned = mentorCount.count >= achievement.threshold;
            break;
          case 'marathon':
            earned = weekTasks.count >= achievement.threshold;
            break;
          case 'universal':
            earned = uniqueTaskTypes.count >= achievement.threshold;
            break;
          case 'prophet':
            earned = onTimeExact.count >= achievement.threshold;
            break;
          case 'weekend_warrior':
            earned = weekendTasks.count >= achievement.threshold;
            break;
          // Отделные и редкие достижения проверяются отдельно
        }
        break;
      case 'streak':
        // Стрик рабочих дней (пн-пт, выходные пропускаются)
        const currentStreak = calculateWorkdayStreak(userId);
        earned = currentStreak >= achievement.threshold;
        break;
    }

    if (earned) {
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), userId, achievement.id);
      
      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

export default router;

