import { useState, useCallback, useEffect } from 'react';
import { 
  FileVideo, 
  FileImage, 
  FileAudio, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  X,
  FileWarning
} from 'lucide-react';
import { metadataApi } from '../api';
import { useSettingsStore } from '../store/settingsStore';

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
  error?: string;
  cleanedBlob?: Blob;
}


// Поддерживаемые типы файлов
const SUPPORTED_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg', 'video/3gpp', 'video/x-matroska'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
};

const ALL_SUPPORTED = [...SUPPORTED_TYPES.video, ...SUPPORTED_TYPES.image, ...SUPPORTED_TYPES.audio];

function MetadataCleaner() {
  const { getTheme } = useSettingsStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Проверяем доступ при загрузке
  useEffect(() => {
    metadataApi.checkAccess()
      .then(res => setHasAccess(res.hasAccess))
      .catch(() => setHasAccess(false));
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return FileVideo;
    if (mimeType.startsWith('audio/')) return FileAudio;
    return FileImage;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return 'Видео';
    if (mimeType.startsWith('audio/')) return 'Аудио';
    return 'Изображение';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(f => ALL_SUPPORTED.includes(f.type));
    const items: FileItem[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...items]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  // Обработка одного файла
  const processFile = async (item: FileItem): Promise<FileItem> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: 'uploading' } : f
      ));

      const blob = await metadataApi.cleanFile(item.file, (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === item.id ? { ...f, progress, status: progress < 100 ? 'uploading' : 'processing' } : f
        ));
      });

      setFiles(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: 'done', progress: 100, cleanedBlob: blob } : f
      ));

      return { ...item, status: 'done', cleanedBlob: blob };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка обработки';
      setFiles(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: 'error', error: errorMsg } : f
      ));
      return { ...item, status: 'error', error: errorMsg };
    }
  };

  // Обработать все файлы
  const processAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);

    // Обрабатываем по одному для отображения прогресса
    for (const item of pendingFiles) {
      await processFile(item);
    }

    setIsProcessing(false);
  };

  // Скачать очищенный файл
  const downloadFile = (item: FileItem) => {
    if (!item.cleanedBlob) return;

    const url = URL.createObjectURL(item.cleanedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Скачать все
  const downloadAll = () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.cleanedBlob);
    doneFiles.forEach(item => {
      setTimeout(() => downloadFile(item), 100);
    });
  };

  // Если нет доступа
  if (hasAccess === false) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileWarning className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-200 mb-2">Доступ ограничен</h2>
          <p className="text-dark-400">
            Этот инструмент доступен только для отдела крео и байеров
          </p>
        </div>
      </div>
    );
  }

  // Загрузка
  if (hasAccess === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: getTheme().colors.gradient }}
          >
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Очистка метаданных</h1>
            <p className="text-sm text-dark-400">Удаление EXIF, GPS и другой информации из файлов</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-2">
            {doneCount > 0 && (
              <button
                onClick={downloadAll}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Скачать все ({doneCount})
              </button>
            )}
            <button
              onClick={clearAll}
              className="btn-secondary flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Очистить
            </button>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-dark-700/50 rounded-xl p-4 mb-6 flex-shrink-0">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-dark-300">
            <p className="font-medium text-dark-200 mb-1">Что удаляется:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>EXIF данные (дата съёмки, модель камеры/телефона)</li>
              <li>GPS координаты (геолокация)</li>
              <li>Информация о программе редактирования</li>
              <li>Авторские права, комментарии, теги</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all flex-shrink-0
          ${isDragging 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-dark-600 hover:border-dark-500 hover:bg-dark-700/30'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept={ALL_SUPPORTED.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <FileVideo className="w-8 h-8 text-dark-400" />
            <FileImage className="w-8 h-8 text-dark-400" />
            <FileAudio className="w-8 h-8 text-dark-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-dark-200">
              {isDragging ? 'Отпустите файлы' : 'Перетащите файлы сюда'}
            </p>
            <p className="text-sm text-dark-400 mt-1">
              или нажмите для выбора • Видео, изображения, аудио • до 500 МБ
            </p>
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="text-sm text-dark-400">
              Файлов: {files.length}
              {doneCount > 0 && <span className="text-green-400 ml-2">✓ {doneCount}</span>}
              {errorCount > 0 && <span className="text-red-400 ml-2">✗ {errorCount}</span>}
            </span>
            {pendingCount > 0 && !isProcessing && (
              <button
                onClick={processAllFiles}
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Очистить метаданные ({pendingCount})
              </button>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-primary-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Обработка...</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {files.map((item) => {
              const Icon = getFileIcon(item.file.type);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-dark-700/50 rounded-xl p-4"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: item.status === 'done' 
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                        : item.status === 'error'
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : getTheme().colors.gradient 
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-dark-400">
                      {getFileTypeLabel(item.file.type)} • {formatFileSize(item.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {(item.status === 'uploading' || item.status === 'processing') && (
                      <div className="mt-2 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300 rounded-full"
                          style={{ 
                            width: `${item.progress}%`,
                            background: getTheme().colors.gradient
                          }}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === 'error' && item.error && (
                      <p className="text-xs text-red-400 mt-1">{item.error}</p>
                    )}
                  </div>

                  {/* Status / Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === 'pending' && (
                      <span className="text-xs text-dark-400 px-2 py-1 bg-dark-600 rounded">
                        Ожидает
                      </span>
                    )}
                    
                    {item.status === 'uploading' && (
                      <span className="text-xs text-primary-400">
                        {item.progress}%
                      </span>
                    )}
                    
                    {item.status === 'processing' && (
                      <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                    )}
                    
                    {item.status === 'done' && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <button
                          onClick={() => downloadFile(item)}
                          className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                          title="Скачать"
                        >
                          <Download className="w-4 h-4 text-dark-300" />
                        </button>
                      </>
                    )}
                    
                    {item.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}

                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <X className="w-4 h-4 text-dark-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-dark-400">
            <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Загрузите файлы для очистки метаданных</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetadataCleaner;

