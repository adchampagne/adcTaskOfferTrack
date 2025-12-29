import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(__dirname, '..', 'data', 'tracker.db');
const db: DatabaseType = new Database(dbPath);

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
    role TEXT NOT NULL CHECK(role IN ('admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head', 'dev_head')),
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
    department TEXT CHECK(department IN ('buying', 'creo', 'development')),
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
    is_result INTEGER DEFAULT 0,
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

  -- Таблица комментариев к задачам
  CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица отделов
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE CHECK(code IN ('buying', 'creo', 'development')),
    head_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица связи пользователей и отделов
  CREATE TABLE IF NOT EXISTS user_departments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, department_id)
  );

  -- Таблица руководителей отделов (многие-ко-многим)
  CREATE TABLE IF NOT EXISTS department_heads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, department_id)
  );

  -- Таблица категорий базы знаний
  CREATE TABLE IF NOT EXISTS knowledge_categories (
    id TEXT PRIMARY KEY,
    department_code TEXT NOT NULL CHECK(department_code IN ('buying', 'creo', 'development')),
    title TEXT NOT NULL,
    icon TEXT DEFAULT 'FileText',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица инструкций базы знаний
  CREATE TABLE IF NOT EXISTS knowledge_instructions (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES knowledge_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    sort_order INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица дополнительных прав пользователей
  CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission)
  );
`);

// Миграции
try {
  // Миграция users: обновляем CHECK constraint для новых ролей
  const checkInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string } | undefined;
  if (checkInfo && !checkInfo.sql.includes('dev_head')) {
    console.log('🔄 Миграция: обновление ролей пользователей...');
    db.exec(`
      -- Отключаем внешние ключи для миграции
      PRAGMA foreign_keys = OFF;
      
      -- Создаём новую таблицу с обновлённым constraint
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'buyer', 'webdev', 'creo_manager', 'buying_head', 'bizdev', 'creo_head', 'dev_head')),
        telegram_chat_id TEXT,
        telegram_username TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Копируем данные
      INSERT INTO users_new SELECT id, username, password, full_name, role, telegram_chat_id, telegram_username, created_at FROM users;
      
      -- Удаляем старую таблицу
      DROP TABLE users;
      
      -- Переименовываем новую
      ALTER TABLE users_new RENAME TO users;
      
      -- Включаем внешние ключи обратно
      PRAGMA foreign_keys = ON;
    `);
    console.log('✅ Миграция ролей завершена');
  }

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

  // Миграция offers: geo колонка
  const offerColumns = db.prepare("PRAGMA table_info(offers)").all() as Array<{ name: string }>;
  const offerColumnNames = offerColumns.map(c => c.name);
  
  if (!offerColumnNames.includes('geo')) {
    console.log('🔄 Миграция: добавление GEO к офферам...');
    db.exec('ALTER TABLE offers ADD COLUMN geo TEXT');
    console.log('✅ Миграция GEO для офферов завершена');
  }

  // Миграция tasks: priority колонка
  if (!taskColumnNames.includes('priority')) {
    console.log('🔄 Миграция: добавление приоритета к задачам...');
    db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'normal'");
    console.log('✅ Миграция приоритета для задач завершена');
  }

  // Миграция tasks: department колонка
  if (!taskColumnNames.includes('department')) {
    console.log('🔄 Миграция: добавление отдела к задачам...');
    db.exec("ALTER TABLE tasks ADD COLUMN department TEXT CHECK(department IN ('buying', 'creo', 'development'))");
    console.log('✅ Миграция отдела для задач завершена');
  }

  // Миграция tasks: offer_id колонка
  if (!taskColumnNames.includes('offer_id')) {
    console.log('🔄 Миграция: добавление offer_id к задачам...');
    db.exec("ALTER TABLE tasks ADD COLUMN offer_id TEXT REFERENCES offers(id)");
    console.log('✅ Миграция offer_id для задач завершена');
  }

  // Миграция tasks: rating колонка (оценка результата: bad, ok, top)
  if (!taskColumnNames.includes('rating')) {
    console.log('🔄 Миграция: добавление rating к задачам...');
    db.exec("ALTER TABLE tasks ADD COLUMN rating TEXT CHECK(rating IN ('bad', 'ok', 'top'))");
    console.log('✅ Миграция rating для задач завершена');
  }

  // Миграция users: settings колонка для персонализации
  if (!userColumnNames.includes('settings')) {
    console.log('🔄 Миграция: добавление настроек персонализации...');
    db.exec("ALTER TABLE users ADD COLUMN settings TEXT");
    console.log('✅ Миграция настроек персонализации завершена');
  }

  // Миграция: создание начальных отделов
  const existingDepartments = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (existingDepartments.count === 0) {
    console.log('🔄 Миграция: создание начальных отделов...');
    const { v4: uuidv4 } = require('uuid');
    db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)').run(uuidv4(), 'Баинг', 'buying');
    db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)').run(uuidv4(), 'Крео', 'creo');
    db.prepare('INSERT INTO departments (id, name, code) VALUES (?, ?, ?)').run(uuidv4(), 'Разработка', 'development');
    console.log('✅ Начальные отделы созданы');
  }

  // Миграция: создание начальных инструкций базы знаний
  const existingKnowledgeCategories = db.prepare('SELECT COUNT(*) as count FROM knowledge_categories').get() as { count: number };
  if (existingKnowledgeCategories.count === 0) {
    console.log('🔄 Миграция: создание начальных инструкций базы знаний...');
    const { v4: uuidv4 } = require('uuid');
    
    // Категория "Работа с офферами"
    const offersCategoryId = uuidv4();
    db.prepare('INSERT INTO knowledge_categories (id, department_code, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      offersCategoryId, 'development', 'Работа с офферами', 'Globe', 1
    );

    // Инструкция "Заведение офферов"
    const offersInstructionContent = `# Заведение Офферов

При заведении Оффера (ровно как и переделывании Лендинга в Оффер) необходимо иметь информацию о том, какой **Продукт** и из какой **ПП** необходимо использовать.

---

## 1. Очистка Оффера

Оффер необходимо очистить от:

- [ ] Ссылок на сторонние ресурсы
- [ ] Лишних скриптов (как подключенных JS, так и в index)
- [ ] Кнопок в конце статьи (при наличии)

### Важно!
- Кнопки заменяем на **форму**
- Количество полей берём в референсном Оффере или в Шаблонном
- **Все лишние поля и/или скрипты — УДАЛЯЕМ, а не комментируем!**

---

## 2. Ссылки на главной странице

На главной странице Оффера **ВСЕ ссылки** должны вести в конец статьи к форме, а любое упоминание продукта должно быть релевантным.

---

## 3. Настройка формы

Форма может иметь разное количество полей заполнения, в зависимости от ПП, на которую будем запускаться.

### Особенности:
- Имена полей могут варьироваться от ПП к ПП
- Но всегда будут одинаковые от продукта к продукту **в рамках одной ПП**

### Пример:
Заводя/переделывая Оффер (к примеру OpenAff) — можно количество и \`name\` полей подглядеть в любом заведённом ранее OpenAff продукте и/или шаблонном.

---

## 4. Валидация полей

Валидацию полей **всегда** реализуем одинаково:

- Если проверку или требование вводимых символов/кодов города, текста в инпутах удобно вынести **ЗА пределы index** (например, в отдельный JS)
- ТО на всех Офферах именно в этом JS и держим валидацию
- Это нужно, чтобы не возникало бардака с формами и скриптами

### Цель:
Для удобства дублирования, переделывания, редактирования необходимо прийти к **общему формату формы** в Офферах.

### Исключения:
Подготовленные под нас Офферы от ПП (которые мы помечаем в нейминге \`DAFULT\`) — из этих Офферов мы можем брать только различные ID из \`send.php\`.

---

## 5. Сохранение Оффера

Новый Оффер сохраняем с неймингом:

\`\`\`
ПРОДУКТ [ГЕО][ПОДХОД][СЕЛЕБА]
\`\`\`

### Правила:
- Если Оффер **НЕ селебный** — блок с селебой не указываем
- Группу указываем \`TEST\`
- Указываем ПП в выпадающем списке «Партнерская сеть»
- Указываем ГЕО Оффера во вкладке «Настройки»

---

## 6. Финальная проверка

Проверяем Оффер на выполнение предыдущих пунктов:

- [ ] В Оффере должно быть упоминание только необходимого продукта
- [ ] Все ссылки должны вести в конец статьи к форме
- [ ] В Оффере НЕ должно быть подключенных НЕ ИСПОЛЬЗУЕМЫХ скриптов (например, незадействованный \`intlTelInput.js\`)
- [ ] Все стили Оффера НЕ нарушены
- [ ] Локализация Оффера релевантна

---

## 7. Завершение работы

1. Переводим Оффер в группу \`DONE\`
2. Отписываем таск-креатору ответом на сообщение, что Оффер готов к использованию

---

## 8. Действия таск-креатора

Таск-креатор, при получении Оффера:
1. Выполняет п.7 (проверку)
2. Даёт название подхода в Оффере (путём переименовывания Оффера в блоке \`[ПОДХОД]\`)`;

    db.prepare('INSERT INTO knowledge_instructions (id, category_id, title, content, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), offersCategoryId, 'Заведение офферов', offersInstructionContent, JSON.stringify(['оффер', 'заведение', 'форма', 'нейминг']), 1
    );

    // Категория "Отправка форм"
    const formsCategoryId = uuidv4();
    db.prepare('INSERT INTO knowledge_categories (id, department_code, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      formsCategoryId, 'development', 'Отправка форм по партнёркам', 'Code', 2
    );

    // Категория "Создание лендингов"
    const landingsCategoryId = uuidv4();
    db.prepare('INSERT INTO knowledge_categories (id, department_code, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      landingsCategoryId, 'development', 'Создание лендингов', 'FileText', 3
    );

    // === Категории для отдела Крео ===
    const creoCategoryId = uuidv4();
    db.prepare('INSERT INTO knowledge_categories (id, department_code, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      creoCategoryId, 'creo', 'Работа с креативами', 'Globe', 1
    );

    // === Категории для отдела Баинга ===
    const buyingCategoryId = uuidv4();
    db.prepare('INSERT INTO knowledge_categories (id, department_code, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      buyingCategoryId, 'buying', 'Работа с трафиком', 'Globe', 1
    );

    console.log('✅ Начальные инструкции базы знаний созданы');
  }

  // Миграция: is_result колонка для файлов задач
  const fileColumns = db.prepare("PRAGMA table_info(task_files)").all() as Array<{ name: string }>;
  const fileColumnNames = fileColumns.map(c => c.name);
  
  if (!fileColumnNames.includes('is_result')) {
    console.log('🔄 Миграция: добавление is_result к файлам задач...');
    db.exec("ALTER TABLE task_files ADD COLUMN is_result INTEGER DEFAULT 0");
    console.log('✅ Миграция is_result для файлов задач завершена');
  }

  // Миграция: перенос head_id из departments в department_heads
  const existingHeads = db.prepare(`
    SELECT id as department_id, head_id FROM departments WHERE head_id IS NOT NULL
  `).all() as { department_id: string; head_id: string }[];

  for (const { department_id, head_id } of existingHeads) {
    const exists = db.prepare(`
      SELECT 1 FROM department_heads WHERE user_id = ? AND department_id = ?
    `).get(head_id, department_id);

    if (!exists) {
      console.log(`🔄 Миграция: перенос руководителя ${head_id} в department_heads...`);
      db.prepare(`
        INSERT INTO department_heads (id, user_id, department_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), head_id, department_id);
    }
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

