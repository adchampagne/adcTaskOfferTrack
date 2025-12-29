import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  Activity,
  Users,
  Layers
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { analyticsApi, TasksByWeek, AvgCompletionTime, TopExecutor, DepartmentStats } from '../api';
import { taskTypeLabels, departmentLabels, Department } from '../types';

// Цвета для графиков
const COLORS = {
  primary: '#a855f7',
  secondary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  gradient: ['#a855f7', '#ec4899'],
};

const CHART_COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  trend,
  gradient 
}: { 
  icon: typeof BarChart3; 
  label: string; 
  value: number | string; 
  subValue?: string;
  trend?: number;
  gradient: string;
}) {
  return (
    <div className="glass-card p-4 sm:p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 
              ? 'bg-green-500/10 text-green-400' 
              : trend < 0 
                ? 'bg-red-500/10 text-red-400'
                : 'bg-dark-700 text-dark-400'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl sm:text-3xl font-bold text-dark-100">{value}</p>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
        {subValue && <p className="text-xs text-dark-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function WeeklyChart({ data }: { data: TasksByWeek[] }) {
  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-400" />
        Выполнено задач по неделям
      </h3>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#a855f7' }}
              formatter={(value) => [value, 'Задач']}
              labelFormatter={(label) => `Неделя ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AvgTimeChart({ data }: { data: AvgCompletionTime[] }) {
  const chartData = data.map(item => ({
    ...item,
    name: taskTypeLabels[item.task_type as keyof typeof taskTypeLabels] || item.task_type,
    shortName: (taskTypeLabels[item.task_type as keyof typeof taskTypeLabels] || item.task_type).slice(0, 15)
  }));

  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-400" />
        Среднее время выполнения по типам
      </h3>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={(value) => `${value}ч`}
            />
            <YAxis 
              type="category"
              dataKey="shortName"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}
              labelStyle={{ color: '#f3f4f6' }}
              formatter={(value, _name, props) => {
                const payload = props?.payload as AvgCompletionTime & { name: string };
                return [`${value} ч (${payload?.avg_days || 0} дн.)`, 'Среднее время'];
              }}
              labelFormatter={(_label, payload) => payload[0]?.payload?.name || ''}
            />
            <Bar dataKey="avg_hours" radius={[0, 4, 4, 0]}>
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Легенда с количеством задач */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {chartData.map((item, index) => (
          <div key={item.task_type} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="text-dark-400 truncate">{item.name}</span>
            <span className="text-dark-500">({item.total_tasks})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopExecutorsTable({ data }: { data: TopExecutor[] }) {
  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-green-400" />
        Топ исполнителей за месяц
      </h3>
      
      {data.length === 0 ? (
        <p className="text-dark-400 text-center py-8">Нет данных</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-2 text-sm font-medium text-dark-400">#</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-dark-400">Сотрудник</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-dark-400">Задач</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-dark-400">Ср. время</th>
              </tr>
            </thead>
            <tbody>
              {data.map((executor, index) => (
                <tr key={executor.id} className="border-b border-dark-700/50 hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-dark-700 text-dark-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        {executor.full_name.charAt(0)}
                      </div>
                      <span className="text-dark-100 font-medium">{executor.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                      {executor.tasks_completed}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-dark-300 text-sm">
                      {executor.avg_hours}ч
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DepartmentPieChart({ data }: { data: DepartmentStats[] }) {
  const chartData = data.map(item => ({
    ...item,
    name: departmentLabels[item.department as Department] || item.department,
    value: item.completed_month
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass-card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-purple-400" />
        Задачи по отделам (за месяц)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}
              formatter={(value) => [value, 'Выполнено']}
            />
            <Legend 
              formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <p className="text-2xl font-bold text-dark-100">{total}</p>
        <p className="text-sm text-dark-400">всего задач</p>
      </div>
    </div>
  );
}

function Analytics() {
  // Проверка доступа
  const { data: accessCheck, isLoading: accessLoading } = useQuery({
    queryKey: ['analytics-access'],
    queryFn: analyticsApi.checkAccess,
  });

  // Загрузка данных
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: analyticsApi.getSummary,
    enabled: accessCheck?.hasAccess,
  });

  const { data: weeklyData = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['analytics-weekly'],
    queryFn: analyticsApi.getTasksByWeek,
    enabled: accessCheck?.hasAccess,
  });

  const { data: avgTimeData = [], isLoading: avgTimeLoading } = useQuery({
    queryKey: ['analytics-avg-time'],
    queryFn: analyticsApi.getAvgCompletionTime,
    enabled: accessCheck?.hasAccess,
  });

  const { data: topExecutors = [] } = useQuery({
    queryKey: ['analytics-top-executors'],
    queryFn: analyticsApi.getTopExecutors,
    enabled: accessCheck?.hasAccess,
  });

  const { data: departmentStats = [] } = useQuery({
    queryKey: ['analytics-departments'],
    queryFn: analyticsApi.getByDepartment,
    enabled: accessCheck?.hasAccess && !summary?.departmentCode, // Только для админов/биздевов
  });

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!accessCheck?.hasAccess) {
    return <Navigate to="/" />;
  }

  const isLoading = summaryLoading || weeklyLoading || avgTimeLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-pink-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Аналитика</h1>
            <p className="text-dark-400">
              {summary?.departmentCode 
                ? `Статистика отдела: ${departmentLabels[summary.departmentCode as Department] || summary.departmentCode}`
                : 'Общая статистика по всем отделам'
              }
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton h-12 w-12 rounded-xl mb-4" />
              <div className="skeleton h-8 w-20 rounded mb-2" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CheckCircle}
              label="Выполнено за неделю"
              value={summary?.tasksThisWeek || 0}
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Выполнено за месяц"
              value={summary?.tasksThisMonth || 0}
              trend={summary?.monthChange}
              subValue="vs прошлый месяц"
              gradient="bg-gradient-to-br from-primary-500 to-pink-600"
            />
            <StatCard
              icon={Activity}
              label="Активных задач"
              value={summary?.activeTasks || 0}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <StatCard
              icon={BarChart3}
              label="Всего выполнено"
              value={summary?.totalCompleted || 0}
              subValue="за всё время"
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyChart data={weeklyData} />
            <AvgTimeChart data={avgTimeData} />
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopExecutorsTable data={topExecutors} />
            {departmentStats.length > 0 && (
              <DepartmentPieChart data={departmentStats} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;

