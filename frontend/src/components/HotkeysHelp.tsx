import { X, Keyboard } from 'lucide-react';

interface HotkeysHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const hotkeys = [
  {
    category: 'Основные',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Открыть палитру команд' },
      { keys: ['?'], description: 'Показать справку по клавишам' },
      { keys: ['N'], description: 'Создать новую задачу' },
      { keys: ['Esc'], description: 'Закрыть модальное окно' },
    ],
  },
  {
    category: 'Навигация (G + буква)',
    items: [
      { keys: ['G', 'D'], description: 'Перейти на Дашборд' },
      { keys: ['G', 'T'], description: 'Перейти в Задачи' },
      { keys: ['G', 'O'], description: 'Перейти в Офферы' },
      { keys: ['G', 'P'], description: 'Перейти в Партнёрки' },
      { keys: ['G', 'A'], description: 'Перейти в Аналитику' },
      { keys: ['G', 'K'], description: 'Перейти в Базу знаний' },
      { keys: ['G', 'S'], description: 'Перейти в Настройки' },
      { keys: ['G', 'U'], description: 'Перейти в Пользователи' },
    ],
  },
  {
    category: 'В палитре команд',
    items: [
      { keys: ['↑', '↓'], description: 'Навигация по списку' },
      { keys: ['Enter'], description: 'Выполнить действие' },
      { keys: ['Esc'], description: 'Закрыть палитру' },
    ],
  },
];

function HotkeysHelp({ isOpen, onClose }: HotkeysHelpProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100">Горячие клавиши</h2>
              <p className="text-sm text-dark-400">Быстрые действия с клавиатуры</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotkeys.map((group) => (
              <div key={group.category}>
                <h3 className="text-sm font-medium text-dark-300 mb-3">{group.category}</h3>
                <div className="space-y-2">
                  {group.items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-dark-700/50 rounded-lg"
                    >
                      <span className="text-sm text-dark-300">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className="px-2 py-1 bg-dark-600 border border-dark-500 rounded text-xs text-dark-200 font-mono">
                              {key}
                            </kbd>
                            {keyIndex < item.keys.length - 1 && (
                              <span className="mx-1 text-dark-500">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-700 bg-dark-800/50">
          <p className="text-xs text-dark-500 text-center">
            Нажмите <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-dark-400">Esc</kbd> для закрытия
          </p>
        </div>
      </div>
    </div>
  );
}

export default HotkeysHelp;

