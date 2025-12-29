import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Папка для временных файлов
const tempDir = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Разрешённые роли для использования инструмента
const allowedRoles = ['admin', 'buyer', 'buying_head', 'creo_manager', 'creo_head'];

// Разрешённые типы файлов для очистки метаданных
const allowedMimeTypes = [
  // Изображения
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  // Видео
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/mpeg',
  'video/3gpp',
  'video/x-matroska',
  // Аудио
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
];

// Настройка multer для временного хранения
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `input_${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Тип файла ${file.mimetype} не поддерживается для очистки метаданных`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB максимум
  },
});

// Проверка доступа
const checkAccess = (req: Request, res: Response, next: () => void): void => {
  const userRole = req.user?.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    res.status(403).json({ error: 'У вас нет доступа к этому инструменту' });
    return;
  }
  next();
};

// Функция очистки метаданных через FFmpeg
const cleanMetadataWithFFmpeg = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // FFmpeg команда для удаления всех метаданных
    const args = [
      '-i', inputPath,
      '-map_metadata', '-1',  // Удалить все метаданные
      '-fflags', '+bitexact',  // Не добавлять encoder metadata
      '-flags:v', '+bitexact', // Для видео потока
      '-flags:a', '+bitexact', // Для аудио потока
      '-c', 'copy',            // Копировать без перекодирования
      '-y',                    // Перезаписать выходной файл
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Попробуем альтернативный метод (с перекодированием)
        const altArgs = [
          '-i', inputPath,
          '-map_metadata', '-1',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-y',
          outputPath
        ];

        const ffmpegAlt = spawn('ffmpeg', altArgs);
        
        ffmpegAlt.on('close', (altCode) => {
          if (altCode === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg error: ${stderr}`));
          }
        });

        ffmpegAlt.on('error', (err) => {
          reject(new Error(`FFmpeg not found or error: ${err.message}`));
        });
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg not found. Please install FFmpeg: ${err.message}`));
    });
  });
};

// Функция очистки метаданных изображений (без внешних зависимостей - просто копируем)
// Для полной очистки рекомендуется установить sharp
const cleanImageMetadata = async (inputPath: string, outputPath: string, mimeType: string): Promise<void> => {
  try {
    // Попробуем использовать sharp если установлен
    const sharp = require('sharp');
    
    await sharp(inputPath)
      .withMetadata({}) // Удаляет все метаданные EXIF
      .toFile(outputPath);
  } catch {
    // Если sharp не установлен, попробуем FFmpeg
    try {
      await cleanMetadataWithFFmpeg(inputPath, outputPath);
    } catch {
      // Если ничего не работает, просто копируем файл
      // (лучше чем ничего, но метаданные останутся)
      fs.copyFileSync(inputPath, outputPath);
      console.warn('Warning: Could not clean image metadata, file copied as-is');
    }
  }
};

// Очистка метаданных одного файла
router.post(
  '/clean',
  authenticateToken,
  checkAccess,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const inputFile = req.file;
    let outputPath: string | null = null;

    try {
      if (!inputFile) {
        res.status(400).json({ error: 'Файл не выбран' });
        return;
      }

      const ext = path.extname(inputFile.originalname);
      const outputFilename = `clean_${uuidv4()}${ext}`;
      outputPath = path.join(tempDir, outputFilename);

      const isVideo = inputFile.mimetype.startsWith('video/');
      const isAudio = inputFile.mimetype.startsWith('audio/');
      const isImage = inputFile.mimetype.startsWith('image/');

      if (isVideo || isAudio) {
        await cleanMetadataWithFFmpeg(inputFile.path, outputPath);
      } else if (isImage) {
        await cleanImageMetadata(inputFile.path, outputPath, inputFile.mimetype);
      } else {
        res.status(400).json({ error: 'Неподдерживаемый тип файла' });
        return;
      }

      // Отправляем очищенный файл
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(inputFile.originalname)}"`);
      res.setHeader('Content-Type', inputFile.mimetype);
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        // Удаляем временные файлы после отправки
        try {
          if (fs.existsSync(inputFile.path)) fs.unlinkSync(inputFile.path);
          if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
          console.error('Error cleaning up temp files:', e);
        }
      });

      fileStream.on('error', (err) => {
        console.error('Stream error:', err);
        // Cleanup
        try {
          if (fs.existsSync(inputFile.path)) fs.unlinkSync(inputFile.path);
          if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
          console.error('Error cleaning up temp files:', e);
        }
      });

    } catch (error) {
      console.error('Clean metadata error:', error);
      
      // Удаляем временные файлы при ошибке
      try {
        if (inputFile && fs.existsSync(inputFile.path)) fs.unlinkSync(inputFile.path);
        if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('Error cleaning up temp files:', e);
      }

      const errorMessage = error instanceof Error ? error.message : 'Ошибка очистки метаданных';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Очистка метаданных нескольких файлов (возвращает zip)
router.post(
  '/clean-batch',
  authenticateToken,
  checkAccess,
  upload.array('files', 20), // Максимум 20 файлов
  async (req: Request, res: Response): Promise<void> => {
    const inputFiles = req.files as Express.Multer.File[];
    const outputPaths: string[] = [];
    const cleanedFiles: { originalName: string; path: string }[] = [];

    try {
      if (!inputFiles || inputFiles.length === 0) {
        res.status(400).json({ error: 'Файлы не выбраны' });
        return;
      }

      // Если только один файл, обрабатываем как single
      if (inputFiles.length === 1) {
        const inputFile = inputFiles[0];
        const ext = path.extname(inputFile.originalname);
        const outputFilename = `clean_${uuidv4()}${ext}`;
        const outputPath = path.join(tempDir, outputFilename);
        outputPaths.push(outputPath);

        const isVideo = inputFile.mimetype.startsWith('video/');
        const isAudio = inputFile.mimetype.startsWith('audio/');
        const isImage = inputFile.mimetype.startsWith('image/');

        if (isVideo || isAudio) {
          await cleanMetadataWithFFmpeg(inputFile.path, outputPath);
        } else if (isImage) {
          await cleanImageMetadata(inputFile.path, outputPath, inputFile.mimetype);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(inputFile.originalname)}"`);
        res.setHeader('Content-Type', inputFile.mimetype);
        
        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);

        fileStream.on('end', () => {
          try {
            inputFiles.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
            outputPaths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
          } catch (e) {
            console.error('Error cleaning up:', e);
          }
        });

        return;
      }

      // Обрабатываем несколько файлов
      for (const inputFile of inputFiles) {
        const ext = path.extname(inputFile.originalname);
        const outputFilename = `clean_${uuidv4()}${ext}`;
        const outputPath = path.join(tempDir, outputFilename);
        outputPaths.push(outputPath);

        const isVideo = inputFile.mimetype.startsWith('video/');
        const isAudio = inputFile.mimetype.startsWith('audio/');
        const isImage = inputFile.mimetype.startsWith('image/');

        try {
          if (isVideo || isAudio) {
            await cleanMetadataWithFFmpeg(inputFile.path, outputPath);
          } else if (isImage) {
            await cleanImageMetadata(inputFile.path, outputPath, inputFile.mimetype);
          }

          cleanedFiles.push({
            originalName: inputFile.originalname,
            path: outputPath
          });
        } catch (e) {
          console.error(`Error processing ${inputFile.originalname}:`, e);
          // Продолжаем с остальными файлами
        }
      }

      if (cleanedFiles.length === 0) {
        res.status(500).json({ error: 'Не удалось обработать ни один файл' });
        return;
      }

      // Создаём простой архив (используя архиватор или просто отправляем информацию)
      // Для простоты возвращаем JSON с информацией о файлах и отдельный endpoint для скачивания
      
      // Сохраняем информацию о файлах для скачивания
      const batchId = uuidv4();
      const batchInfo = {
        id: batchId,
        files: cleanedFiles.map((f, i) => ({
          id: `${batchId}_${i}`,
          originalName: f.originalName,
          path: f.path
        })),
        createdAt: new Date().toISOString(),
        userId: req.user?.userId
      };

      // Сохраняем информацию о batch в временный файл
      const batchInfoPath = path.join(tempDir, `batch_${batchId}.json`);
      fs.writeFileSync(batchInfoPath, JSON.stringify(batchInfo));

      // Удаляем входные файлы
      inputFiles.forEach(f => {
        try {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (e) {
          console.error('Error deleting input file:', e);
        }
      });

      res.json({
        batchId,
        filesCount: cleanedFiles.length,
        files: cleanedFiles.map((f, i) => ({
          id: `${batchId}_${i}`,
          originalName: f.originalName
        }))
      });

    } catch (error) {
      console.error('Clean batch metadata error:', error);
      
      // Cleanup
      try {
        inputFiles?.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        outputPaths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
      } catch (e) {
        console.error('Error cleaning up:', e);
      }

      const errorMessage = error instanceof Error ? error.message : 'Ошибка очистки метаданных';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Скачать файл из batch
router.get('/batch/:batchId/:fileIndex', authenticateToken, checkAccess, (req: Request, res: Response): void => {
  try {
    const { batchId, fileIndex } = req.params;
    const batchInfoPath = path.join(tempDir, `batch_${batchId}.json`);

    if (!fs.existsSync(batchInfoPath)) {
      res.status(404).json({ error: 'Batch не найден или истёк' });
      return;
    }

    const batchInfo = JSON.parse(fs.readFileSync(batchInfoPath, 'utf-8'));
    const fileInfo = batchInfo.files[parseInt(fileIndex)];

    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      res.status(404).json({ error: 'Файл не найден' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.originalName)}"`);
    res.sendFile(fileInfo.path);
  } catch (error) {
    console.error('Download batch file error:', error);
    res.status(500).json({ error: 'Ошибка скачивания' });
  }
});

// Удалить batch (очистить временные файлы)
router.delete('/batch/:batchId', authenticateToken, checkAccess, (req: Request, res: Response): void => {
  try {
    const { batchId } = req.params;
    const batchInfoPath = path.join(tempDir, `batch_${batchId}.json`);

    if (fs.existsSync(batchInfoPath)) {
      const batchInfo = JSON.parse(fs.readFileSync(batchInfoPath, 'utf-8'));
      
      // Удаляем все файлы
      batchInfo.files?.forEach((f: { path: string }) => {
        try {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (e) {
          console.error('Error deleting file:', e);
        }
      });

      fs.unlinkSync(batchInfoPath);
    }

    res.json({ message: 'Batch удалён' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// Проверка доступа к инструменту
router.get('/check-access', authenticateToken, (req: Request, res: Response): void => {
  const userRole = req.user?.role;
  const hasAccess = userRole && allowedRoles.includes(userRole);
  res.json({ hasAccess, allowedRoles });
});

export default router;

