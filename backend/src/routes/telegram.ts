import { Router, Request, Response } from 'express';
import db from '../database';
import { authenticateToken } from '../middleware/auth';
import { 
  handleTelegramUpdate, 
  createLinkCode, 
  getTelegramLinkUrl,
  sendTelegramMessage 
} from '../services/telegram';

const router = Router();

// Webhook для Telegram (вызывается Telegram при новых сообщениях)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    await handleTelegramUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(200).json({ ok: true }); // Всегда отвечаем 200, чтобы Telegram не ретраил
  }
});

// Получить ссылку для привязки Telegram
router.get('/link', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Проверяем, уже привязан ли Telegram
    const user = db.prepare('SELECT telegram_chat_id, telegram_username FROM users WHERE id = ?')
      .get(userId) as { telegram_chat_id: string | null; telegram_username: string | null } | undefined;

    if (user?.telegram_chat_id) {
      res.json({ 
        linked: true, 
        telegram_username: user.telegram_username 
      });
      return;
    }

    // Создаём код привязки
    const code = createLinkCode(userId);
    const linkUrl = await getTelegramLinkUrl(code);

    res.json({ 
      linked: false, 
      link_url: linkUrl,
      code 
    });
  } catch (error) {
    console.error('Get telegram link error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отвязать Telegram
router.delete('/unlink', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    // Получаем chat_id перед удалением для отправки сообщения
    const user = db.prepare('SELECT telegram_chat_id FROM users WHERE id = ?')
      .get(userId) as { telegram_chat_id: string | null } | undefined;

    db.prepare('UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = ?')
      .run(userId);

    // Уведомляем в Telegram
    if (user?.telegram_chat_id) {
      sendTelegramMessage(user.telegram_chat_id, 
        '🔓 Telegram был отвязан от вашего аккаунта в Offer Tracker.'
      ).catch(console.error);
    }

    res.json({ message: 'Telegram отвязан' });
  } catch (error) {
    console.error('Unlink telegram error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверить статус привязки
router.get('/status', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const user = db.prepare('SELECT telegram_chat_id, telegram_username FROM users WHERE id = ?')
      .get(userId) as { telegram_chat_id: string | null; telegram_username: string | null } | undefined;

    res.json({ 
      linked: !!user?.telegram_chat_id,
      telegram_username: user?.telegram_username || null
    });
  } catch (error) {
    console.error('Get telegram status error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Тестовое уведомление
router.post('/test', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const user = db.prepare('SELECT telegram_chat_id, full_name FROM users WHERE id = ?')
      .get(userId) as { telegram_chat_id: string | null; full_name: string } | undefined;

    if (!user?.telegram_chat_id) {
      res.status(400).json({ error: 'Telegram не привязан' });
      return;
    }

    const success = await sendTelegramMessage(user.telegram_chat_id,
      `🧪 <b>Тестовое уведомление</b>\n\nПривет, ${user.full_name}! Если вы видите это сообщение, значит уведомления работают корректно. ✅`
    );

    if (success) {
      res.json({ message: 'Тестовое уведомление отправлено' });
    } else {
      res.status(500).json({ error: 'Не удалось отправить уведомление' });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

