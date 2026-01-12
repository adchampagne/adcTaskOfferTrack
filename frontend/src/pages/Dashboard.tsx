import { useQuery } from '@tanstack/react-query';
import { Building2, Package, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { partnersApi, offersApi, tasksApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { taskStatusLabels, taskTypeLabels, Task } from '../types';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient 
}: { 
  icon: typeof Building2; 
  label: string; 
  value: number | string; 
  gradient: string;
}) {
  return (
    <div className="glass-card p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-bold text-dark-100">{value}</p>
          <p className="text-xs sm:text-sm text-dark-400 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed';
  const isDueToday = isToday(new Date(task.deadline));

  return (
    <div 
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
        isOverdue 
          ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
          : isDueToday 
            ? 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10'
            : 'bg-dark-800/50 border-dark-700/50 hover:bg-dark-700/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-dark-100 truncate text-sm sm:text-base">{task.title}</h4>
          <p className="text-xs sm:text-sm text-dark-400 mt-1">
            {taskTypeLabels[task.task_type]}
          </p>
          <p className="text-xs text-dark-500 mt-1 sm:mt-2 truncate">
            <span className="hidden sm:inline">Исполнитель: </span>{task.executor_name?.split(' ')[0]}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`status-badge status-${task.status} text-[10px] sm:text-xs`}>
            {taskStatusLabels[task.status]}
          </span>
          <p className={`text-xs mt-1 sm:mt-2 ${isOverdue ? 'text-red-400' : 'text-dark-400'}`}>
            {isOverdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
            {format(new Date(task.deadline), 'd MMM', { locale: ru })}
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: partnersApi.getAll,
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => offersApi.getAll(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  });

  const myTasks = tasks.filter(
    (t) => t.executor_id === user?.id || t.customer_id === user?.id
  );
  const pendingTasks = myTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = pendingTasks.filter((t) => isPast(new Date(t.deadline)));

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-xl sm:text-3xl font-bold text-dark-100">
          Привет, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-dark-400 mt-1 sm:mt-2 text-sm sm:text-base">
          Вот краткая сводка по вашей работе
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Building2}
          label="Партнёрок"
          value={partners.length}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Package}
          label="Офферов"
          value={offers.length}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={CheckSquare}
          label="Активных задач"
          value={pendingTasks.length}
          gradient="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          icon={Clock}
          label="Просрочено"
          value={overdueTasks.length}
          gradient={overdueTasks.length > 0 
            ? "bg-gradient-to-br from-red-500 to-red-600" 
            : "bg-gradient-to-br from-gray-500 to-gray-600"
          }
        />
      </div>

      {/* Tasks section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* My pending tasks */}
        <div className="glass-card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
            <span className="hidden sm:inline">Мои активные задачи</span>
            <span className="sm:hidden">Активные</span>
          </h3>
          
          {pendingTasks.length === 0 ? (
            <p className="text-dark-400 text-center py-6 sm:py-8 text-sm sm:text-base">
              Нет активных задач 🎉
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
              {pendingTasks.slice(0, 5).map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => navigate(`/tasks?task=${task.id}`)}
                />
              ))}
              {pendingTasks.length > 5 && (
                <p 
                  className="text-center text-dark-400 text-xs sm:text-sm pt-2 cursor-pointer hover:text-primary-400 transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  И ещё {pendingTasks.length - 5} задач...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Overdue tasks */}
        <div className="glass-card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-dark-100 mb-3 sm:mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            Просроченные
          </h3>
          
          {overdueTasks.length === 0 ? (
            <p className="text-dark-400 text-center py-6 sm:py-8 text-sm sm:text-base">
              Нет просроченных задач ✨
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
              {overdueTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => navigate(`/tasks?task=${task.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

