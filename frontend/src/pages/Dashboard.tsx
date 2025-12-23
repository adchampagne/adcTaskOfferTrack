import { useQuery } from '@tanstack/react-query';
import { Building2, Package, CheckSquare, Clock, AlertCircle } from 'lucide-react';
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
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-dark-100">{value}</p>
          <p className="text-sm text-dark-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const isOverdue = isPast(new Date(task.deadline)) && task.status !== 'completed';
  const isDueToday = isToday(new Date(task.deadline));

  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      isOverdue 
        ? 'bg-red-500/5 border-red-500/20' 
        : isDueToday 
          ? 'bg-yellow-500/5 border-yellow-500/20'
          : 'bg-dark-800/50 border-dark-700/50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-dark-100 truncate">{task.title}</h4>
          <p className="text-sm text-dark-400 mt-1">
            {taskTypeLabels[task.task_type]}
          </p>
          <p className="text-xs text-dark-500 mt-2">
            Исполнитель: {task.executor_name}
          </p>
        </div>
        <div className="text-right">
          <span className={`status-badge status-${task.status}`}>
            {taskStatusLabels[task.status]}
          </span>
          <p className={`text-xs mt-2 ${isOverdue ? 'text-red-400' : 'text-dark-400'}`}>
            {isOverdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
            {format(new Date(task.deadline), 'd MMM, HH:mm', { locale: ru })}
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuthStore();

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
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-3xl font-bold text-dark-100">
          Привет, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-dark-400 mt-2">
          Вот краткая сводка по вашей работе
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My pending tasks */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-400" />
            Мои активные задачи
          </h3>
          
          {pendingTasks.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              Нет активных задач 🎉
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingTasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {pendingTasks.length > 5 && (
                <p className="text-center text-dark-400 text-sm pt-2">
                  И ещё {pendingTasks.length - 5} задач...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Overdue tasks */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Просроченные задачи
          </h3>
          
          {overdueTasks.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              Нет просроченных задач ✨
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {overdueTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

