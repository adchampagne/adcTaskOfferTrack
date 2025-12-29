import { useState, useCallback, useRef } from 'react';
import { 
  ImageIcon, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Settings,
  ArrowRight,
  FileImage,
  Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ConvertedFile {
  id: string;
  originalFile: File;
  originalUrl: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  error?: string;
  originalSize: number;
  convertedSize?: number;
}

interface ConversionSettings {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  resize: boolean;
  maxWidth: number;
  maxHeight: number;
}

const FORMAT_OPTIONS = [
  { value: 'jpeg', label: 'JPG', mime: 'image/jpeg', description: 'Для фото, хорошее сжатие' },
  { value: 'png', label: 'PNG', mime: 'image/png', description: 'С прозрачностью, без потерь' },
  { value: 'webp', label: 'WebP', mime: 'image/webp', description: 'Современный, лёгкий' },
];

const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

function ImageConverter() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<ConversionSettings>({
    format: 'webp',
    quality: 85,
    resize: false,
    maxWidth: 1920,
    maxHeight: 1080,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const calculateSavings = (original: number, converted: number) => {
    const savings = ((original - converted) / original) * 100;
    return Math.round(savings);
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(f => SUPPORTED_TYPES.includes(f.type));
    
    const items: ConvertedFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      status: 'pending',
      originalSize: file.size,
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
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.originalUrl);
        if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    files.forEach(f => {
      URL.revokeObjectURL(f.originalUrl);
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
  }, [files]);

  // Конвертация одного файла
  const convertFile = async (item: ConvertedFile): Promise<ConvertedFile> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve({ ...item, status: 'error', error: 'Canvas не доступен' });
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ ...item, status: 'error', error: 'Context не доступен' });
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Ресайз если нужно
        if (settings.resize) {
          const ratio = Math.min(
            settings.maxWidth / width,
            settings.maxHeight / height,
            1 // Не увеличиваем
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Для JPEG/WebP - белый фон (прозрачность не поддерживается)
        if (settings.format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = FORMAT_OPTIONS.find(f => f.value === settings.format)?.mime || 'image/webp';
        const quality = settings.format === 'png' ? undefined : settings.quality / 100;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const convertedUrl = URL.createObjectURL(blob);
              resolve({
                ...item,
                status: 'done',
                convertedBlob: blob,
                convertedUrl,
                convertedSize: blob.size,
              });
            } else {
              resolve({ ...item, status: 'error', error: 'Ошибка конвертации' });
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve({ ...item, status: 'error', error: 'Ошибка загрузки изображения' });
      };

      img.src = item.originalUrl;
    });
  };

  // Конвертировать все файлы
  const convertAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);

    for (const item of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === item.id ? { ...f, status: 'converting' } : f
      ));

      const result = await convertFile(item);

      setFiles(prev => prev.map(f => 
        f.id === item.id ? result : f
      ));
    }

    setIsConverting(false);
  };

  // Скачать файл
  const downloadFile = (item: ConvertedFile) => {
    if (!item.convertedBlob) return;

    const extension = settings.format === 'jpeg' ? 'jpg' : settings.format;
    const originalName = item.originalFile.name.replace(/\.[^.]+$/, '');
    const newName = `${originalName}.${extension}`;

    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Скачать все
  const downloadAll = () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.convertedBlob);
    doneFiles.forEach((item, index) => {
      setTimeout(() => downloadFile(item), index * 100);
    });
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  const totalOriginalSize = files.reduce((sum, f) => sum + f.originalSize, 0);
  const totalConvertedSize = files.reduce((sum, f) => sum + (f.convertedSize || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hidden Canvas for conversion */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            to="/tools"
            className="text-dark-400 hover:text-dark-200 transition-colors"
          >
            ← Инструменты
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-secondary flex items-center gap-2 ${showSettings ? 'ring-2 ring-primary-500' : ''}`}
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
          
          {files.length > 0 && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600"
        >
          <ImageIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Конвертер изображений</h1>
          <p className="text-sm text-dark-400">Конвертация форматов, сжатие и изменение размера</p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="glass-card p-4 mb-6 flex-shrink-0 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Формат
              </label>
              <div className="space-y-2">
                {FORMAT_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      settings.format === opt.value
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'bg-dark-700/50 border border-transparent hover:bg-dark-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={opt.value}
                      checked={settings.format === opt.value}
                      onChange={(e) => setSettings(s => ({ ...s, format: e.target.value as ConversionSettings['format'] }))}
                      className="hidden"
                    />
                    <span className={`text-sm font-medium ${settings.format === opt.value ? 'text-primary-400' : 'text-dark-200'}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-dark-400">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Качество: {settings.quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.quality}
                onChange={(e) => setSettings(s => ({ ...s, quality: parseInt(e.target.value) }))}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                disabled={settings.format === 'png'}
              />
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>Меньше размер</span>
                <span>Лучше качество</span>
              </div>
              {settings.format === 'png' && (
                <p className="text-xs text-dark-400 mt-2">PNG сжимается без потерь</p>
              )}
            </div>

            {/* Resize */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <input
                  type="checkbox"
                  checked={settings.resize}
                  onChange={(e) => setSettings(s => ({ ...s, resize: e.target.checked }))}
                  className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                />
                Изменить размер
              </label>
              
              {settings.resize && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-dark-400" />
                    <input
                      type="number"
                      value={settings.maxWidth}
                      onChange={(e) => setSettings(s => ({ ...s, maxWidth: parseInt(e.target.value) || 800 }))}
                      className="glass-input w-24 text-sm"
                      placeholder="Ширина"
                    />
                    <span className="text-dark-400">×</span>
                    <input
                      type="number"
                      value={settings.maxHeight}
                      onChange={(e) => setSettings(s => ({ ...s, maxHeight: parseInt(e.target.value) || 600 }))}
                      className="glass-input w-24 text-sm"
                      placeholder="Высота"
                    />
                  </div>
                  <p className="text-xs text-dark-400">Максимальный размер (пропорции сохраняются)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          accept={SUPPORTED_TYPES.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4">
          <FileImage className="w-12 h-12 text-dark-400" />
          <div>
            <p className="text-lg font-medium text-dark-200">
              {isDragging ? 'Отпустите файлы' : 'Перетащите изображения сюда'}
            </p>
            <p className="text-sm text-dark-400 mt-1">
              или нажмите для выбора • JPG, PNG, WebP, GIF, BMP
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {files.length > 0 && doneCount > 0 && (
        <div className="flex items-center justify-center gap-8 py-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-sm text-dark-400">Исходный размер</p>
            <p className="text-lg font-semibold text-dark-200">{formatFileSize(totalOriginalSize)}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary-400" />
          <div className="text-center">
            <p className="text-sm text-dark-400">После конвертации</p>
            <p className="text-lg font-semibold text-green-400">{formatFileSize(totalConvertedSize)}</p>
          </div>
          {totalConvertedSize > 0 && (
            <div className="text-center px-4 py-2 bg-green-500/10 rounded-xl">
              <p className="text-sm text-green-400">
                Экономия {calculateSavings(totalOriginalSize, totalConvertedSize)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <span className="text-sm text-dark-400">
              Файлов: {files.length}
              {doneCount > 0 && <span className="text-green-400 ml-2">✓ {doneCount}</span>}
              {errorCount > 0 && <span className="text-red-400 ml-2">✗ {errorCount}</span>}
            </span>
            {pendingCount > 0 && !isConverting && (
              <button
                onClick={convertAllFiles}
                className="btn-primary flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Конвертировать ({pendingCount})
              </button>
            )}
            {isConverting && (
              <div className="flex items-center gap-2 text-primary-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Конвертация...</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-4 animate-fade-in"
                >
                  {/* Preview */}
                  <div className="relative aspect-video bg-dark-800 rounded-xl overflow-hidden mb-3">
                    <img
                      src={item.convertedUrl || item.originalUrl}
                      alt={item.originalFile.name}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Status overlay */}
                    {item.status === 'converting' && (
                      <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(item.id)}
                      className="absolute top-2 right-2 p-1.5 bg-dark-900/80 rounded-lg hover:bg-red-500/80 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-dark-200 truncate" title={item.originalFile.name}>
                      {item.originalFile.name}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">
                        {formatFileSize(item.originalSize)}
                      </span>
                      
                      {item.status === 'done' && item.convertedSize && (
                        <>
                          <ArrowRight className="w-3 h-3 text-dark-500" />
                          <span className="text-green-400 font-medium">
                            {formatFileSize(item.convertedSize)}
                            <span className="text-dark-500 ml-1">
                              (-{calculateSavings(item.originalSize, item.convertedSize)}%)
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      {item.status === 'pending' && (
                        <span className="text-xs text-dark-400 px-2 py-1 bg-dark-700 rounded">
                          Ожидает
                        </span>
                      )}
                      
                      {item.status === 'converting' && (
                        <span className="text-xs text-primary-400">
                          Конвертация...
                        </span>
                      )}
                      
                      {item.status === 'done' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">Готово</span>
                        </div>
                      )}
                      
                      {item.status === 'error' && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-400">{item.error}</span>
                        </div>
                      )}

                      {item.status === 'done' && (
                        <button
                          onClick={() => downloadFile(item)}
                          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                          title="Скачать"
                        >
                          <Download className="w-4 h-4 text-dark-300" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-dark-400">
            <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Загрузите изображения для конвертации</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageConverter;

