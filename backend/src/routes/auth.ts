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

    if (!['admin', 'buyer', 'webdev'].includes(role)) {
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

export default router;

