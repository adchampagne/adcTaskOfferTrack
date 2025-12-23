import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Папка для хранения файлов
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Разрешённые типы файлов
const allowedMimeTypes = [
  // Изображения
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  // Видео
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/mpeg',
  // Архивы
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  // Документы
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

// Настройка multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Тип файла ${file.mimetype} не поддерживается`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB максимум
  },
});

// Интерфейс для файла
interface TaskFile {
  id: string;
  task_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
  uploader_name?: string;
}

// Загрузка файлов к задаче
router.post(
  '/upload/:taskId',
  authenticateToken,
  upload.array('files', 10), // Максимум 10 файлов за раз
  (req: Request, res: Response): void => {
    try {
      const { taskId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Файлы не выбраны' });
        return;
      }

      // Проверяем существование задачи
      const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
      if (!task) {
        // Удаляем загруженные файлы
        files.forEach((file) => {
          fs.unlinkSync(file.path);
        });
        res.status(404).json({ error: 'Задача не найдена' });
        return;
      }

      const insertFile = db.prepare(`
        INSERT INTO task_files (id, task_id, original_name, stored_name, mime_type, size, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const uploadedFiles: TaskFile[] = [];

      for (const file of files) {
        const fileId = uuidv4();
        insertFile.run(
          fileId,
          taskId,
          file.originalname,
          file.filename,
          file.mimetype,
          file.size,
          req.user?.userId
        );

        const insertedFile = db.prepare('SELECT * FROM task_files WHERE id = ?').get(fileId) as TaskFile;
        uploadedFiles.push(insertedFile);
      }

      res.status(201).json(uploadedFiles);
    } catch (error) {
      console.error('Upload files error:', error);
      res.status(500).json({ error: 'Ошибка загрузки файлов' });
    }
  }
);

// Получение списка файлов задачи
router.get('/task/:taskId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params;

    const files = db.prepare(`
      SELECT f.*, u.full_name as uploader_name
      FROM task_files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.task_id = ?
      ORDER BY f.created_at DESC
    `).all(taskId) as TaskFile[];

    res.json(files);
  } catch (error) {
    console.error('Get task files error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Скачивание файла
router.get('/download/:fileId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { fileId } = req.params;

    const file = db.prepare('SELECT * FROM task_files WHERE id = ?').get(fileId) as TaskFile | undefined;

    if (!file) {
      res.status(404).json({ error: 'Файл не найден' });
      return;
    }

    const filePath = path.join(uploadsDir, file.stored_name);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Файл не найден на сервере' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Ошибка скачивания' });
  }
});

// Просмотр файла (для изображений и видео)
router.get('/view/:fileId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { fileId } = req.params;

    const file = db.prepare('SELECT * FROM task_files WHERE id = ?').get(fileId) as TaskFile | undefined;

    if (!file) {
      res.status(404).json({ error: 'Файл не найден' });
      return;
    }

    const filePath = path.join(uploadsDir, file.stored_name);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Файл не найден на сервере' });
      return;
    }

    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (error) {
    console.error('View file error:', error);
    res.status(500).json({ error: 'Ошибка просмотра' });
  }
});

// Удаление файла
router.delete('/:fileId', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { fileId } = req.params;

    const file = db.prepare(`
      SELECT f.*, t.customer_id 
      FROM task_files f
      JOIN tasks t ON f.task_id = t.id
      WHERE f.id = ?
    `).get(fileId) as (TaskFile & { customer_id: string }) | undefined;

    if (!file) {
      res.status(404).json({ error: 'Файл не найден' });
      return;
    }

    // Удалять может тот кто загрузил или заказчик задачи или админ
    if (
      file.uploaded_by !== req.user?.userId &&
      file.customer_id !== req.user?.userId &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ error: 'Недостаточно прав для удаления файла' });
      return;
    }

    // Удаляем файл с диска
    const filePath = path.join(uploadsDir, file.stored_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Удаляем запись из БД
    db.prepare('DELETE FROM task_files WHERE id = ?').run(fileId);

    res.json({ message: 'Файл удалён' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

export default router;

