import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Link2, 
  Copy, 
  Check,
  RotateCcw,
  ExternalLink,
  Bookmark,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UTMParams {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

interface CustomParam {
  id: string;
  key: string;
  value: string;
}

interface Template {
  name: string;
  icon: string;
  source: string;
  medium: string;
  description: string;
}

const TEMPLATES: Template[] = [
  { name: 'Facebook Ads', icon: '📘', source: 'facebook', medium: 'cpc', description: 'Рекламные кампании FB' },
  { name: 'TikTok Ads', icon: '🎵', source: 'tiktok', medium: 'cpc', description: 'TikTok for Business' },
  { name: 'Google Ads', icon: '🔍', source: 'google', medium: 'cpc', description: 'Google Ads кампании' },
  { name: 'Instagram', icon: '📷', source: 'instagram', medium: 'social', description: 'Посты и сторис' },
  { name: 'Telegram', icon: '✈️', source: 'telegram', medium: 'social', description: 'Каналы и чаты' },
  { name: 'Email', icon: '📧', source: 'email', medium: 'email', description: 'Email рассылки' },
  { name: 'Push', icon: '🔔', source: 'push', medium: 'push', description: 'Push-уведомления' },
  { name: 'Native', icon: '📰', source: 'native', medium: 'cpc', description: 'Native Ads' },
];

function UTMGenerator() {
  const [params, setParams] = useState<UTMParams>({
    url: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });

  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [copied, setCopied] = useState(false);

  const updateParam = (key: keyof UTMParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (template: Template) => {
    setParams(prev => ({
      ...prev,
      source: template.source,
      medium: template.medium,
    }));
    toast.success(`Шаблон "${template.name}" применён`);
  };

  const addCustomParam = () => {
    setCustomParams(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const updateCustomParam = (id: string, field: 'key' | 'value', value: string) => {
    setCustomParams(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removeCustomParam = (id: string) => {
    setCustomParams(prev => prev.filter(p => p.id !== id));
  };

  const generatedUrl = useMemo(() => {
    if (!params.url) return '';

    try {
      // Проверяем и добавляем протокол если нужно
      let baseUrl = params.url.trim();
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }

      const url = new URL(baseUrl);

      // Добавляем UTM параметры
      if (params.source) url.searchParams.set('utm_source', params.source);
      if (params.medium) url.searchParams.set('utm_medium', params.medium);
      if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
      if (params.term) url.searchParams.set('utm_term', params.term);
      if (params.content) url.searchParams.set('utm_content', params.content);

      // Добавляем кастомные параметры
      customParams.forEach(p => {
        if (p.key && p.value) {
          url.searchParams.set(p.key, p.value);
        }
      });

      return url.toString();
    } catch {
      return '';
    }
  }, [params, customParams]);

  const copyUrl = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setParams({
      url: '',
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: '',
    });
    setCustomParams([]);
  };

  const openUrl = () => {
    if (generatedUrl) {
      window.open(generatedUrl, '_blank');
    }
  };

  const hasParams = params.source || params.medium || params.campaign || params.term || params.content || customParams.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Back link */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link 
          to="/tools"
          className="text-dark-400 hover:text-dark-200 transition-colors"
        >
          ← Инструменты
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">UTM генератор</h1>
            <p className="text-sm text-dark-400">Создание ссылок с UTM-метками для кампаний</p>
          </div>
        </div>

        {hasParams && (
          <button
            onClick={resetAll}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Base URL */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary-400" />
                Базовый URL
              </h2>
              <input
                type="text"
                value={params.url}
                onChange={(e) => updateParam('url', e.target.value)}
                placeholder="https://example.com/landing"
                className="glass-input w-full text-lg"
              />
            </div>

            {/* Templates */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Быстрые шаблоны
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATES.map(template => (
                  <button
                    key={template.name}
                    onClick={() => applyTemplate(template)}
                    className="p-3 bg-dark-700/50 hover:bg-dark-600 rounded-xl transition-colors text-left group"
                    title={template.description}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <p className="text-xs text-dark-300 mt-1 group-hover:text-dark-100 transition-colors truncate">
                      {template.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* UTM Parameters */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-green-400" />
                UTM параметры
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    utm_source <span className="text-dark-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={params.source}
                    onChange={(e) => updateParam('source', e.target.value)}
                    placeholder="facebook, google, tiktok..."
                    className="glass-input w-full"
                  />
                  <p className="text-xs text-dark-500 mt-1">Источник трафика</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    utm_medium <span className="text-dark-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={params.medium}
                    onChange={(e) => updateParam('medium', e.target.value)}
                    placeholder="cpc, cpm, social, email..."
                    className="glass-input w-full"
                  />
                  <p className="text-xs text-dark-500 mt-1">Тип трафика</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    utm_campaign
                  </label>
                  <input
                    type="text"
                    value={params.campaign}
                    onChange={(e) => updateParam('campaign', e.target.value)}
                    placeholder="summer_sale, black_friday..."
                    className="glass-input w-full"
                  />
                  <p className="text-xs text-dark-500 mt-1">Название кампании</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      utm_term
                    </label>
                    <input
                      type="text"
                      value={params.term}
                      onChange={(e) => updateParam('term', e.target.value)}
                      placeholder="ключевое слово"
                      className="glass-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">
                      utm_content
                    </label>
                    <input
                      type="text"
                      value={params.content}
                      onChange={(e) => updateParam('content', e.target.value)}
                      placeholder="banner_1, video_2..."
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Parameters */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Дополнительные параметры
                </h2>
                <button
                  onClick={addCustomParam}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {customParams.length === 0 ? (
                <p className="text-dark-500 text-sm">
                  Добавьте свои параметры: sub1, clickid, и т.д.
                </p>
              ) : (
                <div className="space-y-3">
                  {customParams.map(param => (
                    <div key={param.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => updateCustomParam(param.id, 'key', e.target.value)}
                        placeholder="параметр"
                        className="glass-input flex-1"
                      />
                      <span className="text-dark-500">=</span>
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateCustomParam(param.id, 'value', e.target.value)}
                        placeholder="значение"
                        className="glass-input flex-1"
                      />
                      <button
                        onClick={() => removeCustomParam(param.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-dark-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Result */}
          <div className="lg:sticky lg:top-0 lg:self-start">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">
                Готовая ссылка
              </h2>

              {generatedUrl ? (
                <>
                  <div className="bg-dark-800 rounded-xl p-4 mb-4 break-all">
                    <code className="text-sm text-primary-400">
                      {generatedUrl}
                    </code>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={copyUrl}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Копировать
                        </>
                      )}
                    </button>
                    <button
                      onClick={openUrl}
                      className="btn-secondary flex items-center gap-2"
                      title="Открыть в новой вкладке"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* URL Breakdown */}
                  <div className="mt-6 pt-4 border-t border-dark-700">
                    <h3 className="text-sm font-medium text-dark-300 mb-3">Разбор ссылки:</h3>
                    <div className="space-y-2 text-sm">
                      {params.source && (
                        <div className="flex justify-between">
                          <span className="text-dark-400">utm_source</span>
                          <span className="text-dark-200 font-mono">{params.source}</span>
                        </div>
                      )}
                      {params.medium && (
                        <div className="flex justify-between">
                          <span className="text-dark-400">utm_medium</span>
                          <span className="text-dark-200 font-mono">{params.medium}</span>
                        </div>
                      )}
                      {params.campaign && (
                        <div className="flex justify-between">
                          <span className="text-dark-400">utm_campaign</span>
                          <span className="text-dark-200 font-mono">{params.campaign}</span>
                        </div>
                      )}
                      {params.term && (
                        <div className="flex justify-between">
                          <span className="text-dark-400">utm_term</span>
                          <span className="text-dark-200 font-mono">{params.term}</span>
                        </div>
                      )}
                      {params.content && (
                        <div className="flex justify-between">
                          <span className="text-dark-400">utm_content</span>
                          <span className="text-dark-200 font-mono">{params.content}</span>
                        </div>
                      )}
                      {customParams.filter(p => p.key && p.value).map(p => (
                        <div key={p.id} className="flex justify-between">
                          <span className="text-blue-400">{p.key}</span>
                          <span className="text-dark-200 font-mono">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Link2 className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                  <p className="text-dark-400">Введите URL для генерации ссылки</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="glass-card p-6 mt-4 bg-dark-700/30">
              <h3 className="text-sm font-medium text-dark-200 mb-2">💡 Советы:</h3>
              <ul className="text-sm text-dark-400 space-y-1.5">
                <li>• Используйте <code className="text-primary-400">snake_case</code> для названий</li>
                <li>• utm_source и utm_medium — обязательные для аналитики</li>
                <li>• Добавляйте sub1, sub2 для дополнительного трекинга</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UTMGenerator;

