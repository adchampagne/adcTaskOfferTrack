import { Link } from 'react-router-dom';
import { 
  Wrench, 
  ShieldCheck, 
  ImageIcon,
  ArrowRight,
  Users,
  Calculator,
  Link2,
  Globe,
  Download
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';

interface ToolCardProps {
  to: string;
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  gradient: string;
  tags: string[];
}

function ToolCard({ to, icon: Icon, title, description, gradient, tags }: ToolCardProps) {
  return (
    <Link 
      to={to}
      className="glass-card p-4 hover:border-primary-500/30 transition-all group animate-fade-in h-full flex flex-col"
    >
      <div className="flex items-start gap-3 flex-1">
        <div 
          className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-base font-semibold text-dark-100 group-hover:text-primary-400 transition-colors flex items-center gap-1.5">
            {title}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dark-700/50">
        {tags.slice(0, 4).map(tag => (
          <span 
            key={tag}
            className="px-1.5 py-0.5 text-xs bg-dark-700 text-dark-300 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

function Tools() {
  const { getTheme } = useSettingsStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('admin');

  const tools: ToolCardProps[] = [
    {
      to: '/tools/metadata-cleaner',
      icon: ShieldCheck,
      title: 'Очистка метаданных',
      description: 'Удаление EXIF, GPS и другой скрытой информации из фото, видео и аудио файлов',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      tags: ['Фото', 'Видео', 'Аудио', 'EXIF', 'GPS']
    },
    {
      to: '/tools/image-converter',
      icon: ImageIcon,
      title: 'Конвертер изображений',
      description: 'Конвертация изображений в WebP, JPG или PNG с настройкой качества и размера',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      tags: ['PNG', 'JPG', 'WebP', 'Сжатие', 'Ресайз']
    },
    {
      to: '/tools/data-generator',
      icon: Users,
      title: 'Генератор данных',
      description: 'Создание случайных имён, телефонов и email для разных гео с учётом страны и пола',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
      tags: ['Имена', 'Телефоны', 'Email', 'Гео', 'Тесты']
    },
    {
      to: '/tools/roi-calculator',
      icon: Calculator,
      title: 'Калькулятор ROI',
      description: 'Расчёт ROI, профита, CR, EPC, CPA, eCPC, eCPM и других важных метрик',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      tags: ['ROI', 'EPC', 'CPA', 'CR', 'Профит']
    },
    {
      to: '/tools/utm-generator',
      icon: Link2,
      title: 'UTM генератор',
      description: 'Создание ссылок с UTM-метками для кампаний с шаблонами под разные источники',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      tags: ['UTM', 'Ссылки', 'FB', 'TikTok', 'Google']
    },
    {
      to: '/tools/redirect-checker',
      icon: ArrowRight,
      title: 'Проверка редиректов',
      description: 'Анализ цепочки редиректов, статус-коды и финальный URL',
      gradient: 'bg-gradient-to-br from-rose-500 to-pink-600',
      tags: ['Редиректы', 'HTTP', 'Дебаг', 'Клоака']
    },
    {
      to: '/tools/timezone-converter',
      icon: Globe,
      title: 'Часовые пояса',
      description: 'Конвертация времени между часовыми поясами для планирования кампаний',
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      tags: ['Время', 'US', 'EU', 'Гео', 'Расписание']
    },
    // Только для админов
    ...(isAdmin ? [{
      to: '/tools/website-downloader',
      icon: Download,
      title: 'Скачать сайт',
      description: 'Скачивание сайта в ZIP-архив через Telegram бот @webtozip_bot',
      gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      tags: ['Сайт', 'ZIP', 'Telegram', 'Архив']
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: getTheme().colors.gradient }}
          >
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Инструменты</h1>
            <p className="text-dark-400">Полезные утилиты для работы с файлами</p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tools.map((tool, index) => (
          <div key={tool.to} style={{ animationDelay: `${index * 50}ms` }} className="flex">
            <ToolCard {...tool} />
          </div>
        ))}
      </div>

    </div>
  );
}

export default Tools;

