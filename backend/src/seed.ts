import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './database';

console.log('🌱 Начинаем заполнение базы данных...');

// Создаём пользователей
const users = [
  { id: uuidv4(), username: 'admin', password: 'admin123', full_name: 'Администратор', role: 'admin' },
  { id: uuidv4(), username: 'buyer1', password: 'buyer123', full_name: 'Байер Иван', role: 'buyer' },
  { id: uuidv4(), username: 'webdev1', password: 'webdev123', full_name: 'Разработчик Пётр', role: 'webdev' },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password, full_name, role)
  VALUES (?, ?, ?, ?, ?)
`);

for (const user of users) {
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  insertUser.run(user.id, user.username, hashedPassword, user.full_name, user.role);
  console.log(`✅ Пользователь "${user.username}" создан (роль: ${user.role})`);
}

// Получаем ID админа для создания партнёрок
const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: string };

// Создаём партнёрки
const partners = [
  { id: uuidv4(), name: 'LemonAd', description: 'Крупная партнёрская сеть', website: 'https://lemonad.pro' },
  { id: uuidv4(), name: 'ArbitPro', description: 'Партнёрка для арбитражников', website: 'https://arbitpro.com' },
  { id: uuidv4(), name: 'Sl-CPA', description: 'CPA сеть с высокими ставками', website: 'https://sl-cpa.com' },
];

const insertPartner = db.prepare(`
  INSERT OR IGNORE INTO partners (id, name, description, website, created_by)
  VALUES (?, ?, ?, ?, ?)
`);

for (const partner of partners) {
  insertPartner.run(partner.id, partner.name, partner.description, partner.website, admin.id);
  console.log(`✅ Партнёрка "${partner.name}" создана`);
}

// Создаём офферы
const lemonAd = db.prepare('SELECT id FROM partners WHERE name = ?').get('LemonAd') as { id: string };

const offers = [
  {
    id: uuidv4(),
    partner_id: lemonAd.id,
    name: 'Казино Вулкан',
    theme: 'Гемблинг',
    partner_link: 'https://lemonad.pro/offer/123',
    landing_price: '500 руб',
    promo_link: 'https://promo.example.com/vulkan',
    payout: '50$/dep'
  },
  {
    id: uuidv4(),
    partner_id: lemonAd.id,
    name: 'Похудение Турбо',
    theme: 'Нутра',
    partner_link: 'https://lemonad.pro/offer/456',
    landing_price: '300 руб',
    promo_link: 'https://promo.example.com/turbo',
    payout: '1200 руб/лид'
  },
];

const insertOffer = db.prepare(`
  INSERT OR IGNORE INTO offers (id, partner_id, name, theme, partner_link, landing_price, promo_link, payout, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const offer of offers) {
  insertOffer.run(
    offer.id, offer.partner_id, offer.name, offer.theme,
    offer.partner_link, offer.landing_price, offer.promo_link, offer.payout, admin.id
  );
  console.log(`✅ Оффер "${offer.name}" создан`);
}

console.log('\n🎉 База данных успешно заполнена!');
console.log('\n📋 Тестовые аккаунты:');
console.log('   Админ: admin / admin123');
console.log('   Байер: buyer1 / buyer123');
console.log('   Веб-разраб: webdev1 / webdev123');

