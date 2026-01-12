import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Send, 
  Key, 
  Palette,
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Image,
  Upload,
  Trash2,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  ChevronRight,
  User,
  Calendar,
  Building2,
  AtSign,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { telegramApi, authApi } from '../api';
import { useSettingsStore, themes, backgroundOptions } from '../store/settingsStore';
import { roleLabels } from '../types';

type SettingsSection = 'profile' | 'telegram' | 'personalization' | null;

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);

  const settingItems = [
    {
      id: 'profile' as const,
      icon: User,
      title: 'Профиль',
      description: 'Ваши данные и пароль',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      hoverColor: 'hover:bg-emerald-500/20',
    },
    {
      id: 'telegram' as const,
      icon: Send,
      title: 'Telegram',
      description: 'Уведомления о задачах',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      hoverColor: 'hover:bg-blue-500/20',
    },
    {
      id: 'personalization' as const,
      icon: Palette,
      title: 'Персонализация',
      description: 'Настройте внешний вид',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      hoverColor: 'hover:bg-purple-500/20',
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Настройки</h1>
          <p className="text-dark-400 text-sm">Управление аккаунтом и персонализация</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Меню настроек */}
        <div className="lg:col-span-1 space-y-2">
          {settingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all border ${
                activeSection === item.id
                  ? `${item.bgColor} border-current ${item.color}`
                  : `border-dark-700 hover:border-dark-600 ${item.hoverColor}`
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${activeSection === item.id ? item.color : 'text-dark-200'}`}>
                  {item.title}
                </p>
                <p className="text-sm text-dark-400">{item.description}</p>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${
                activeSection === item.id ? 'rotate-90 text-current' : 'text-dark-500'
              }`} />
            </button>
          ))}
        </div>

        {/* Контент настроек */}
        <div className="lg:col-span-2">
          {activeSection === null && (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="w-8 h-8 text-dark-400" />
              </div>
              <p className="text-dark-400">Выберите раздел настроек слева</p>
            </div>
          )}

          {activeSection === 'profile' && <ProfileSection />}
          {activeSection === 'telegram' && <TelegramSection />}
          {activeSection === 'personalization' && <PersonalizationSection />}
        </div>
      </div>
    </div>
  );
}

// === Profile Section ===
function ProfileSection() {
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
  });

  const updateNameMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Обновляем localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.full_name = updatedUser.full_name;
        localStorage.setItem('user', JSON.stringify(user));
      }
      setIsEditingName(false);
    },
  });

  const startEditing = () => {
    setNewName(profile?.full_name || '');
    setIsEditingName(true);
  };

  const saveName = () => {
    if (newName.trim().length >= 2) {
      updateNameMutation.mutate(newName.trim());
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Информация о профиле */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-dark-700 mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark-100">Профиль</h3>
            <p className="text-dark-400 text-sm">Ваши данные в системе</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ФИО */}
          <div className="flex items-center justify-between py-3 border-b border-dark-700/50">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-dark-400" />
              <div>
                <p className="text-dark-400 text-sm">ФИО</p>
                {isEditingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-white text-sm focus:border-emerald-500 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={saveName}
                      disabled={updateNameMutation.isPending || newName.trim().length < 2}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updateNameMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-1.5 text-dark-400 hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-dark-100 font-medium">{profile?.full_name}</p>
                )}
              </div>
            </div>
            {!isEditingName && (
              <button
                onClick={startEditing}
                className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="Редактировать"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Логин */}
          <div className="flex items-center gap-3 py-3 border-b border-dark-700/50">
            <AtSign className="w-5 h-5 text-dark-400" />
            <div>
              <p className="text-dark-400 text-sm">Логин</p>
              <p className="text-dark-100 font-medium">{profile?.username}</p>
            </div>
          </div>

          {/* Роль */}
          <div className="flex items-center gap-3 py-3 border-b border-dark-700/50">
            <Building2 className="w-5 h-5 text-dark-400" />
            <div>
              <p className="text-dark-400 text-sm">Роль</p>
              <p className="text-dark-100 font-medium">
                {profile?.role ? roleLabels[profile.role] : '—'}
              </p>
            </div>
          </div>

          {/* Отдел */}
          {profile?.department && (
            <div className="flex items-center gap-3 py-3 border-b border-dark-700/50">
              <Building2 className="w-5 h-5 text-dark-400" />
              <div>
                <p className="text-dark-400 text-sm">Отдел</p>
                <p className="text-dark-100 font-medium">{profile.department.name}</p>
              </div>
            </div>
          )}

          {/* Telegram */}
          {profile?.telegram_username && (
            <div className="flex items-center gap-3 py-3 border-b border-dark-700/50">
              <Send className="w-5 h-5 text-dark-400" />
              <div>
                <p className="text-dark-400 text-sm">Telegram</p>
                <p className="text-blue-400 font-medium">@{profile.telegram_username}</p>
              </div>
            </div>
          )}

          {/* Дата регистрации */}
          <div className="flex items-center gap-3 py-3">
            <Calendar className="w-5 h-5 text-dark-400" />
            <div>
              <p className="text-dark-400 text-sm">В системе с</p>
              <p className="text-dark-100 font-medium">
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Смена пароля */}
      <div className="glass-card p-6">
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-400" />
            </div>
            <div className="text-left">
              <h3 className="text-dark-100 font-medium">Сменить пароль</h3>
              <p className="text-dark-400 text-sm">Обновите свой пароль</p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-dark-400 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
        </button>

        {showPasswordForm && (
          <div className="mt-6 pt-6 border-t border-dark-700">
            <PasswordForm />
          </div>
        )}
      </div>
    </div>
  );
}

// === Password Form (внутри профиля) ===
function PasswordForm() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Ошибка при смене пароля');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Заполните все поля');
      return;
    }

    if (newPassword.length < 4) {
      setError('Новый пароль должен быть не менее 4 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Новый пароль должен отличаться от старого');
      return;
    }

    changePasswordMutation.mutate();
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-green-400 font-semibold">Пароль изменён!</p>
          <p className="text-dark-400 text-sm">Используйте новый пароль при следующем входе</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Текущий пароль
        </label>
        <div className="relative">
          <input
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-4 py-2.5 pr-12 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 outline-none transition-colors"
            placeholder="Введите текущий пароль"
          />
          <button
            type="button"
            onClick={() => setShowOldPassword(!showOldPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
          >
            {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Новый пароль
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 pr-12 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 outline-none transition-colors"
            placeholder="Минимум 4 символа"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
          >
            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Подтвердите новый пароль
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:border-primary-500 outline-none transition-colors"
          placeholder="Повторите новый пароль"
        />
      </div>

      <button
        type="submit"
        disabled={changePasswordMutation.isPending}
        className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {changePasswordMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Key className="w-4 h-4" />
            Изменить пароль
          </>
        )}
      </button>
    </form>
  );
}

// === Telegram Section ===
function TelegramSection() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['telegram-link'],
    queryFn: telegramApi.getLink,
  });

  const unlinkMutation = useMutation({
    mutationFn: telegramApi.unlink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-link'] });
      refetch();
    },
  });

  const testMutation = useMutation({
    mutationFn: telegramApi.sendTest,
  });

  const copyCode = async () => {
    if (data?.code) {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-dark-700">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-dark-100">Telegram</h3>
          <p className="text-dark-400 text-sm">Уведомления о задачах</p>
        </div>
      </div>

      {data?.linked ? (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 font-semibold">Telegram подключён</p>
                {data.telegram_username && (
                  <p className="text-dark-400 text-sm">@{data.telegram_username}</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-dark-300 text-sm">
            Вы будете получать уведомления о новых задачах, изменениях статуса и приближающихся дедлайнах.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Отправить тестовое уведомление'
              )}
            </button>

            {testMutation.isSuccess && (
              <p className="text-green-400 text-sm text-center">✓ Уведомление отправлено!</p>
            )}

            <button
              onClick={() => {
                if (confirm('Отвязать Telegram? Вы перестанете получать уведомления.')) {
                  unlinkMutation.mutate();
                }
              }}
              disabled={unlinkMutation.isPending}
              className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-xl font-medium transition-colors"
            >
              Отвязать Telegram
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 font-semibold">Telegram не подключён</p>
                <p className="text-dark-400 text-sm">Привяжите для получения уведомлений</p>
              </div>
            </div>
          </div>

          {data?.code && (
            <div className="bg-dark-900 rounded-xl p-6 text-center">
              <p className="text-dark-400 text-sm mb-3">Ваш код привязки:</p>
              <div 
                onClick={copyCode}
                className="text-3xl sm:text-4xl font-mono font-bold text-blue-400 tracking-[0.2em] sm:tracking-[0.3em] cursor-pointer hover:text-blue-300 transition-colors select-all"
              >
                {data.code}
              </div>
              <button
                onClick={copyCode}
                className="mt-3 text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
              >
                {copied ? (
                  <span className="text-green-400">✓ Скопировано!</span>
                ) : (
                  'Нажмите, чтобы скопировать'
                )}
              </button>
              <p className="text-dark-500 text-xs mt-3">Код действителен 10 минут</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-dark-200 font-medium">Как подключить:</h4>
            <ol className="text-dark-300 text-sm space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">1</span>
                <span>Откройте бота <a href="https://t.me/adcTasksBot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@adcTasksBot</a> в Telegram</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">2</span>
                <span>Скопируйте код выше и отправьте его боту</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">3</span>
                <span>Готово! Уведомления будут приходить в этот чат</span>
              </li>
            </ol>
          </div>

          <div className="flex gap-3">
            <a
              href="https://t.me/adcTasksBot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Открыть бота
            </a>
            <button
              onClick={() => refetch()}
              className="py-3 px-4 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-xl font-medium transition-colors"
              title="Обновить статус"
            >
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// === Personalization Section ===
function PersonalizationSection() {
  const {
    themeId,
    backgroundId,
    customBackground,
    backgroundBlur,
    backgroundOpacity,
    isSaving,
    setTheme,
    setBackground,
    setCustomBackground,
    setBackgroundBlur,
    setBackgroundOpacity,
    resetToDefaults,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'background'>('theme');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB');
      return;
    }

    try {
      setIsUploading(true);
      const result = await authApi.uploadBackground(file);
      setCustomBackground(result.backgroundUrl);
    } catch (error) {
      console.error('Failed to upload background:', error);
      alert('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlInput = () => {
    const url = prompt('Введите URL изображения:');
    if (url && url.trim()) {
      setCustomBackground(url.trim());
    }
  };

  const handleDeleteBackground = async () => {
    try {
      if (customBackground?.startsWith('/api/auth/background/')) {
        await authApi.deleteBackground();
      }
      setCustomBackground(null);
    } catch (error) {
      console.error('Failed to delete background:', error);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-dark-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-dark-100">Персонализация</h3>
          <p className="text-dark-400 text-sm">Настройте внешний вид под себя</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-700">
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-medium transition-colors ${
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
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-medium transition-colors ${
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
      <div className="pt-2">
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
                  disabled={isUploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    'Загрузить файл'
                  )}
                </button>
                <button
                  onClick={handleUrlInput}
                  disabled={isUploading}
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
                    onClick={handleDeleteBackground}
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
      <div className="pt-4 border-t border-dark-700 flex items-center justify-between">
        <button
          onClick={async () => {
            if (confirm('Сбросить все настройки на стандартные?')) {
              if (customBackground?.startsWith('/api/auth/background/')) {
                try {
                  await authApi.deleteBackground();
                } catch (e) {
                  console.error('Failed to delete background:', e);
                }
              }
              resetToDefaults(true);
            }
          }}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Сбросить
        </button>
        {(isSaving || isUploading) && (
          <span className="text-sm text-dark-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Сохранение...
          </span>
        )}
      </div>
    </div>
  );
}

