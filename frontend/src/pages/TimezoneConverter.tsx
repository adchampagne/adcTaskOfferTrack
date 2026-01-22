import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Globe,
  Plus,
  X,
  Copy,
  Check,
  RotateCcw,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TimezoneOption {
  id: string;
  name: string;
  offset: string;
  zone: string;
  flag: string;
}

const POPULAR_TIMEZONES: TimezoneOption[] = [
  { id: 'moscow', name: 'Москва', offset: 'UTC+3', zone: 'Europe/Moscow', flag: '🇷🇺' },
  { id: 'kyiv', name: 'Киев', offset: 'UTC+2', zone: 'Europe/Kiev', flag: '🇺🇦' },
  { id: 'london', name: 'Лондон', offset: 'UTC+0', zone: 'Europe/London', flag: '🇬🇧' },
  { id: 'berlin', name: 'Берлин', offset: 'UTC+1', zone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: 'paris', name: 'Париж', offset: 'UTC+1', zone: 'Europe/Paris', flag: '🇫🇷' },
  { id: 'new_york', name: 'Нью-Йорк', offset: 'UTC-5', zone: 'America/New_York', flag: '🇺🇸' },
  { id: 'los_angeles', name: 'Лос-Анджелес', offset: 'UTC-8', zone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'chicago', name: 'Чикаго', offset: 'UTC-6', zone: 'America/Chicago', flag: '🇺🇸' },
  { id: 'toronto', name: 'Торонто', offset: 'UTC-5', zone: 'America/Toronto', flag: '🇨🇦' },
  { id: 'sao_paulo', name: 'Сан-Паулу', offset: 'UTC-3', zone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { id: 'mexico', name: 'Мехико', offset: 'UTC-6', zone: 'America/Mexico_City', flag: '🇲🇽' },
  { id: 'tokyo', name: 'Токио', offset: 'UTC+9', zone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'singapore', name: 'Сингапур', offset: 'UTC+8', zone: 'Asia/Singapore', flag: '🇸🇬' },
  { id: 'hong_kong', name: 'Гонконг', offset: 'UTC+8', zone: 'Asia/Hong_Kong', flag: '🇭🇰' },
  { id: 'dubai', name: 'Дубай', offset: 'UTC+4', zone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'istanbul', name: 'Стамбул', offset: 'UTC+3', zone: 'Europe/Istanbul', flag: '🇹🇷' },
  { id: 'sydney', name: 'Сидней', offset: 'UTC+11', zone: 'Australia/Sydney', flag: '🇦🇺' },
  { id: 'auckland', name: 'Окленд', offset: 'UTC+13', zone: 'Pacific/Auckland', flag: '🇳🇿' },
  { id: 'delhi', name: 'Дели', offset: 'UTC+5:30', zone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: 'bangkok', name: 'Бангкок', offset: 'UTC+7', zone: 'Asia/Bangkok', flag: '🇹🇭' },
  { id: 'jakarta', name: 'Джакарта', offset: 'UTC+7', zone: 'Asia/Jakarta', flag: '🇮🇩' },
  { id: 'manila', name: 'Манила', offset: 'UTC+8', zone: 'Asia/Manila', flag: '🇵🇭' },
  { id: 'cairo', name: 'Каир', offset: 'UTC+2', zone: 'Africa/Cairo', flag: '🇪🇬' },
  { id: 'johannesburg', name: 'Йоханнесбург', offset: 'UTC+2', zone: 'Africa/Johannesburg', flag: '🇿🇦' },
];

interface SelectedTimezone {
  id: string;
  timezone: TimezoneOption;
}

function TimezoneConverter() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sourceTime, setSourceTime] = useState('');
  const [sourceDate, setSourceDate] = useState('');
  const [sourceTimezone, setSourceTimezone] = useState<TimezoneOption>(POPULAR_TIMEZONES[0]);
  const [selectedTimezones, setSelectedTimezones] = useState<SelectedTimezone[]>([
    { id: crypto.randomUUID(), timezone: POPULAR_TIMEZONES[5] }, // New York
    { id: crypto.randomUUID(), timezone: POPULAR_TIMEZONES[6] }, // LA
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Обновляем текущее время каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Инициализация текущего времени
  useEffect(() => {
    const now = new Date();
    setSourceTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setSourceDate(now.toISOString().split('T')[0]);
  }, []);

  const formatTimeInZone = (date: Date, zone: string) => {
    try {
      return date.toLocaleTimeString('ru-RU', { 
        timeZone: zone, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '--:--';
    }
  };

  const formatDateInZone = (date: Date, zone: string) => {
    try {
      return date.toLocaleDateString('ru-RU', { 
        timeZone: zone, 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '--';
    }
  };

  const getTimeOfDay = (date: Date, zone: string) => {
    try {
      const hour = parseInt(date.toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', hour12: false }));
      if (hour >= 6 && hour < 12) return { label: 'Утро', emoji: '🌅', color: 'text-yellow-400' };
      if (hour >= 12 && hour < 18) return { label: 'День', emoji: '☀️', color: 'text-orange-400' };
      if (hour >= 18 && hour < 22) return { label: 'Вечер', emoji: '🌆', color: 'text-purple-400' };
      return { label: 'Ночь', emoji: '🌙', color: 'text-blue-400' };
    } catch {
      return { label: '', emoji: '', color: '' };
    }
  };

  // Рассчитываем время для выбранных зон
  const convertedTimes = useMemo(() => {
    if (!sourceTime || !sourceDate) return [];

    try {
      // Создаём дату в исходном часовом поясе
      const sourceDateTime = new Date(
        `${sourceDate}T${sourceTime.padStart(5, '0')}:00`
      );

      // Конвертируем для каждого выбранного часового пояса
      return selectedTimezones.map(({ id, timezone }) => {
        const time = formatTimeInZone(sourceDateTime, timezone.zone);
        const date = formatDateInZone(sourceDateTime, timezone.zone);
        const timeOfDay = getTimeOfDay(sourceDateTime, timezone.zone);
        
        return {
          id,
          timezone,
          time,
          date,
          timeOfDay,
        };
      });
    } catch {
      return [];
    }
  }, [sourceTime, sourceDate, sourceTimezone, selectedTimezones]);

  const addTimezone = (tz: TimezoneOption) => {
    if (selectedTimezones.some(s => s.timezone.id === tz.id)) {
      toast.error('Этот часовой пояс уже добавлен');
      return;
    }
    setSelectedTimezones(prev => [...prev, { id: crypto.randomUUID(), timezone: tz }]);
    setShowAddMenu(false);
  };

  const removeTimezone = (id: string) => {
    setSelectedTimezones(prev => prev.filter(s => s.id !== id));
  };

  const copyTime = (time: string, name: string) => {
    navigator.clipboard.writeText(time);
    setCopiedId(name);
    toast.success(`Время ${name} скопировано`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const resetToNow = () => {
    const now = new Date();
    setSourceTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setSourceDate(now.toISOString().split('T')[0]);
  };

  const availableTimezones = POPULAR_TIMEZONES.filter(
    tz => !selectedTimezones.some(s => s.timezone.id === tz.id) && tz.id !== sourceTimezone.id
  );

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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Часовые пояса</h1>
            <p className="text-sm text-dark-400">Конвертация времени между часовыми поясами</p>
          </div>
        </div>

        <button
          onClick={resetToNow}
          className="btn-secondary flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Сейчас
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Source Time */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-0">
              <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                Исходное время
              </h2>

              {/* Current Time Display */}
              <div className="bg-dark-800 rounded-xl p-4 mb-4 text-center">
                <div className="text-3xl font-bold text-dark-100 font-mono">
                  {formatTimeInZone(currentTime, sourceTimezone.zone)}
                </div>
                <div className="text-sm text-dark-400 mt-1">
                  {formatDateInZone(currentTime, sourceTimezone.zone)}
                </div>
                <div className="text-xs text-dark-500 mt-1">
                  Сейчас в {sourceTimezone.name}
                </div>
              </div>

              {/* Source Timezone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Часовой пояс
                </label>
                <select
                  value={sourceTimezone.id}
                  onChange={(e) => {
                    const tz = POPULAR_TIMEZONES.find(t => t.id === e.target.value);
                    if (tz) setSourceTimezone(tz);
                  }}
                  className="glass-input w-full"
                >
                  {POPULAR_TIMEZONES.map(tz => (
                    <option key={tz.id} value={tz.id}>
                      {tz.flag} {tz.name} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Input */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Время
                  </label>
                  <input
                    type="time"
                    value={sourceTime}
                    onChange={(e) => setSourceTime(e.target.value)}
                    className="glass-input w-full text-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={sourceDate}
                    onChange={(e) => setSourceDate(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              {/* Quick Time Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['09:00', '12:00', '15:00', '18:00'].map(time => (
                  <button
                    key={time}
                    onClick={() => setSourceTime(time)}
                    className="py-2 bg-dark-700/50 hover:bg-dark-600 rounded-lg text-sm text-dark-300 transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Converted Times */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-100">
                Время в других поясах
              </h2>
              
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>

                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-dark-700 rounded-xl shadow-xl border border-dark-600 z-50 max-h-80 overflow-y-auto">
                    {availableTimezones.map(tz => (
                      <button
                        key={tz.id}
                        onClick={() => addTimezone(tz)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors text-left"
                      >
                        <span className="text-xl">{tz.flag}</span>
                        <div>
                          <p className="text-dark-100 font-medium">{tz.name}</p>
                          <p className="text-xs text-dark-400">{tz.offset}</p>
                        </div>
                      </button>
                    ))}
                    {availableTimezones.length === 0 && (
                      <p className="px-4 py-3 text-dark-400 text-sm">Все часовые пояса добавлены</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Timezone Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {convertedTimes.map(({ id, timezone, time, date, timeOfDay }) => (
                <div
                  key={id}
                  className="glass-card p-5 group hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{timezone.flag}</span>
                      <div>
                        <h3 className="font-semibold text-dark-100">{timezone.name}</h3>
                        <p className="text-xs text-dark-400">{timezone.offset}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyTime(time, timezone.name)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Копировать время"
                      >
                        {copiedId === timezone.name ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                      <button
                        onClick={() => removeTimezone(id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить"
                      >
                        <X className="w-4 h-4 text-dark-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-dark-100 font-mono">
                        {time}
                      </div>
                      <div className="text-sm text-dark-400 mt-1">
                        {date}
                      </div>
                    </div>
                    
                    <div className={`text-right ${timeOfDay.color}`}>
                      <span className="text-2xl">{timeOfDay.emoji}</span>
                      <p className="text-xs mt-1">{timeOfDay.label}</p>
                    </div>
                  </div>
                </div>
              ))}

              {selectedTimezones.length === 0 && (
                <div className="col-span-full glass-card p-12 text-center">
                  <MapPin className="w-12 h-12 text-dark-500 mx-auto mb-3" />
                  <p className="text-dark-400">Добавьте часовые пояса для сравнения</p>
                </div>
              )}
            </div>

            {/* Tips */}
            {selectedTimezones.length > 0 && (
              <div className="glass-card p-4 mt-4 bg-dark-700/30">
                <h3 className="text-sm font-medium text-dark-200 mb-2">💡 Лучшее время для рекламы:</h3>
                <ul className="text-sm text-dark-400 space-y-1">
                  <li>• <b>US</b>: 9:00–21:00 по местному (избегай ночь)</li>
                  <li>• <b>EU</b>: 8:00–22:00 по местному</li>
                  <li>• <b>Будни vs выходные</b> — разные паттерны поведения</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimezoneConverter;

