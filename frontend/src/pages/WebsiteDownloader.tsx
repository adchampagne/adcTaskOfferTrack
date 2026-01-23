import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Globe, 
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Send,
  Archive,
  Info,
  Clipboard
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

function WebsiteDownloader() {
  const { getTheme } = useSettingsStore();
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAndOpened, setCopiedAndOpened] = useState(false);
  const [error, setError] = useState('');

  // Валидация URL
  const validateUrl = (input: string): boolean => {
    if (!input.trim()) return false;
    try {
      const urlObj = new URL(input.startsWith('http') ? input : `https://${input}`);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Нормализация URL
  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  };

  // Открыть в Telegram (сначала копируем URL, потом открываем бот)
  const handleOpenTelegram = async () => {
    if (!validateUrl(url)) {
      setError('Введите корректный URL сайта');
      return;
    }
    setError('');
    
    try {
      // Копируем URL в буфер обмена
      await navigator.clipboard.writeText(normalizeUrl(url));
      setCopiedAndOpened(true);
      
      // Открываем бот
      window.open('https://t.me/webtozip_bot', '_blank');
      
      // Сбрасываем состояние через 5 секунд
      setTimeout(() => setCopiedAndOpened(false), 5000);
    } catch (err) {
      console.error('Ошибка:', err);
      // Если не удалось скопировать, всё равно открываем бот
      window.open('https://t.me/webtozip_bot', '_blank');
    }
  };

  // Копировать URL
  const handleCopyUrl = async () => {
    if (!validateUrl(url)) {
      setError('Введите корректный URL сайта');
      return;
    }
    setError('');
    try {
      await navigator.clipboard.writeText(normalizeUrl(url));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const isValidUrl = validateUrl(url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <Link 
          to="/tools" 
          className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к инструментам</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: getTheme().colors.gradient }}
          >
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Скачать сайт</h1>
            <p className="text-dark-400">Скачивание сайта в ZIP-архив через Telegram бот</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основная карточка */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100">URL сайта</h2>
              <p className="text-sm text-dark-400">Введите адрес сайта для скачивания</p>
            </div>
          </div>

          {/* Поле ввода URL */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                placeholder="example.com или https://example.com"
                className={`input-field w-full pl-10 pr-10 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              {url && isValidUrl && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(normalizeUrl(url));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                  title="Копировать URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Превью URL */}
            {url && isValidUrl && (
              <div className="p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                <div className="text-xs text-dark-500 mb-1">Будет скачан:</div>
                <div className="text-sm text-dark-200 font-mono break-all">
                  {normalizeUrl(url)}
                </div>
              </div>
            )}

            {/* Уведомление о копировании */}
            {copiedAndOpened && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                <Clipboard className="w-4 h-4" />
                <span className="text-sm">URL скопирован! Вставьте его в чат с ботом (Ctrl+V)</span>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleOpenTelegram}
                disabled={!url.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Скопировать и открыть бот
              </button>
              
              <button
                onClick={handleCopyUrl}
                disabled={!url.trim()}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Копировать URL
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Информационная карточка */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Как это работает</h2>
              <p className="text-sm text-dark-400">Инструкция по использованию</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-400">1</span>
              </div>
              <div>
                <div className="text-sm font-medium text-dark-200">Введите URL сайта</div>
                <div className="text-xs text-dark-500 mt-0.5">Укажите адрес сайта, который хотите скачать</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-400">2</span>
              </div>
              <div>
                <div className="text-sm font-medium text-dark-200">Нажмите "Скопировать и открыть бот"</div>
                <div className="text-xs text-dark-500 mt-0.5">URL автоматически скопируется в буфер обмена</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-400">3</span>
              </div>
              <div>
                <div className="text-sm font-medium text-dark-200">Вставьте URL в чат (Ctrl+V)</div>
                <div className="text-xs text-dark-500 mt-0.5">Бот начнёт скачивать сайт и пришлёт ZIP-архив</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Archive className="w-3 h-3 text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-dark-200">Получите архив</div>
                <div className="text-xs text-dark-500 mt-0.5">Скачайте готовый ZIP с файлами сайта</div>
              </div>
            </div>
          </div>

          {/* Прямая ссылка на бот */}
          <div className="mt-6 pt-4 border-t border-dark-700">
            <a
              href="https://t.me/webtozip_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-primary-500/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#229ED9] flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-dark-200 group-hover:text-primary-400 transition-colors">
                    @webtozip_bot
                  </div>
                  <div className="text-xs text-dark-500">Telegram бот для скачивания сайтов</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>

      {/* Предупреждение */}
      <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-300">Обратите внимание</div>
            <div className="text-xs text-dark-400 mt-1">
              Это внешний бот, не принадлежащий нашей команде. Используйте на свой страх и риск. 
              Бот может иметь ограничения по размеру сайта и скорости скачивания.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebsiteDownloader;

