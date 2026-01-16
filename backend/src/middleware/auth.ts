import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import db from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Проверка, есть ли у пользователя дополнительное право
export function hasPermission(userId: string, permission: string): boolean {
  const result = db.prepare(`
    SELECT 1 FROM user_permissions WHERE user_id = ? AND permission = ?
  `).get(userId, permission);
  return !!result;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Получаем токен из заголовка Authorization или из query параметра
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const queryToken = req.query.token as string;
  const token = headerToken || queryToken;

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Неверный или просроченный токен' });
  }
};

// Проверка ролей ИЛИ дополнительного права
export const requireRolesOrPermission = (roles: UserRole[], permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    // Админ всегда может всё
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Проверяем роль
    if (roles.includes(req.user.role)) {
      next();
      return;
    }

    // Проверяем дополнительное право
    if (hasPermission(req.user.userId, permission)) {
      next();
      return;
    }

    res.status(403).json({ error: 'Недостаточно прав для выполнения этого действия' });
  };
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Недостаточно прав для выполнения этого действия' });
      return;
    }

    next();
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Только администратор может выполнить это действие' });
    return;
  }

  next();
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export { JWT_SECRET };

