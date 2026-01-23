import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink,
  Send,
  Globe
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

function WebsiteDownloader() {
  const { getTheme } = useSettingsStore();

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
            <p className="text-dark-400">Скачивание сайта в ZIP-архив</p>
          </div>
        </div>
      </div>

      {/* Ссылки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telegram бот */}
        <a
          href="https://t.me/webtozip_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card p-6 hover:border-primary-500/30 transition-all group animate-fade-in"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#229ED9] flex items-center justify-center flex-shrink-0">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition-colors">
                  @webtozip_bot
                </h2>
                <ExternalLink className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-sm text-dark-400 mt-1">
                Telegram бот для скачивания сайтов. Отправьте ссылку — получите ZIP-архив.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded">Telegram</span>
                <span className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded">Бот</span>
                <span className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded">ZIP</span>
              </div>
            </div>
          </div>
        </a>

        {/* Веб-сервис */}
        <a
          href="https://saveweb2zip.com/ru"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card p-6 hover:border-primary-500/30 transition-all group animate-fade-in"
          style={{ animationDelay: '50ms' }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition-colors">
                  SaveWeb2ZIP
                </h2>
                <ExternalLink className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
              </div>
              <p className="text-sm text-dark-400 mt-1">
                Веб-сервис для скачивания сайтов. Вставьте ссылку на сайте — скачайте архив.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded">Веб</span>
                <span className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded">Онлайн</span>
                <span className="px-2 py-1 text-xs bg-dark-700 text-dark-300 rounded">ZIP</span>
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

export default WebsiteDownloader;
