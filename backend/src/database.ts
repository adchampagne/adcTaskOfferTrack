import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'data', 'tracker.db');
const db = new Database(dbPath);

// Включаем внешние ключи
db.pragma('foreign_keys = ON');

// Создаём таблицы
db.exec(`
  -- Таблица пользователей
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'buyer', 'webdev')),
    telegram_chat_id TEXT,
    telegram_username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица партнёрок (ПП)
  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT REFERENCES users(id)
  );

  -- Таблица офферов
  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    theme TEXT NOT NULL,
    partner_link TEXT,
    landing_price TEXT,
    promo_link TEXT,
    payout TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT REFERENCES users(id)
  );

  -- Таблица тасков
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    task_number INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    geo TEXT,
    customer_id TEXT NOT NULL REFERENCES users(id),
    executor_id TEXT NOT NULL REFERENCES users(id),
    deadline DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );

  -- Таблица файлов
  CREATE TABLE IF NOT EXISTS task_files (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица уведомлений
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Миграции
try {
  // Миграция users: telegram колонки
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const userColumnNames = userColumns.map(c => c.name);
  
  if (!userColumnNames.includes('telegram_chat_id')) {
    db.exec('ALTER TABLE users ADD COLUMN telegram_chat_id TEXT');
  }
  if (!userColumnNames.includes('telegram_username')) {
    db.exec('ALTER TABLE users ADD COLUMN telegram_username TEXT');
  }

  // Миграция tasks: task_number и geo
  const taskColumns = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  const taskColumnNames = taskColumns.map(c => c.name);
  
  if (!taskColumnNames.includes('task_number')) {
    db.exec('ALTER TABLE tasks ADD COLUMN task_number INTEGER');
    // Присваиваем номера существующим задачам
    const existingTasks = db.prepare('SELECT id FROM tasks ORDER BY created_at ASC').all() as Array<{ id: string }>;
    existingTasks.forEach((task, index) => {
      db.prepare('UPDATE tasks SET task_number = ? WHERE id = ?').run(index + 1, task.id);
    });
  }
  if (!taskColumnNames.includes('geo')) {
    db.exec('ALTER TABLE tasks ADD COLUMN geo TEXT');
  }
} catch (e) {
  console.error('Migration error:', e);
}

// Функция для получения следующего номера задачи
export function getNextTaskNumber(): number {
  const result = db.prepare('SELECT MAX(task_number) as max_num FROM tasks').get() as { max_num: number | null };
  return (result.max_num || 0) + 1;
}

export default db;

