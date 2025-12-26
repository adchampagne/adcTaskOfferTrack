import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken, requireRoles, requireRolesOrPermission } from '../middleware/auth';
import { Partner } from '../types';

const router = Router();

// Получить все партнёрки
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const partners = db.prepare(`
      SELECT p.*, u.full_name as creator_name
      FROM partners p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.name
    `).all();

    res.json(partners);
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить партнёрку по ID
router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const partner = db.prepare(`
      SELECT p.*, u.full_name as creator_name
      FROM partners p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!partner) {
      res.status(404).json({ error: 'Партнёрка не найдена' });
      return;
    }

    res.json(partner);
  } catch (error) {
    console.error('Get partner error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать партнёрку (админ, байер ИЛИ с правом manage_partners)
router.post('/', authenticateToken, requireRolesOrPermission(['admin', 'buyer'], 'manage_partners'), (req: Request, res: Response): void => {
  try {
    const { name, description, website } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Название партнёрки обязательно' });
      return;
    }

    const existing = db.prepare('SELECT id FROM partners WHERE name = ?').get(name);
    if (existing) {
      res.status(400).json({ error: 'Партнёрка с таким названием уже существует' });
      return;
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO partners (id, name, description, website, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description || null, website || null, req.user?.userId);

    const partner = db.prepare('SELECT * FROM partners WHERE id = ?').get(id) as Partner;

    res.status(201).json(partner);
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить партнёрку (админ, байер ИЛИ с правом manage_partners)
router.put('/:id', authenticateToken, requireRolesOrPermission(['admin', 'buyer'], 'manage_partners'), (req: Request, res: Response): void => {
  try {
    const { name, description, website } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM partners WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Партнёрка не найдена' });
      return;
    }

    if (name) {
      const duplicate = db.prepare('SELECT id FROM partners WHERE name = ? AND id != ?').get(name, id);
      if (duplicate) {
        res.status(400).json({ error: 'Партнёрка с таким названием уже существует' });
        return;
      }
    }

    db.prepare(`
      UPDATE partners 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          website = COALESCE(?, website)
      WHERE id = ?
    `).run(name, description, website, id);

    const partner = db.prepare('SELECT * FROM partners WHERE id = ?').get(id) as Partner;

    res.json(partner);
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить партнёрку (только админ)
router.delete('/:id', authenticateToken, requireRoles('admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM partners WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Партнёрка не найдена' });
      return;
    }

    db.prepare('DELETE FROM partners WHERE id = ?').run(id);

    res.json({ message: 'Партнёрка удалена' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

