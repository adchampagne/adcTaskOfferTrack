import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Zap, 
  Target, 
  Star,
  TrendingUp,
  Users,
  ChevronDown
} from 'lucide-react';
import { achievementsApi, departmentsApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { formatMoscow } from '../utils/dateUtils';
import { roleLabels } from '../types';

const categoryLabels: Record<string, { name: string; icon: typeof Trophy; color: string }> = {
  tasks: { name: '📋 Количество задач', icon: Target, color: 'text-blue-400' },
  quality: { name: '⭐ Качество работы', icon: Star, color: 'text-yellow-400' },
  speed: { name: '⚡ Скорость', icon: Zap, color: 'text-green-400' },
  streak: { name: '🔥 Стрик', icon: TrendingUp, color: 'text-orange-400' },
  special: { name: '🎯 Особые и редкие', icon: Crown, color: 'text-purple-400' },
};

type Tab = 'achievements' | 'leaderboard';
type Period = 'week' | 'month' | 'all';

export default function Achievements() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('achievements');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [period, setPeriod] = useState<Period>('month');

  const { data: achievementsData, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.getAll,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', selectedDepartment, period],
    queryFn: () => achievementsApi.getLeaderboard(selectedDepartment, period),
    enabled: activeTab === 'leaderboard' && !!selectedDepartment,
  });

  // Автовыбор отдела при первой загрузке
  if (departments.length > 0 && !selectedDepartment) {
    setSelectedDepartment(departments[0].code);
  }

  const earnedCount = achievementsData?.earned || 0;
  const totalCount = achievementsData?.total || 0;
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4 animate-slide-down flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-100 flex items-center gap-2 sm:gap-3">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            Достижения
          </h1>
          <p className="text-dark-400 mt-1 text-sm hidden sm:block">
            Ваши награды и рейтинг в команде
          </p>
        </div>

        {/* Progress */}
        <div className="glass-card px-4 py-3 flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{earnedCount}</p>
            <p className="text-xs text-dark-400">из {totalCount}</p>
          </div>
          <div className="w-32">
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-dark-400 mt-1 text-center">{Math.round(progress)}% собрано</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-dark-800 text-dark-400 hover:text-dark-200 border border-dark-700'
          }`}
        >
          <Medal className="w-4 h-4" />
          Мои достижения
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-dark-800 text-dark-400 hover:text-dark-200 border border-dark-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Лидерборд
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {achievementsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="skeleton h-6 w-32 rounded mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="skeleton h-24 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              Object.entries(achievementsData?.achievements || {}).map(([category, achievements]) => {
                const categoryInfo = categoryLabels[category] || { 
                  name: category, 
                  icon: Trophy, 
                  color: 'text-dark-400' 
                };
                const CategoryIcon = categoryInfo.icon;

                return (
                  <div key={category} className="glass-card p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CategoryIcon className={`w-5 h-5 ${categoryInfo.color}`} />
                      <h2 className="text-lg font-bold text-dark-100">{categoryInfo.name}</h2>
                      <span className="text-sm text-dark-400">
                        ({achievements.filter(a => a.earned).length}/{achievements.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`relative p-4 rounded-xl border transition-all ${
                            achievement.earned
                              ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                              : 'bg-dark-800/50 border-dark-700 opacity-60'
                          }`}
                        >
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <h3 className={`font-semibold text-sm ${
                            achievement.earned ? 'text-dark-100' : 'text-dark-400'
                          }`}>
                            {achievement.name}
                          </h3>
                          <p className="text-xs text-dark-400 mt-1">
                            {achievement.description}
                          </p>
                          {achievement.earned && achievement.earned_at && (
                            <p className="text-xs text-yellow-400/70 mt-2">
                              {formatMoscow(new Date(achievement.earned_at), 'd MMM yyyy')}
                            </p>
                          )}
                          {achievement.earned && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="glass-input py-2 px-4 pr-10 text-sm appearance-none cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.code}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-dark-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex rounded-lg overflow-hidden border border-dark-700">
                {[
                  { value: 'week' as Period, label: 'Неделя' },
                  { value: 'month' as Period, label: 'Месяц' },
                  { value: 'all' as Period, label: 'Всё время' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      period === p.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-dark-800 text-dark-400 hover:text-dark-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            {leaderboardLoading ? (
              <div className="glass-card p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-dark-700 last:border-0">
                    <div className="skeleton w-8 h-8 rounded-full" />
                    <div className="skeleton h-5 w-32 rounded" />
                    <div className="skeleton h-4 w-20 rounded ml-auto" />
                  </div>
                ))}
              </div>
            ) : leaderboardData?.leaderboard.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">В отделе пока нет сотрудников с выполненными задачами</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-800/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-dark-400 w-16">#</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Сотрудник</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">Задач</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">🔥 Топ</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">⚡ Досрочно</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">🏆</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData?.leaderboard.map((u, index) => (
                      <tr 
                        key={u.id}
                        className={`border-b border-dark-700/50 last:border-0 transition-colors ${
                          u.id === user?.id ? 'bg-primary-500/10' : 'hover:bg-dark-800/30'
                        }`}
                      >
                        <td className="py-4 px-4">
                          {index === 0 ? (
                            <span className="text-2xl">🥇</span>
                          ) : index === 1 ? (
                            <span className="text-2xl">🥈</span>
                          ) : index === 2 ? (
                            <span className="text-2xl">🥉</span>
                          ) : (
                            <span className="text-dark-400 font-medium">{u.rank}</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className={`font-medium ${u.id === user?.id ? 'text-primary-400' : 'text-dark-100'}`}>
                              {u.full_name}
                              {u.id === user?.id && <span className="text-xs ml-2">(вы)</span>}
                            </p>
                            <p className="text-xs text-dark-400">{roleLabels[u.role as keyof typeof roleLabels] || u.role}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-dark-100">{u.completed_tasks}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`font-medium ${u.top_rated > 0 ? 'text-yellow-400' : 'text-dark-500'}`}>
                            {u.top_rated}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`font-medium ${u.early_completed > 0 ? 'text-green-400' : 'text-dark-500'}`}>
                            {u.early_completed}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-dark-300">{u.achievements_count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

