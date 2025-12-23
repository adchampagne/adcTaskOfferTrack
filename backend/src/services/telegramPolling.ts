import { handleTelegramUpdate } from './telegram';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8477264438:AAGwCOnC7lnrnQ9YhA9vYJnzH-vZVRMe7JQ';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

let lastUpdateId = 0;
let isPolling = false;

interface TelegramUpdate {
  update_id: number;
  message?: {
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
  };
}

async function getUpdates(): Promise<TelegramUpdate[]> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offset: lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ['message'],
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram getUpdates error:', result);
      return [];
    }

    return result.result || [];
  } catch (error) {
    console.error('Telegram polling error:', error);
    return [];
  }
}

async function pollOnce(): Promise<void> {
  const updates = await getUpdates();

  if (updates.length > 0) {
    console.log(`📨 Получено ${updates.length} сообщений от Telegram`);
  }

  for (const update of updates) {
    lastUpdateId = Math.max(lastUpdateId, update.update_id);
    
    try {
      console.log('📥 Обработка сообщения:', update.message?.text, 'от chat_id:', update.message?.chat.id);
      await handleTelegramUpdate(update);
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }
}

async function pollLoop(): Promise<void> {
  while (isPolling) {
    await pollOnce();
  }
}

export function startPolling(): void {
  if (isPolling) {
    console.log('📱 Telegram polling уже запущен');
    return;
  }

  isPolling = true;
  console.log('📱 Telegram polling запущен');
  
  // Запускаем polling в фоне
  pollLoop().catch((error) => {
    console.error('Polling loop error:', error);
    isPolling = false;
  });
}

export function stopPolling(): void {
  isPolling = false;
  console.log('📱 Telegram polling остановлен');
}

// Получить информацию о боте
export async function getBotInfo(): Promise<{ username: string } | null> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const result = await response.json();
    
    if (result.ok) {
      return result.result;
    }
    return null;
  } catch (error) {
    console.error('Get bot info error:', error);
    return null;
  }
}

