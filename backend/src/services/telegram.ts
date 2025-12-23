import db from '../database';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramApiResponse {
  ok: boolean;
  result?: {
    username?: string;
    [key: string]: unknown;
  };
  description?: string;
}

// Отправить сообщение в Telegram
export async function sendTelegramMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const result = await response.json() as TelegramApiResponse;
    if (!result.ok) {
      console.error('Telegram send error:', result);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Telegram API error:', error);
    return false;
  }
}

// Отправить уведомление пользователю по его ID в системе
export async function sendNotificationToUser(userId: string, title: string, message: string, taskUrl?: string): Promise<boolean> {
  try {
    const user = db.prepare('SELECT telegram_chat_id FROM users WHERE id = ?').get(userId) as { telegram_chat_id: string | null } | undefined;
    
    if (!user?.telegram_chat_id) {
      return false; // У пользователя не привязан Telegram
    }

    let text = `<b>🔔 ${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;
    
    if (taskUrl) {
      text += `\n\n<a href="${taskUrl}">Открыть в системе →</a>`;
    }

    return await sendTelegramMessage(user.telegram_chat_id, text);
  } catch (error) {
    console.error('Send notification error:', error);
    return false;
  }
}

// Экранирование HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Обработка входящих сообщений от бота (для привязки аккаунта)
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (!update.message?.text) return;

  const chatId = update.message.chat.id.toString();
  const text = update.message.text;
  const username = update.message.from.username;
  const firstName = update.message.from.first_name;

  console.log(`🔔 Telegram: получено "${text}" от ${username || firstName} (chat_id: ${chatId})`);

  // Проверяем, это 6-значный код привязки?
  if (/^\d{6}$/.test(text.trim())) {
    const linkCode = text.trim();
    const result = await linkTelegramAccount(linkCode, chatId, username);
    
    if (result.success) {
      await sendTelegramMessage(chatId, 
        `✅ <b>Аккаунт успешно привязан!</b>\n\nТеперь вы будете получать уведомления о задачах в этот чат.\n\n👤 Привязан к: <b>${escapeHtml(result.userName || 'Пользователь')}</b>`
      );
    } else {
      await sendTelegramMessage(chatId,
        `❌ <b>Ошибка привязки</b>\n\n${result.error}`
      );
    }
    return;
  }

  if (text.startsWith('/start')) {
    // Приветственное сообщение
    await sendTelegramMessage(chatId,
      `👋 <b>Привет, ${escapeHtml(firstName)}!</b>\n\nЭто бот для уведомлений <b>Offer Tracker</b>.\n\n📝 <b>Как привязать аккаунт:</b>\n1. Откройте настройки Telegram в трекере\n2. Скопируйте 6-значный код\n3. Отправьте его сюда\n\nПосле привязки вы будете получать уведомления о новых задачах и изменениях.`
    );
  } else if (text === '/status') {
    // Проверяем привязку
    const user = db.prepare('SELECT full_name FROM users WHERE telegram_chat_id = ?').get(chatId) as { full_name: string } | undefined;
    
    if (user) {
      await sendTelegramMessage(chatId,
        `✅ <b>Telegram привязан</b>\n\nВаш аккаунт: <b>${escapeHtml(user.full_name)}</b>\n\nВы получаете уведомления о задачах.`
      );
    } else {
      await sendTelegramMessage(chatId,
        `⚠️ <b>Telegram не привязан</b>\n\nПерейдите по ссылке привязки из личного кабинета Offer Tracker.`
      );
    }
  } else if (text === '/unlink') {
    // Отвязываем аккаунт
    const result = db.prepare('UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE telegram_chat_id = ?').run(chatId);
    
    if (result.changes > 0) {
      await sendTelegramMessage(chatId, '✅ Telegram успешно отвязан от аккаунта.');
    } else {
      await sendTelegramMessage(chatId, '⚠️ Ваш Telegram не был привязан к аккаунту.');
    }
  }
}

// Привязка Telegram к аккаунту
interface LinkResult {
  success: boolean;
  error?: string;
  userName?: string;
}

// Временное хранилище кодов привязки (в реальном проекте лучше использовать Redis)
const linkCodes = new Map<string, { userId: string; expires: number }>();

// Создать код привязки для пользователя (6 цифр)
export function createLinkCode(userId: string): string {
  // Удаляем старые коды этого пользователя
  for (const [code, data] of linkCodes.entries()) {
    if (data.userId === userId) {
      linkCodes.delete(code);
    }
  }
  
  // Генерируем 6-значный числовой код
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Сохраняем с временем истечения (10 минут)
  linkCodes.set(code, {
    userId,
    expires: Date.now() + 10 * 60 * 1000,
  });

  return code;
}

// Привязать аккаунт по коду
async function linkTelegramAccount(code: string, chatId: string, username?: string): Promise<LinkResult> {
  const linkData = linkCodes.get(code);

  if (!linkData) {
    return { success: false, error: 'Код привязки не найден или уже использован.' };
  }

  if (Date.now() > linkData.expires) {
    linkCodes.delete(code);
    return { success: false, error: 'Срок действия кода истёк.' };
  }

  // Проверяем, не привязан ли этот Telegram к другому аккаунту
  const existingUser = db.prepare('SELECT id, full_name FROM users WHERE telegram_chat_id = ?').get(chatId) as { id: string; full_name: string } | undefined;
  
  if (existingUser && existingUser.id !== linkData.userId) {
    return { success: false, error: `Этот Telegram уже привязан к аккаунту "${existingUser.full_name}".` };
  }

  // Привязываем
  db.prepare('UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?')
    .run(chatId, username || null, linkData.userId);

  // Удаляем использованный код
  linkCodes.delete(code);

  // Получаем имя пользователя
  const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(linkData.userId) as { full_name: string } | undefined;

  return { success: true, userName: user?.full_name };
}

// Имя бота (будет получено при первом запросе)
let botUsername: string = 'OfferTrackerBot';

// Получить имя бота
async function getBotUsername(): Promise<string> {
  if (botUsername !== 'OfferTrackerBot') return botUsername;
  
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const result = await response.json() as TelegramApiResponse;
    if (result.ok && result.result?.username) {
      botUsername = result.result.username;
      return botUsername;
    }
  } catch (e) {
    console.error('Failed to get bot username:', e);
  }
  
  return botUsername;
}

// Получить ссылку для привязки Telegram
export async function getTelegramLinkUrl(code: string): Promise<string> {
  const username = await getBotUsername();
  return `https://t.me/${username}?start=${code}`;
}

// Проверить, привязан ли Telegram у пользователя
export function isUserTelegramLinked(userId: string): boolean {
  const user = db.prepare('SELECT telegram_chat_id FROM users WHERE id = ?').get(userId) as { telegram_chat_id: string | null } | undefined;
  return !!user?.telegram_chat_id;
}

// Очистка просроченных кодов (вызывать периодически)
export function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [code, data] of linkCodes.entries()) {
    if (now > data.expires) {
      linkCodes.delete(code);
    }
  }
}

// Запуск очистки каждые 5 минут
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

