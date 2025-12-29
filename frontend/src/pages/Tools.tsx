import { Link } from 'react-router-dom';
import { 
  Wrench, 
  ShieldCheck, 
  ImageIcon,
  ArrowRight
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

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
      className="glass-card p-6 hover:border-primary-500/30 transition-all group animate-fade-in h-full flex flex-col"
    >
      <div className="flex items-start gap-4 flex-1">
        <div 
          className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition-colors flex items-center gap-2">
            {title}
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-sm text-dark-400 mt-1 flex-1">{description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dark-700/50">
        {tags.map(tag => (
          <span 
            key={tag}
            className="px-2 py-0.5 text-xs bg-dark-700 text-dark-300 rounded-md"
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
      description: 'Конвертация форматов, сжатие и изменение размера изображений',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      tags: ['PNG', 'JPG', 'WebP', 'Сжатие', 'Ресайз']
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {tools.map((tool, index) => (
          <div key={tool.to} style={{ animationDelay: `${index * 100}ms` }} className="flex">
            <ToolCard {...tool} />
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="glass-card p-6 border-dashed opacity-60">
        <div className="text-center">
          <p className="text-dark-400">Скоро появятся новые инструменты...</p>
        </div>
      </div>
    </div>
  );
}

export default Tools;

