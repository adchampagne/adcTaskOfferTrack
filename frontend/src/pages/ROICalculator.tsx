import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  MousePointer,
  Target,
  Eye,
  RotateCcw,
  Copy,
  Check,
  Percent,
  Zap
} from 'lucide-react';

interface CalculatorInputs {
  spend: string;
  revenue: string;
  clicks: string;
  conversions: string;
  impressions: string;
}

interface CalculatedMetrics {
  profit: number;
  roi: number;
  ecpc: number;
  ecpm: number;
  cr: number;
  epc: number;
  cpa: number;
  revenuePerConversion: number;
}

function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    spend: '',
    revenue: '',
    clicks: '',
    conversions: '',
    impressions: '',
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const updateInput = (field: keyof CalculatorInputs, value: string) => {
    // Разрешаем только числа и точку
    const cleaned = value.replace(/[^\d.]/g, '');
    // Не больше одной точки
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setInputs(prev => ({ ...prev, [field]: formatted }));
  };

  const metrics = useMemo<CalculatedMetrics>(() => {
    const spend = parseFloat(inputs.spend) || 0;
    const revenue = parseFloat(inputs.revenue) || 0;
    const clicks = parseFloat(inputs.clicks) || 0;
    const conversions = parseFloat(inputs.conversions) || 0;
    const impressions = parseFloat(inputs.impressions) || 0;

    const profit = revenue - spend;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    const ecpc = clicks > 0 ? spend / clicks : 0;
    const ecpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const epc = clicks > 0 ? revenue / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const revenuePerConversion = conversions > 0 ? revenue / conversions : 0;

    return { profit, roi, ecpc, ecpm, cr, epc, cpa, revenuePerConversion };
  }, [inputs]);

  const resetAll = () => {
    setInputs({
      spend: '',
      revenue: '',
      clicks: '',
      conversions: '',
      impressions: '',
    });
  };

  const copyValue = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (isNaN(num) || !isFinite(num)) return '—';
    return num.toLocaleString('ru-RU', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatCurrency = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '—';
    return '$' + num.toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercent = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '—';
    return num.toLocaleString('ru-RU', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + '%';
  };

  const hasData = Object.values(inputs).some(v => v !== '');

  const metricCards = [
    {
      key: 'roi',
      label: 'ROI',
      value: formatPercent(metrics.roi),
      rawValue: metrics.roi.toFixed(2),
      icon: metrics.roi >= 0 ? TrendingUp : TrendingDown,
      color: metrics.roi > 0 ? 'text-green-400' : metrics.roi < 0 ? 'text-red-400' : 'text-dark-300',
      bgColor: metrics.roi > 0 ? 'bg-green-500/10' : metrics.roi < 0 ? 'bg-red-500/10' : 'bg-dark-700/50',
      description: 'Return on Investment',
      formula: '(Доход - Расход) / Расход × 100',
    },
    {
      key: 'profit',
      label: 'Профит',
      value: formatCurrency(metrics.profit),
      rawValue: metrics.profit.toFixed(2),
      icon: DollarSign,
      color: metrics.profit > 0 ? 'text-green-400' : metrics.profit < 0 ? 'text-red-400' : 'text-dark-300',
      bgColor: metrics.profit > 0 ? 'bg-green-500/10' : metrics.profit < 0 ? 'bg-red-500/10' : 'bg-dark-700/50',
      description: 'Чистая прибыль',
      formula: 'Доход - Расход',
    },
    {
      key: 'cr',
      label: 'CR',
      value: formatPercent(metrics.cr),
      rawValue: metrics.cr.toFixed(2),
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: 'Conversion Rate',
      formula: 'Конверсии / Клики × 100',
    },
    {
      key: 'epc',
      label: 'EPC',
      value: formatCurrency(metrics.epc),
      rawValue: metrics.epc.toFixed(4),
      icon: Zap,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      description: 'Earnings Per Click',
      formula: 'Доход / Клики',
    },
    {
      key: 'cpa',
      label: 'CPA',
      value: formatCurrency(metrics.cpa),
      rawValue: metrics.cpa.toFixed(2),
      icon: Target,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      description: 'Cost Per Action',
      formula: 'Расход / Конверсии',
    },
    {
      key: 'ecpc',
      label: 'eCPC',
      value: formatCurrency(metrics.ecpc),
      rawValue: metrics.ecpc.toFixed(4),
      icon: MousePointer,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      description: 'Effective Cost Per Click',
      formula: 'Расход / Клики',
    },
    {
      key: 'ecpm',
      label: 'eCPM',
      value: formatCurrency(metrics.ecpm),
      rawValue: metrics.ecpm.toFixed(2),
      icon: Eye,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      description: 'Effective Cost Per Mille',
      formula: '(Расход / Показы) × 1000',
    },
    {
      key: 'rpc',
      label: 'Доход/конв.',
      value: formatCurrency(metrics.revenuePerConversion),
      rawValue: metrics.revenuePerConversion.toFixed(2),
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      description: 'Средний доход с конверсии',
      formula: 'Доход / Конверсии',
    },
  ];

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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Калькулятор ROI</h1>
            <p className="text-sm text-dark-400">Расчёт ROI, профита, CR, EPC, CPA и других метрик</p>
          </div>
        </div>

        {hasData && (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-0">
              <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-400" />
                Входные данные
              </h2>

              <div className="space-y-4">
                {/* Spend */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Расход (Spend)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputs.spend}
                      onChange={(e) => updateInput('spend', e.target.value)}
                      placeholder="0.00"
                      className="glass-input pl-8 w-full text-lg font-medium"
                    />
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Доход (Revenue)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputs.revenue}
                      onChange={(e) => updateInput('revenue', e.target.value)}
                      placeholder="0.00"
                      className="glass-input pl-8 w-full text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="border-t border-dark-700 my-4" />

                {/* Clicks */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Клики
                  </label>
                  <div className="relative">
                    <MousePointer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputs.clicks}
                      onChange={(e) => updateInput('clicks', e.target.value)}
                      placeholder="0"
                      className="glass-input pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Conversions */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Конверсии (лиды/продажи)
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputs.conversions}
                      onChange={(e) => updateInput('conversions', e.target.value)}
                      placeholder="0"
                      className="glass-input pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Impressions */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Показы (опционально)
                  </label>
                  <div className="relative">
                    <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={inputs.impressions}
                      onChange={(e) => updateInput('impressions', e.target.value)}
                      placeholder="0"
                      className="glass-input pl-10 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              {hasData && (
                <div className="mt-6 pt-4 border-t border-dark-700">
                  <div className={`text-center p-4 rounded-xl ${metrics.roi > 0 ? 'bg-green-500/10' : metrics.roi < 0 ? 'bg-red-500/10' : 'bg-dark-700/50'}`}>
                    <div className="text-sm text-dark-400 mb-1">ROI</div>
                    <div className={`text-3xl font-bold ${metrics.roi > 0 ? 'text-green-400' : metrics.roi < 0 ? 'text-red-400' : 'text-dark-300'}`}>
                      {formatPercent(metrics.roi)}
                    </div>
                    <div className={`text-sm mt-1 ${metrics.profit > 0 ? 'text-green-400' : metrics.profit < 0 ? 'text-red-400' : 'text-dark-400'}`}>
                      Профит: {formatCurrency(metrics.profit)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.key}
                    className={`glass-card p-5 ${metric.bgColor} border-opacity-50 group hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${metric.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${metric.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark-100">{metric.label}</h3>
                          <p className="text-xs text-dark-400">{metric.description}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => copyValue(metric.rawValue, metric.key)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Копировать"
                      >
                        {copiedField === metric.key ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </div>

                    <div className={`text-2xl font-bold ${metric.color} mb-2`}>
                      {metric.value}
                    </div>

                    <div className="text-xs text-dark-500 font-mono bg-dark-800/50 rounded px-2 py-1 inline-block">
                      {metric.formula}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakeven Calculator */}
            {hasData && parseFloat(inputs.spend) > 0 && parseFloat(inputs.conversions) > 0 && (
              <div className="glass-card p-6 mt-4">
                <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary-400" />
                  Точка безубыточности
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-dark-700/50 rounded-xl p-4">
                    <div className="text-sm text-dark-400 mb-1">Минимальная выплата для ROI 0%</div>
                    <div className="text-xl font-bold text-dark-100">
                      {formatCurrency(metrics.cpa)}
                    </div>
                    <div className="text-xs text-dark-500 mt-1">за конверсию</div>
                  </div>
                  
                  <div className="bg-dark-700/50 rounded-xl p-4">
                    <div className="text-sm text-dark-400 mb-1">Нужно конверсий для ROI 100%</div>
                    <div className="text-xl font-bold text-dark-100">
                      {parseFloat(inputs.revenue) > 0 
                        ? formatNumber((parseFloat(inputs.spend) * 2) / (parseFloat(inputs.revenue) / parseFloat(inputs.conversions)), 0)
                        : '—'
                      }
                    </div>
                    <div className="text-xs text-dark-500 mt-1">при текущей выплате</div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasData && (
              <div className="glass-card p-12 text-center">
                <Calculator className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-dark-300 mb-2">
                  Введите данные для расчёта
                </h3>
                <p className="text-dark-400 text-sm">
                  Заполните поля слева, чтобы увидеть все метрики
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ROICalculator;

