import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Создаём папку для базы данных, если её нет
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Создаём папку для загрузок
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Импортируем роуты после создания папки
import authRoutes from './routes/auth';
import partnersRoutes from './routes/partners';
import offersRoutes from './routes/offers';
import tasksRoutes from './routes/tasks';
import filesRoutes from './routes/files';
import notificationsRoutes from './routes/notifications';
import telegramRoutes from './routes/telegram';
import departmentsRoutes from './routes/departments';
import headDashboardRoutes from './routes/head-dashboard';
import knowledgeRoutes from './routes/knowledge';
import { startPolling } from './services/telegramPolling';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/head-dashboard', headDashboardRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📝 API доступно по адресу: http://localhost:${PORT}/api`);
  
  // Запускаем Telegram polling для получения сообщений от бота
  startPolling();
});

export default app;
// Files upload support enabled

