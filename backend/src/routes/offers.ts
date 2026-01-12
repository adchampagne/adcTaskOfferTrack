import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken, requireRoles, requireRolesOrPermission } from '../middleware/auth';
import { Offer } from '../types';

const router = Router();

// Получить все офферы
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { partner_id } = req.query;

    let query = `
      SELECT o.*, p.name as partner_name, u.full_name as creator_name
      FROM offers o
      LEFT JOIN partners p ON o.partner_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
    `;

    const params: string[] = [];
    if (partner_id) {
      query += ' WHERE o.partner_id = ?';
      params.push(partner_id as string);
    }

    query += ' ORDER BY o.created_at DESC';

    const offers = db.prepare(query).all(...params);

    res.json(offers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить оффер по ID
router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const offer = db.prepare(`
      SELECT o.*, p.name as partner_name, u.full_name as creator_name
      FROM offers o
      LEFT JOIN partners p ON o.partner_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!offer) {
      res.status(404).json({ error: 'Оффер не найден' });
      return;
    }

    res.json(offer);
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать оффер (админ, байер, бизДев, руководитель баинга ИЛИ с правом manage_offers)
router.post('/', authenticateToken, requireRolesOrPermission(['admin', 'buyer', 'bizdev', 'buying_head'], 'manage_offers'), (req: Request, res: Response): void => {
  try {
    const { partner_id, name, theme, geo, payment_type, partner_link, landing_price, promo_link, payout } = req.body;

    if (!partner_id || !name || !theme || !geo) {
      res.status(400).json({ error: 'Партнёрка, название, тематика и GEO обязательны' });
      return;
    }

    const partner = db.prepare('SELECT id FROM partners WHERE id = ?').get(partner_id);
    if (!partner) {
      res.status(400).json({ error: 'Партнёрка не найдена' });
      return;
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO offers (id, partner_id, name, theme, geo, payment_type, partner_link, landing_price, promo_link, payout, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, partner_id, name, theme, geo || null, payment_type || null, partner_link || null, landing_price || null, promo_link || null, payout || null, req.user?.userId);

    const offer = db.prepare(`
      SELECT o.*, p.name as partner_name
      FROM offers o
      LEFT JOIN partners p ON o.partner_id = p.id
      WHERE o.id = ?
    `).get(id);

    res.status(201).json(offer);
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить оффер (админ, бизДев, руководитель баинга ИЛИ с правом manage_offers)
router.put('/:id', authenticateToken, requireRolesOrPermission(['admin', 'bizdev', 'buying_head'], 'manage_offers'), (req: Request, res: Response): void => {
  try {
    const { partner_id, name, theme, geo, payment_type, partner_link, landing_price, promo_link, payout } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM offers WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Оффер не найден' });
      return;
    }

    if (partner_id) {
      const partner = db.prepare('SELECT id FROM partners WHERE id = ?').get(partner_id);
      if (!partner) {
        res.status(400).json({ error: 'Партнёрка не найдена' });
        return;
      }
    }

    db.prepare(`
      UPDATE offers 
      SET partner_id = COALESCE(?, partner_id),
          name = COALESCE(?, name),
          theme = COALESCE(?, theme),
          geo = ?,
          payment_type = ?,
          partner_link = COALESCE(?, partner_link),
          landing_price = COALESCE(?, landing_price),
          promo_link = COALESCE(?, promo_link),
          payout = COALESCE(?, payout)
      WHERE id = ?
    `).run(partner_id, name, theme, geo || null, payment_type || null, partner_link, landing_price, promo_link, payout, id);

    const offer = db.prepare(`
      SELECT o.*, p.name as partner_name
      FROM offers o
      LEFT JOIN partners p ON o.partner_id = p.id
      WHERE o.id = ?
    `).get(id) as Offer;

    res.json(offer);
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить оффер (только админ)
router.delete('/:id', authenticateToken, requireRoles('admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM offers WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Оффер не найден' });
      return;
    }

    db.prepare('DELETE FROM offers WHERE id = ?').run(id);

    res.json({ message: 'Оффер удалён' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

