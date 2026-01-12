import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  LayoutDashboard,
  Building2,
  Package,
  CheckSquare,
  Users,
  Layers,
  BarChart3,
  TrendingUp,
  BookOpen,
  Settings,
  Wrench,
  Trophy,
  Plus,
  FileText,
  Command,
  ArrowRight,
  Keyboard,
  ImageIcon,
  Trash2,
  Database
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: typeof Search;
  category: 'navigation' | 'action' | 'tool';
  shortcut?: string;
  action: () => void;
  roles?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal?: () => void;
  onOpenOfferModal?: () => void;
  onOpenPartnerModal?: () => void;
}

function CommandPalette({ isOpen, onClose, onOpenTaskModal, onOpenOfferModal, onOpenPartnerModal }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();

  // Определяем все доступные команды
  const allActions: CommandAction[] = useMemo(() => [
    // Навигация
    {
      id: 'nav-dashboard',
      title: 'Дашборд',
      subtitle: 'Главная страница',
      icon: LayoutDashboard,
      category: 'navigation',
      shortcut: 'G D',
      action: () => { navigate('/'); onClose(); },
    },
    {
      id: 'nav-tasks',
      title: 'Задачи',
      subtitle: 'Список всех задач',
      icon: CheckSquare,
      category: 'navigation',
      shortcut: 'G T',
      action: () => { navigate('/tasks'); onClose(); },
    },
    {
      id: 'nav-offers',
      title: 'Офферы',
      subtitle: 'Каталог офферов',
      icon: Package,
      category: 'navigation',
      shortcut: 'G O',
      action: () => { navigate('/offers'); onClose(); },
    },
    {
      id: 'nav-partners',
      title: 'Партнёрки',
      subtitle: 'Список партнёрских программ',
      icon: Building2,
      category: 'navigation',
      shortcut: 'G P',
      action: () => { navigate('/partners'); onClose(); },
      roles: ['admin', 'buying_head', 'bizdev'],
    },
    {
      id: 'nav-departments',
      title: 'Отделы',
      subtitle: 'Структура команды',
      icon: Layers,
      category: 'navigation',
      action: () => { navigate('/departments'); onClose(); },
    },
    {
      id: 'nav-analytics',
      title: 'Аналитика',
      subtitle: 'Статистика и графики',
      icon: TrendingUp,
      category: 'navigation',
      shortcut: 'G A',
      action: () => { navigate('/analytics'); onClose(); },
      roles: ['admin', 'buying_head', 'creo_head', 'dev_head', 'bizdev'],
    },
    {
      id: 'nav-head-dashboard',
      title: 'Мой отдел',
      subtitle: 'Дашборд руководителя',
      icon: BarChart3,
      category: 'navigation',
      action: () => { navigate('/head-dashboard'); onClose(); },
      roles: ['buying_head', 'creo_head', 'dev_head'],
    },
    {
      id: 'nav-achievements',
      title: 'Достижения',
      subtitle: 'Ваши награды',
      icon: Trophy,
      category: 'navigation',
      action: () => { navigate('/achievements'); onClose(); },
    },
    {
      id: 'nav-knowledge',
      title: 'База знаний',
      subtitle: 'Инструкции и документация',
      icon: BookOpen,
      category: 'navigation',
      shortcut: 'G K',
      action: () => { navigate('/knowledge-base'); onClose(); },
    },
    {
      id: 'nav-tools',
      title: 'Инструменты',
      subtitle: 'Полезные утилиты',
      icon: Wrench,
      category: 'navigation',
      action: () => { navigate('/tools'); onClose(); },
    },
    {
      id: 'nav-users',
      title: 'Пользователи',
      subtitle: 'Управление пользователями',
      icon: Users,
      category: 'navigation',
      action: () => { navigate('/users'); onClose(); },
      roles: ['admin'],
    },
    {
      id: 'nav-settings',
      title: 'Настройки',
      subtitle: 'Персонализация',
      icon: Settings,
      category: 'navigation',
      shortcut: 'G S',
      action: () => { navigate('/settings'); onClose(); },
    },

    // Быстрые действия
    {
      id: 'action-new-task',
      title: 'Создать задачу',
      subtitle: 'Новая задача',
      icon: Plus,
      category: 'action',
      shortcut: 'N',
      action: () => { 
        if (onOpenTaskModal) {
          onOpenTaskModal();
        } else {
          navigate('/tasks?new=1');
        }
        onClose(); 
      },
    },
    {
      id: 'action-new-offer',
      title: 'Создать оффер',
      subtitle: 'Новый оффер',
      icon: FileText,
      category: 'action',
      action: () => { 
        if (onOpenOfferModal) {
          onOpenOfferModal();
        } else {
          navigate('/offers?new=1');
        }
        onClose(); 
      },
      roles: ['admin', 'buyer', 'buying_head', 'bizdev'],
    },
    {
      id: 'action-new-partner',
      title: 'Создать партнёрку',
      subtitle: 'Новая партнёрская программа',
      icon: Building2,
      category: 'action',
      action: () => { 
        if (onOpenPartnerModal) {
          onOpenPartnerModal();
        } else {
          navigate('/partners?new=1');
        }
        onClose(); 
      },
      roles: ['admin', 'buyer', 'buying_head', 'bizdev'],
    },

    // Инструменты
    {
      id: 'tool-metadata',
      title: 'Очистка метаданных',
      subtitle: 'Удалить EXIF из изображений',
      icon: Trash2,
      category: 'tool',
      action: () => { navigate('/tools/metadata-cleaner'); onClose(); },
    },
    {
      id: 'tool-converter',
      title: 'Конвертер изображений',
      subtitle: 'Конвертация форматов',
      icon: ImageIcon,
      category: 'tool',
      action: () => { navigate('/tools/image-converter'); onClose(); },
    },
    {
      id: 'tool-generator',
      title: 'Генератор данных',
      subtitle: 'Имена, телефоны, email',
      icon: Database,
      category: 'tool',
      action: () => { navigate('/tools/data-generator'); onClose(); },
    },
  ], [navigate, onClose, onOpenTaskModal, onOpenOfferModal, onOpenPartnerModal]);

  // Фильтруем команды по ролям и поисковому запросу
  const filteredActions = useMemo(() => {
    return allActions.filter(action => {
      // Проверяем роли
      if (action.roles && !action.roles.some(role => hasRole(role as any))) {
        return false;
      }
      
      // Фильтруем по запросу
      if (!query) return true;
      
      const searchLower = query.toLowerCase();
      return (
        action.title.toLowerCase().includes(searchLower) ||
        action.subtitle?.toLowerCase().includes(searchLower) ||
        action.id.toLowerCase().includes(searchLower)
      );
    });
  }, [allActions, query, hasRole]);

  // Группируем по категориям
  const groupedActions = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {
      action: [],
      navigation: [],
      tool: [],
    };
    
    filteredActions.forEach(action => {
      groups[action.category].push(action);
    });
    
    return groups;
  }, [filteredActions]);

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Сбрасываем индекс при изменении результатов
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Скролл к выбранному элементу
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = filteredActions.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    action: 'Быстрые действия',
    navigation: 'Навигация',
    tool: 'Инструменты',
  };

  let currentIndex = -1;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-xl mx-4 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-700">
          <Search className="w-5 h-5 text-dark-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск команд..."
            className="flex-1 bg-transparent border-none outline-none text-dark-100 placeholder:text-dark-500"
            autoComplete="off"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-dark-700 rounded text-xs text-dark-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-dark-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Ничего не найдено</p>
            </div>
          ) : (
            Object.entries(groupedActions).map(([category, actions]) => {
              if (actions.length === 0) return null;
              
              return (
                <div key={category} className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider">
                    {categoryLabels[category]}
                  </div>
                  {actions.map((action) => {
                    currentIndex++;
                    const index = currentIndex;
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <button
                        key={action.id}
                        data-index={index}
                        onClick={action.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${
                          isSelected 
                            ? 'bg-primary-500/20 text-primary-300' 
                            : 'text-dark-200 hover:bg-dark-700/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary-500/30' : 'bg-dark-700'
                        }`}>
                          <action.icon className={`w-5 h-5 ${isSelected ? 'text-primary-400' : 'text-dark-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{action.title}</div>
                          {action.subtitle && (
                            <div className="text-sm text-dark-500 truncate">{action.subtitle}</div>
                          )}
                        </div>
                        {action.shortcut && (
                          <kbd className="hidden sm:block px-2 py-1 bg-dark-700 rounded text-xs text-dark-400 flex-shrink-0">
                            {action.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700 bg-dark-800/50">
          <div className="flex items-center gap-4 text-xs text-dark-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">↓</kbd>
              <span className="ml-1">навигация</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">Enter</kbd>
              <span className="ml-1">выбрать</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">Esc</kbd>
              <span className="ml-1">закрыть</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-500">
            <Keyboard className="w-3 h-3" />
            <span>Быстрые клавиши</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

