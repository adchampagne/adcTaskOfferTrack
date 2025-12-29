import { useState, useRef } from 'react';
import { X, Palette, Image, Upload, Trash2, Check, SlidersHorizontal } from 'lucide-react';
import { useSettingsStore, themes, backgroundOptions } from '../store/settingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function PersonalizationSettings({ isOpen, onClose }: Props) {
  const {
    themeId,
    backgroundId,
    customBackground,
    backgroundBlur,
    backgroundOpacity,
    setTheme,
    setBackground,
    setCustomBackground,
    setBackgroundBlur,
    setBackgroundOpacity,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'background'>('theme');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomBackground(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = () => {
    const url = prompt('Введите URL изображения:');
    if (url && url.trim()) {
      setCustomBackground(url.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-100">Персонализация</h2>
              <p className="text-sm text-dark-400">Настройте внешний вид под себя</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-700">
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'theme'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <Palette className="w-5 h-5" />
            Цветовая тема
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'background'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <Image className="w-5 h-5" />
            Фон
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <p className="text-dark-400 text-sm mb-4">
                Выберите цветовую схему для интерфейса
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      themeId === theme.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 hover:border-dark-500 bg-dark-800/50'
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-lg mb-3"
                      style={{ background: theme.colors.gradient }}
                    />
                    <p className="text-sm font-medium text-dark-200 truncate">
                      {theme.name}
                    </p>
                    {themeId === theme.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="space-y-6">
              {/* Предустановленные фоны */}
              <div>
                <p className="text-dark-400 text-sm mb-4">
                  Выберите фон или загрузите свой
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {backgroundOptions.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBackground(bg.id)}
                      className={`relative p-2 rounded-xl border-2 transition-all ${
                        backgroundId === bg.id && !customBackground
                          ? 'border-primary-500'
                          : 'border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      <div
                        className="w-full h-16 rounded-lg mb-2"
                        style={{ background: bg.value }}
                      />
                      <p className="text-xs font-medium text-dark-300 truncate">
                        {bg.name}
                      </p>
                      {backgroundId === bg.id && !customBackground && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кастомный фон */}
              <div className="border-t border-dark-700 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-5 h-5 text-dark-400" />
                  <span className="text-dark-200 font-medium">Свой фон</span>
                </div>
                
                <div className="flex gap-3 mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Загрузить файл
                  </button>
                  <button
                    onClick={handleUrlInput}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Вставить URL
                  </button>
                </div>

                {customBackground && (
                  <div className="relative rounded-xl overflow-hidden border border-dark-600">
                    <img
                      src={customBackground}
                      alt="Кастомный фон"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      onClick={() => setCustomBackground(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                      Текущий фон
                    </div>
                  </div>
                )}
              </div>

              {/* Настройки фона */}
              {customBackground && (
                <div className="border-t border-dark-700 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <SlidersHorizontal className="w-5 h-5 text-dark-400" />
                    <span className="text-dark-200 font-medium">Настройки фона</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-dark-300">Размытие</label>
                        <span className="text-sm text-dark-400">{backgroundBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={backgroundBlur}
                        onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                        className="w-full accent-primary-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-dark-300">Затемнение</label>
                        <span className="text-sm text-dark-400">{100 - backgroundOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                        className="w-full accent-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-700 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}

export default PersonalizationSettings;

