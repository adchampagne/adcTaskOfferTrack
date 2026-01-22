import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Link2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowDown,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

interface RedirectStep {
  url: string;
  status: number;
  statusText: string;
  duration?: number;
  headers?: Record<string, string>;
}

interface RedirectResult {
  success: boolean;
  chain: RedirectStep[];
  finalUrl: string;
  totalRedirects: number;
  totalTime: number;
  error?: string;
}

function RedirectChecker() {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<RedirectResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const checkRedirects = async () => {
    if (!url.trim()) {
      toast.error('Введите URL');
      return;
    }

    let checkUrl = url.trim();
    if (!checkUrl.startsWith('http://') && !checkUrl.startsWith('https://')) {
      checkUrl = 'https://' + checkUrl;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const response = await api.post('/tools/check-redirects', { url: checkUrl });
      setResult(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка проверки');
      setResult({
        success: false,
        chain: [],
        finalUrl: '',
        totalRedirects: 0,
        totalTime: 0,
        error: error.response?.data?.error || 'Не удалось проверить URL'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedUrl(urlToCopy);
    toast.success('URL скопирован');
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400 bg-green-500/10';
    if (status >= 300 && status < 400) return 'text-yellow-400 bg-yellow-500/10';
    if (status >= 400 && status < 500) return 'text-orange-400 bg-orange-500/10';
    if (status >= 500) return 'text-red-400 bg-red-500/10';
    return 'text-dark-400 bg-dark-600';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-5 h-5" />;
    if (status >= 300 && status < 400) return <ArrowRight className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const reset = () => {
    setUrl('');
    setResult(null);
  };

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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-rose-500 to-pink-600">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Проверка редиректов</h1>
            <p className="text-sm text-dark-400">Анализ цепочки редиректов и статус-кодов</p>
          </div>
        </div>

        {result && (
          <button
            onClick={reset}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* URL Input */}
        <div className="glass-card p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkRedirects()}
                placeholder="https://example.com/link или короткая ссылка"
                className="glass-input w-full pl-12 text-lg"
              />
            </div>
            <button
              onClick={checkRedirects}
              disabled={isChecking}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Проверить
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`glass-card p-4 ${result.success ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm text-dark-400">Статус</p>
                    <p className={`text-lg font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                      {result.success ? 'Успешно' : 'Ошибка'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-8 h-8 text-primary-400" />
                  <div>
                    <p className="text-sm text-dark-400">Редиректов</p>
                    <p className="text-lg font-semibold text-dark-100">
                      {result.totalRedirects}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-sm text-dark-400">Время</p>
                    <p className="text-lg font-semibold text-dark-100">
                      {result.totalTime} мс
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {result.error && (
              <div className="glass-card p-4 bg-red-500/10 border-red-500/30">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400">{result.error}</p>
                </div>
              </div>
            )}

            {/* Redirect Chain */}
            {result.chain.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  Цепочка редиректов
                </h2>

                <div className="space-y-3">
                  {result.chain.map((step, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-4 p-4 bg-dark-700/50 rounded-xl">
                        {/* Step Number */}
                        <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-dark-300">{index + 1}</span>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${getStatusColor(step.status)}`}>
                              {getStatusIcon(step.status)}
                              {step.status} {step.statusText}
                            </span>
                            
                            {step.duration && (
                              <span className="text-xs text-dark-500">
                                {step.duration} мс
                              </span>
                            )}
                          </div>

                          {/* URL */}
                          <div className="flex items-center gap-2 group">
                            <code className="text-sm text-dark-300 break-all flex-1">
                              {step.url}
                            </code>
                            <button
                              onClick={() => copyUrl(step.url)}
                              className="p-1.5 hover:bg-dark-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            >
                              {copiedUrl === step.url ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-dark-400" />
                              )}
                            </button>
                            <a
                              href={step.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-dark-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4 text-dark-400" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Arrow between steps */}
                      {index < result.chain.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="w-5 h-5 text-dark-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Final URL */}
                {result.finalUrl && (
                  <div className="mt-6 pt-4 border-t border-dark-700">
                    <h3 className="text-sm font-medium text-dark-300 mb-2">Финальный URL:</h3>
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl group">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <code className="text-sm text-green-400 break-all flex-1">
                        {result.finalUrl}
                      </code>
                      <button
                        onClick={() => copyUrl(result.finalUrl)}
                        className="p-1.5 hover:bg-dark-600 rounded-lg transition-colors"
                      >
                        {copiedUrl === result.finalUrl ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            <div className="glass-card p-4 bg-dark-700/30">
              <h3 className="text-sm font-medium text-dark-200 mb-2">📊 Статус-коды:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-green-400 font-mono">200</span>
                  <span className="text-dark-400">OK</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-yellow-400 font-mono">301</span>
                  <span className="text-dark-400">Permanent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-yellow-400 font-mono">302</span>
                  <span className="text-dark-400">Temporary</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-red-400 font-mono">404</span>
                  <span className="text-dark-400">Not Found</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !isChecking && (
          <div className="glass-card p-12 text-center">
            <ArrowRight className="w-16 h-16 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300 mb-2">
              Введите URL для проверки
            </h3>
            <p className="text-dark-400 text-sm max-w-md mx-auto">
              Инструмент покажет всю цепочку редиректов, статус-коды и финальный URL.
              Полезно для проверки ссылок, клоаки и трекинга.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RedirectChecker;

