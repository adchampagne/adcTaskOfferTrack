import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken, hasPermission } from '../middleware/auth';

const router = Router();

interface Category {
  id: string;
  department_code: string;
  title: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

interface Instruction {
  id: string;
  category_id: string;
  title: string;
  content: string;
  tags: string | null;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Маппинг отдел -> роль руководителя
const departmentHeadRoles: Record<string, string> = {
  'buying': 'buying_head',
  'creo': 'creo_head',
  'development': 'dev_head',
};

// Допустимые коды отделов (включая general для общих инструкций)
const validDepartmentCodes = ['buying', 'creo', 'development', 'general'];

// Проверка, является ли пользователь руководителем отдела
function isDepartmentHead(userId: string, departmentCode: string): boolean {
  // Проверяем по department_heads
  const result = db.prepare(`
    SELECT 1 FROM department_heads dh
    JOIN departments d ON dh.department_id = d.id
    WHERE dh.user_id = ? AND d.code = ?
  `).get(userId, departmentCode);
  
  if (result) {
    return true;
  }

  // Также проверяем по роли пользователя
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
  const expectedRole = departmentHeadRoles[departmentCode];
  
  return user?.role === expectedRole;
}

// Получить категории и инструкции для отдела
router.get('/:departmentCode', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { departmentCode } = req.params;
    
    if (!validDepartmentCodes.includes(departmentCode)) {
      res.status(400).json({ error: 'Неверный код отдела' });
      return;
    }

    const categories = db.prepare(`
      SELECT * FROM knowledge_categories 
      WHERE department_code = ? 
      ORDER BY sort_order ASC, created_at ASC
    `).all(departmentCode) as Category[];

    const result = categories.map(category => {
      const instructions = db.prepare(`
        SELECT * FROM knowledge_instructions 
        WHERE category_id = ? 
        ORDER BY sort_order ASC, created_at ASC
      `).all(category.id) as Instruction[];

      return {
        ...category,
        instructions: instructions.map(inst => ({
          ...inst,
          tags: inst.tags ? JSON.parse(inst.tags) : [],
        })),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать категорию
router.post('/categories', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { department_code, title, icon } = req.body;

    if (!department_code || !title) {
      res.status(400).json({ error: 'Код отдела и название обязательны' });
      return;
    }

    if (!validDepartmentCodes.includes(department_code)) {
      res.status(400).json({ error: 'Неверный код отдела' });
      return;
    }

    // Проверяем права - только руководитель отдела или админ (для general - только админ)
    const userRole = req.user?.role;
    const canEditGeneral = department_code === 'general' && userRole === 'admin';
    const canEditDepartment = department_code !== 'general' && (userRole === 'admin' || isDepartmentHead(userId!, department_code));
    
    if (!canEditGeneral && !canEditDepartment) {
      res.status(403).json({ error: department_code === 'general' 
        ? 'Только администратор может редактировать общие инструкции' 
        : 'Только руководитель отдела может создавать категории' 
      });
      return;
    }

    const id = uuidv4();
    const maxOrder = db.prepare(`
      SELECT MAX(sort_order) as max_order FROM knowledge_categories WHERE department_code = ?
    `).get(department_code) as { max_order: number | null };

    db.prepare(`
      INSERT INTO knowledge_categories (id, department_code, title, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, department_code, title, icon || 'FileText', (maxOrder.max_order || 0) + 1);

    const category = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(id);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить категорию
router.patch('/categories/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, icon, sort_order } = req.body;

    const category = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(id) as Category | undefined;
    if (!category) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }

    // Проверяем права
    const userRole = req.user?.role;
    if (userRole !== 'admin' && !isDepartmentHead(userId!, category.department_code)) {
      res.status(403).json({ error: 'Только руководитель отдела может редактировать категории' });
      return;
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE knowledge_categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить категорию
router.delete('/categories/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const category = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(id) as Category | undefined;
    if (!category) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }

    // Проверяем права
    const userRole = req.user?.role;
    if (userRole !== 'admin' && !isDepartmentHead(userId!, category.department_code)) {
      res.status(403).json({ error: 'Только руководитель отдела может удалять категории' });
      return;
    }

    db.prepare('DELETE FROM knowledge_categories WHERE id = ?').run(id);
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать инструкцию
router.post('/instructions', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { category_id, title, content, tags } = req.body;

    if (!category_id || !title || !content) {
      res.status(400).json({ error: 'Категория, название и содержимое обязательны' });
      return;
    }

    const category = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(category_id) as Category | undefined;
    if (!category) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }

    // Проверяем права
    const userRole = req.user?.role;
    if (userRole !== 'admin' && !isDepartmentHead(userId!, category.department_code)) {
      res.status(403).json({ error: 'Только руководитель отдела может создавать инструкции' });
      return;
    }

    const id = uuidv4();
    const maxOrder = db.prepare(`
      SELECT MAX(sort_order) as max_order FROM knowledge_instructions WHERE category_id = ?
    `).get(category_id) as { max_order: number | null };

    db.prepare(`
      INSERT INTO knowledge_instructions (id, category_id, title, content, tags, sort_order, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      category_id,
      title,
      content,
      tags ? JSON.stringify(tags) : null,
      (maxOrder.max_order || 0) + 1,
      userId,
      userId
    );

    const instruction = db.prepare('SELECT * FROM knowledge_instructions WHERE id = ?').get(id) as Instruction;
    res.status(201).json({
      ...instruction,
      tags: instruction.tags ? JSON.parse(instruction.tags) : [],
    });
  } catch (error) {
    console.error('Create instruction error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить инструкцию
router.patch('/instructions/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, content, tags, sort_order, category_id } = req.body;

    const instruction = db.prepare('SELECT * FROM knowledge_instructions WHERE id = ?').get(id) as Instruction | undefined;
    if (!instruction) {
      res.status(404).json({ error: 'Инструкция не найдена' });
      return;
    }

    const category = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(instruction.category_id) as Category;

    // Проверяем права
    const userRole = req.user?.role;
    if (userRole !== 'admin' && !isDepartmentHead(userId!, category.department_code)) {
      res.status(403).json({ error: 'Только руководитель отдела может редактировать инструкции' });
      return;
    }

    const updates: string[] = ['updated_by = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: (string | number | null)[] = [userId!];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(tags ? JSON.stringify(tags) : null);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(category_id);
    }

    values.push(id);
    db.prepare(`UPDATE knowledge_instructions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM knowledge_instructions WHERE id = ?').get(id) as Instruction;
    res.json({
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : [],
    });
  } catch (error) {
    console.error('Update instruction error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить инструкцию
router.delete('/instructions/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const instruction = db.prepare('SELECT * FROM knowledge_instructions WHERE id = ?').get(id) as Instruction | undefined;
    if (!instruction) {
      res.status(404).json({ error: 'Инструкция не найдена' });
      return;
    }

    const category = db.prepare('SELECT * FROM knowledge_categories WHERE id = ?').get(instruction.category_id) as Category;

    // Проверяем права
    const userRole = req.user?.role;
    if (userRole !== 'admin' && !isDepartmentHead(userId!, category.department_code)) {
      res.status(403).json({ error: 'Только руководитель отдела может удалять инструкции' });
      return;
    }

    db.prepare('DELETE FROM knowledge_instructions WHERE id = ?').run(id);
    res.json({ message: 'Инструкция удалена' });
  } catch (error) {
    console.error('Delete instruction error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка прав на редактирование
router.get('/:departmentCode/can-edit', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { departmentCode } = req.params;

    if (!validDepartmentCodes.includes(departmentCode)) {
      res.status(400).json({ error: 'Неверный код отдела' });
      return;
    }

    // Для general - только админ может редактировать
    if (departmentCode === 'general') {
      res.json({ canEdit: userRole === 'admin' });
      return;
    }

    const canEdit = userRole === 'admin' || isDepartmentHead(userId!, departmentCode) || hasPermission(userId!, 'manage_knowledge');
    res.json({ canEdit });
  } catch (error) {
    console.error('Check edit rights error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

