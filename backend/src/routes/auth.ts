import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { generateToken, authenticateToken } from '../middleware/auth';
import { User, UserPublic } from '../types';

const router = Router();

// Регистрация (только админ может создавать пользователей)
router.post('/register', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только админ может создавать пользователей' });
      return;
    }

    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name || !role) {
      res.status(400).json({ error: 'Все поля обязательны' });
      return;
    }

    if (!['admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head', 'dev_head'].includes(role)) {
      res.status(400).json({ error: 'Неверная роль' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO users (id, username, password, full_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, username, hashedPassword, full_name, role);

    res.status(201).json({ message: 'Пользователь создан', id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Логин
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Логин и пароль обязательны' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    const userPublic: UserPublic = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at
    };

    res.json({ token, user: userPublic });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение текущего пользователя
router.get('/me', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?')
      .get(req.user?.userId) as UserPublic | undefined;

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех пользователей
router.get('/users', authenticateToken, (req: Request, res: Response): void => {
  try {
    const users = db.prepare('SELECT id, username, full_name, role, created_at FROM users ORDER BY full_name')
      .all() as UserPublic[];

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление роли пользователя (только админ)
router.patch('/users/:id/role', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только админ может менять роли' });
      return;
    }

    const { role } = req.body;
    const { id } = req.params;

    if (!['admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head', 'dev_head'].includes(role)) {
      res.status(400).json({ error: 'Неверная роль' });
      return;
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

    const updated = db.prepare('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?')
      .get(id) as UserPublic;

    res.json(updated);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Полное обновление пользователя (только админ)
router.put('/users/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только админ может редактировать пользователей' });
      return;
    }

    const { username, password, full_name, role } = req.body;
    const { id } = req.params;

    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    if (!existingUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Проверяем уникальность логина, если он изменился
    if (username && username !== existingUser.username) {
      const userWithSameUsername = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
      if (userWithSameUsername) {
        res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        return;
      }
    }

    // Валидация роли
    if (role && !['admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head'].includes(role)) {
      res.status(400).json({ error: 'Неверная роль' });
      return;
    }

    // Обновляем данные
    const newUsername = username || existingUser.username;
    const newFullName = full_name || existingUser.full_name;
    const newRole = role || existingUser.role;
    
    // Если пароль передан - хэшируем и обновляем
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET username = ?, password = ?, full_name = ?, role = ? WHERE id = ?')
        .run(newUsername, hashedPassword, newFullName, newRole, id);
    } else {
      db.prepare('UPDATE users SET username = ?, full_name = ?, role = ? WHERE id = ?')
        .run(newUsername, newFullName, newRole, id);
    }

    const updated = db.prepare('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?')
      .get(id) as UserPublic;

    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удаление пользователя (только админ)
router.delete('/users/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только админ может удалять пользователей' });
      return;
    }

    const { id } = req.params;

    // Нельзя удалить самого себя
    if (id === req.user.userId) {
      res.status(400).json({ error: 'Нельзя удалить самого себя' });
      return;
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Удаляем пользователя из отделов
    db.prepare('DELETE FROM user_departments WHERE user_id = ?').run(id);
    
    // Убираем пользователя как руководителя отделов
    db.prepare('DELETE FROM department_heads WHERE user_id = ?').run(id);
    db.prepare('UPDATE departments SET head_id = NULL WHERE head_id = ?').run(id);

    // Удаляем пользователя
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Список доступных дополнительных прав
const AVAILABLE_PERMISSIONS = [
  { code: 'manage_offers', label: 'Управление офферами', description: 'Создание и редактирование офферов' },
  { code: 'manage_partners', label: 'Управление партнёрками', description: 'Создание и редактирование партнёрок' },
  { code: 'manage_knowledge', label: 'Управление базой знаний', description: 'Создание и редактирование инструкций' },
  { code: 'view_all_tasks', label: 'Просмотр всех задач', description: 'Видеть задачи всех пользователей' },
];

// Получить список доступных прав
router.get('/permissions/list', authenticateToken, (req: Request, res: Response): void => {
  res.json(AVAILABLE_PERMISSIONS);
});

// Получить права пользователя
router.get('/users/:id/permissions', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только админ может просматривать права' });
      return;
    }

    const { id } = req.params;
    const permissions = db.prepare(`
      SELECT permission FROM user_permissions WHERE user_id = ?
    `).all(id) as { permission: string }[];

    res.json(permissions.map(p => p.permission));
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить права пользователя (только админ)
router.put('/users/:id/permissions', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Только админ может менять права' });
      return;
    }

    const { id } = req.params;
    const { permissions } = req.body as { permissions: string[] };

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Валидация прав
    const validPermissions = AVAILABLE_PERMISSIONS.map(p => p.code);
    const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      res.status(400).json({ error: `Неизвестные права: ${invalidPerms.join(', ')}` });
      return;
    }

    // Удаляем старые права
    db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(id);

    // Добавляем новые
    const insertStmt = db.prepare(`
      INSERT INTO user_permissions (id, user_id, permission, granted_by)
      VALUES (?, ?, ?, ?)
    `);

    const { v4: uuidv4 } = require('uuid');
    for (const perm of permissions) {
      insertStmt.run(uuidv4(), id, perm, req.user.userId);
    }

    res.json({ message: 'Права обновлены', permissions });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверить есть ли у текущего пользователя определённое право
router.get('/me/permissions', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const permissions = db.prepare(`
      SELECT permission FROM user_permissions WHERE user_id = ?
    `).all(userId) as { permission: string }[];

    res.json(permissions.map(p => p.permission));
  } catch (error) {
    console.error('Get my permissions error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Смена пароля (пользователь меняет свой пароль)
router.post('/change-password', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user?.userId;

    if (!old_password || !new_password) {
      res.status(400).json({ error: 'Старый и новый пароль обязательны' });
      return;
    }

    if (new_password.length < 4) {
      res.status(400).json({ error: 'Новый пароль должен быть не менее 4 символов' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Проверяем старый пароль
    const validPassword = bcrypt.compareSync(old_password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Неверный старый пароль' });
      return;
    }

    // Хэшируем и сохраняем новый пароль
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение настроек персонализации
router.get('/me/settings', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const user = db.prepare('SELECT settings FROM users WHERE id = ?').get(userId) as { settings: string | null } | undefined;

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (user.settings) {
      try {
        res.json(JSON.parse(user.settings));
      } catch {
        res.json({});
      }
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сохранение настроек персонализации
router.put('/me/settings', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const settings = req.body;

    // Проверяем что настройки не слишком большие (макс 50KB)
    const settingsJson = JSON.stringify(settings);
    if (settingsJson.length > 50000) {
      res.status(400).json({ error: 'Настройки слишком большие' });
      return;
    }

    db.prepare('UPDATE users SET settings = ? WHERE id = ?').run(settingsJson, userId);

    res.json({ message: 'Настройки сохранены', settings });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

