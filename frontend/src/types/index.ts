export type UserRole = 'admin' | 'buyer' | 'webdev' | 'creo_manager' | 'buying_head' | 'bizdev' | 'creo_head' | 'dev_head';

export type PaymentType = 'COD' | 'SS';

export const paymentTypeLabels: Record<PaymentType, string> = {
  'COD': 'COD',
  'SS': 'SS'
};

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  created_at: string;
  created_by: string | null;
  creator_name?: string;
}

export interface Offer {
  id: string;
  partner_id: string;
  name: string;
  theme: string;
  geo: string | null;
  payment_type: PaymentType | null;
  partner_link: string | null;
  landing_price: string | null;
  promo_link: string | null;
  payout: string | null;
  garant: string | null;
  cap: string | null;
  created_at: string;
  created_by: string | null;
  partner_name?: string;
  creator_name?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'high' | 'normal' | 'low';

export type TaskRating = 'bad' | 'ok' | 'top';

export type Department = 'buying' | 'creo' | 'development';

export const departmentLabels: Record<Department, string> = {
  'buying': 'Баинг',
  'creo': 'Крео',
  'development': 'Разработка'
};

// Маппинг отдел -> роль руководителя
export const departmentHeadRole: Record<Department, UserRole> = {
  'buying': 'buying_head',
  'creo': 'creo_head',
  'development': 'webdev' // Разработчик получает задачи напрямую
};

export type TaskType = 
  | 'create_landing' 
  | 'prepare_creatives' 
  | 'setup_keitaro' 
  | 'setup_partner'
  | 'other';

export interface Task {
  id: string;
  task_number?: number;
  title: string;
  description: string | null;
  task_type: TaskType;
  geo: string | null;
  priority: TaskPriority;
  department: Department | null;
  offer_id: string | null;
  customer_id: string;
  executor_id: string;
  deadline: string;
  status: TaskStatus;
  rating: TaskRating | null;
  created_at: string;
  completed_at: string | null;
  parent_task_id: string | null;
  customer_name?: string;
  customer_username?: string;
  executor_name?: string;
  executor_username?: string;
  offer_name?: string;
  offer_promo_link?: string | null;
  parent_task_title?: string;
  parent_task_number?: number;
  subtasks_count?: number;
  subtasks_completed?: number;
}

// Полный список стран мира
export const geoOptions = [
  // Популярные (в начале для удобства)
  { code: 'ru', label: '🇷🇺 Россия' },
  { code: 'us', label: '🇺🇸 США' },
  { code: 'de', label: '🇩🇪 Германия' },
  { code: 'gb', label: '🇬🇧 Великобритания' },
  { code: 'fr', label: '🇫🇷 Франция' },
  { code: 'es', label: '🇪🇸 Испания' },
  { code: 'it', label: '🇮🇹 Италия' },
  { code: 'pl', label: '🇵🇱 Польша' },
  { code: 'ua', label: '🇺🇦 Украина' },
  { code: 'kz', label: '🇰🇿 Казахстан' },
  { code: 'br', label: '🇧🇷 Бразилия' },
  { code: 'in', label: '🇮🇳 Индия' },
  { code: 'jp', label: '🇯🇵 Япония' },
  { code: 'cn', label: '🇨🇳 Китай' },
  { code: 'au', label: '🇦🇺 Австралия' },
  { code: 'ca', label: '🇨🇦 Канада' },
  // Европа
  { code: 'at', label: '🇦🇹 Австрия' },
  { code: 'be', label: '🇧🇪 Бельгия' },
  { code: 'bg', label: '🇧🇬 Болгария' },
  { code: 'hr', label: '🇭🇷 Хорватия' },
  { code: 'cy', label: '🇨🇾 Кипр' },
  { code: 'cz', label: '🇨🇿 Чехия' },
  { code: 'dk', label: '🇩🇰 Дания' },
  { code: 'ee', label: '🇪🇪 Эстония' },
  { code: 'fi', label: '🇫🇮 Финляндия' },
  { code: 'gr', label: '🇬🇷 Греция' },
  { code: 'hu', label: '🇭🇺 Венгрия' },
  { code: 'is', label: '🇮🇸 Исландия' },
  { code: 'ie', label: '🇮🇪 Ирландия' },
  { code: 'lv', label: '🇱🇻 Латвия' },
  { code: 'lt', label: '🇱🇹 Литва' },
  { code: 'lu', label: '🇱🇺 Люксембург' },
  { code: 'mt', label: '🇲🇹 Мальта' },
  { code: 'md', label: '🇲🇩 Молдова' },
  { code: 'mc', label: '🇲🇨 Монако' },
  { code: 'me', label: '🇲🇪 Черногория' },
  { code: 'nl', label: '🇳🇱 Нидерланды' },
  { code: 'mk', label: '🇲🇰 Северная Македония' },
  { code: 'no', label: '🇳🇴 Норвегия' },
  { code: 'pt', label: '🇵🇹 Португалия' },
  { code: 'ro', label: '🇷🇴 Румыния' },
  { code: 'rs', label: '🇷🇸 Сербия' },
  { code: 'sk', label: '🇸🇰 Словакия' },
  { code: 'si', label: '🇸🇮 Словения' },
  { code: 'se', label: '🇸🇪 Швеция' },
  { code: 'ch', label: '🇨🇭 Швейцария' },
  { code: 'by', label: '🇧🇾 Беларусь' },
  { code: 'al', label: '🇦🇱 Албания' },
  { code: 'ad', label: '🇦🇩 Андорра' },
  { code: 'ba', label: '🇧🇦 Босния и Герцеговина' },
  { code: 'li', label: '🇱🇮 Лихтенштейн' },
  { code: 'sm', label: '🇸🇲 Сан-Марино' },
  { code: 'va', label: '🇻🇦 Ватикан' },
  // СНГ и Азия
  { code: 'az', label: '🇦🇿 Азербайджан' },
  { code: 'am', label: '🇦🇲 Армения' },
  { code: 'ge', label: '🇬🇪 Грузия' },
  { code: 'kg', label: '🇰🇬 Кыргызстан' },
  { code: 'tj', label: '🇹🇯 Таджикистан' },
  { code: 'tm', label: '🇹🇲 Туркменистан' },
  { code: 'uz', label: '🇺🇿 Узбекистан' },
  { code: 'mn', label: '🇲🇳 Монголия' },
  { code: 'tr', label: '🇹🇷 Турция' },
  { code: 'ae', label: '🇦🇪 ОАЭ' },
  { code: 'sa', label: '🇸🇦 Саудовская Аравия' },
  { code: 'il', label: '🇮🇱 Израиль' },
  { code: 'qa', label: '🇶🇦 Катар' },
  { code: 'kw', label: '🇰🇼 Кувейт' },
  { code: 'bh', label: '🇧🇭 Бахрейн' },
  { code: 'om', label: '🇴🇲 Оман' },
  { code: 'jo', label: '🇯🇴 Иордания' },
  { code: 'lb', label: '🇱🇧 Ливан' },
  { code: 'iq', label: '🇮🇶 Ирак' },
  { code: 'ir', label: '🇮🇷 Иран' },
  { code: 'sy', label: '🇸🇾 Сирия' },
  { code: 'ye', label: '🇾🇪 Йемен' },
  { code: 'af', label: '🇦🇫 Афганистан' },
  { code: 'pk', label: '🇵🇰 Пакистан' },
  { code: 'bd', label: '🇧🇩 Бангладеш' },
  { code: 'np', label: '🇳🇵 Непал' },
  { code: 'lk', label: '🇱🇰 Шри-Ланка' },
  { code: 'mm', label: '🇲🇲 Мьянма' },
  { code: 'th', label: '🇹🇭 Таиланд' },
  { code: 'vn', label: '🇻🇳 Вьетнам' },
  { code: 'kh', label: '🇰🇭 Камбоджа' },
  { code: 'la', label: '🇱🇦 Лаос' },
  { code: 'my', label: '🇲🇾 Малайзия' },
  { code: 'sg', label: '🇸🇬 Сингапур' },
  { code: 'id', label: '🇮🇩 Индонезия' },
  { code: 'ph', label: '🇵🇭 Филиппины' },
  { code: 'kr', label: '🇰🇷 Южная Корея' },
  { code: 'kp', label: '🇰🇵 Северная Корея' },
  { code: 'tw', label: '🇹🇼 Тайвань' },
  { code: 'hk', label: '🇭🇰 Гонконг' },
  { code: 'mo', label: '🇲🇴 Макао' },
  { code: 'bt', label: '🇧🇹 Бутан' },
  { code: 'mv', label: '🇲🇻 Мальдивы' },
  { code: 'bn', label: '🇧🇳 Бруней' },
  { code: 'tl', label: '🇹🇱 Восточный Тимор' },
  // Северная и Южная Америка
  { code: 'mx', label: '🇲🇽 Мексика' },
  { code: 'gt', label: '🇬🇹 Гватемала' },
  { code: 'bz', label: '🇧🇿 Белиз' },
  { code: 'hn', label: '🇭🇳 Гондурас' },
  { code: 'sv', label: '🇸🇻 Сальвадор' },
  { code: 'ni', label: '🇳🇮 Никарагуа' },
  { code: 'cr', label: '🇨🇷 Коста-Рика' },
  { code: 'pa', label: '🇵🇦 Панама' },
  { code: 'cu', label: '🇨🇺 Куба' },
  { code: 'jm', label: '🇯🇲 Ямайка' },
  { code: 'ht', label: '🇭🇹 Гаити' },
  { code: 'do', label: '🇩🇴 Доминикана' },
  { code: 'pr', label: '🇵🇷 Пуэрто-Рико' },
  { code: 'tt', label: '🇹🇹 Тринидад и Тобаго' },
  { code: 'bb', label: '🇧🇧 Барбадос' },
  { code: 'bs', label: '🇧🇸 Багамы' },
  { code: 'co', label: '🇨🇴 Колумбия' },
  { code: 've', label: '🇻🇪 Венесуэла' },
  { code: 'ec', label: '🇪🇨 Эквадор' },
  { code: 'pe', label: '🇵🇪 Перу' },
  { code: 'bo', label: '🇧🇴 Боливия' },
  { code: 'cl', label: '🇨🇱 Чили' },
  { code: 'ar', label: '🇦🇷 Аргентина' },
  { code: 'uy', label: '🇺🇾 Уругвай' },
  { code: 'py', label: '🇵🇾 Парагвай' },
  { code: 'gy', label: '🇬🇾 Гайана' },
  { code: 'sr', label: '🇸🇷 Суринам' },
  // Африка
  { code: 'eg', label: '🇪🇬 Египет' },
  { code: 'ma', label: '🇲🇦 Марокко' },
  { code: 'dz', label: '🇩🇿 Алжир' },
  { code: 'tn', label: '🇹🇳 Тунис' },
  { code: 'ly', label: '🇱🇾 Ливия' },
  { code: 'sd', label: '🇸🇩 Судан' },
  { code: 'et', label: '🇪🇹 Эфиопия' },
  { code: 'ke', label: '🇰🇪 Кения' },
  { code: 'tz', label: '🇹🇿 Танзания' },
  { code: 'ug', label: '🇺🇬 Уганда' },
  { code: 'rw', label: '🇷🇼 Руанда' },
  { code: 'ng', label: '🇳🇬 Нигерия' },
  { code: 'gh', label: '🇬🇭 Гана' },
  { code: 'ci', label: '🇨🇮 Кот-д\'Ивуар' },
  { code: 'sn', label: '🇸🇳 Сенегал' },
  { code: 'ml', label: '🇲🇱 Мали' },
  { code: 'bf', label: '🇧🇫 Буркина-Фасо' },
  { code: 'ne', label: '🇳🇪 Нигер' },
  { code: 'td', label: '🇹🇩 Чад' },
  { code: 'cm', label: '🇨🇲 Камерун' },
  { code: 'cf', label: '🇨🇫 ЦАР' },
  { code: 'cd', label: '🇨🇩 ДР Конго' },
  { code: 'cg', label: '🇨🇬 Конго' },
  { code: 'ga', label: '🇬🇦 Габон' },
  { code: 'gq', label: '🇬🇶 Экв. Гвинея' },
  { code: 'ao', label: '🇦🇴 Ангола' },
  { code: 'za', label: '🇿🇦 ЮАР' },
  { code: 'na', label: '🇳🇦 Намибия' },
  { code: 'bw', label: '🇧🇼 Ботсвана' },
  { code: 'zw', label: '🇿🇼 Зимбабве' },
  { code: 'zm', label: '🇿🇲 Замбия' },
  { code: 'mw', label: '🇲🇼 Малави' },
  { code: 'mz', label: '🇲🇿 Мозамбик' },
  { code: 'mg', label: '🇲🇬 Мадагаскар' },
  { code: 'mu', label: '🇲🇺 Маврикий' },
  { code: 'sc', label: '🇸🇨 Сейшелы' },
  { code: 'so', label: '🇸🇴 Сомали' },
  { code: 'dj', label: '🇩🇯 Джибути' },
  { code: 'er', label: '🇪🇷 Эритрея' },
  { code: 'ss', label: '🇸🇸 Южный Судан' },
  { code: 'gm', label: '🇬🇲 Гамбия' },
  { code: 'gw', label: '🇬🇼 Гвинея-Бисау' },
  { code: 'gn', label: '🇬🇳 Гвинея' },
  { code: 'sl', label: '🇸🇱 Сьерра-Леоне' },
  { code: 'lr', label: '🇱🇷 Либерия' },
  { code: 'tg', label: '🇹🇬 Того' },
  { code: 'bj', label: '🇧🇯 Бенин' },
  { code: 'mr', label: '🇲🇷 Мавритания' },
  { code: 'cv', label: '🇨🇻 Кабо-Верде' },
  { code: 'st', label: '🇸🇹 Сан-Томе и Принсипи' },
  { code: 'km', label: '🇰🇲 Коморы' },
  { code: 'bi', label: '🇧🇮 Бурунди' },
  { code: 'ls', label: '🇱🇸 Лесото' },
  { code: 'sz', label: '🇸🇿 Эсватини' },
  // Океания
  { code: 'nz', label: '🇳🇿 Новая Зеландия' },
  { code: 'pg', label: '🇵🇬 Папуа — Новая Гвинея' },
  { code: 'fj', label: '🇫🇯 Фиджи' },
  { code: 'sb', label: '🇸🇧 Соломоновы Острова' },
  { code: 'vu', label: '🇻🇺 Вануату' },
  { code: 'ws', label: '🇼🇸 Самоа' },
  { code: 'to', label: '🇹🇴 Тонга' },
  { code: 'ki', label: '🇰🇮 Кирибати' },
  { code: 'fm', label: '🇫🇲 Микронезия' },
  { code: 'mh', label: '🇲🇭 Маршалловы Острова' },
  { code: 'pw', label: '🇵🇼 Палау' },
  { code: 'nr', label: '🇳🇷 Науру' },
  { code: 'tv', label: '🇹🇻 Тувалу' },
];

export interface TaskFile {
  id: string;
  task_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  is_result: number;
  created_at: string;
  uploader_name?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_username?: string;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_deadline_soon'
  | 'task_overdue'
  | 'task_completed'
  | 'subtask_completed'
  | 'task_revision';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  task_id: string | null;
  is_read: number;
  created_at: string;
  task_title?: string;
}

export const taskTypeLabels: Record<TaskType, string> = {
  'create_landing': 'Завести ленд',
  'prepare_creatives': 'Подготовить крео',
  'setup_keitaro': 'Завести в Keitaro',
  'setup_partner': 'Завести партнёра',
  'other': 'Другое'
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  'pending': 'Ожидает',
  'in_progress': 'В работе',
  'completed': 'Выполнено',
  'cancelled': 'Отменено'
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  'high': 'Высокий',
  'normal': 'Обычный',
  'low': 'Низкий'
};

export const taskRatingLabels: Record<TaskRating, string> = {
  'bad': '👎 Дно',
  'ok': '👍 Норм',
  'top': '🔥 Топ'
};

export const roleLabels: Record<UserRole, string> = {
  'admin': 'Админ',
  'buyer': 'Байер',
  'webdev': 'Веб-разраб',
  'creo_manager': 'Крео менеджер',
  'buying_head': 'Руководитель баинга',
  'bizdev': 'БизДев',
  'creo_head': 'Руководитель крео',
  'dev_head': 'Руководитель разработки'
};

