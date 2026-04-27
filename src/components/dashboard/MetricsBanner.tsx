'use client';

import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { isDueToday } from '@/lib/recurrence';
import { useAuthStore } from '@/store/authStore';
import { formatInTimeZone } from 'date-fns-tz';

export function MetricsBanner() {
  const { tasks, isLoading: tasksLoading } = useTaskStore();
  const { habits, isLoading: habitsLoading } = useHabitStore();
  const { user } = useAuthStore();
  
  if (tasksLoading || habitsLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Calculate Tasks Due Today
  const timezone = user?.timezone || 'UTC';
  
  const isDateToday = (dateString: string | null) => {
    if (!dateString) return false;
    try {
      const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
      const taskDateStr = formatInTimeZone(new Date(dateString), timezone, 'yyyy-MM-dd');
      return todayStr === taskDateStr;
    } catch {
      const d = new Date(dateString);
      const today = new Date();
      return d.getFullYear() === today.getFullYear() && 
             d.getMonth() === today.getMonth() && 
             d.getDate() === today.getDate();
    }
  };

  const tasksDueToday = tasks.filter(t => 
    t.status !== 'archived' && 
    (t.recurrence_rule ? isDueToday(t.recurrence_rule, timezone) : isDateToday(t.due_date))
  );
  
  const tasksCompleted = tasksDueToday.filter(t => t.status === 'completed').length;
  const taskCompletionRate = tasksDueToday.length > 0 ? Math.round((tasksCompleted / tasksDueToday.length) * 100) : 0;

  // Calculate Habits Due Today
  // Note: a real system needs to cross-reference with habit_logs for "today" to know if it's done. 
  // For the MVP, we just show streaks and active count.
  const activeHabits = habits.filter(h => h.status === 'active');
  const highestStreak = activeHabits.length > 0 
    ? Math.max(...activeHabits.map(h => h.streak_summary?.current_streak || 0)) 
    : 0;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Task Completion</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-gray-900 dark:text-white">{taskCompletionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500" 
            style={{ width: `${taskCompletionRate}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tasks Left</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-gray-900 dark:text-white">{tasksDueToday.length - tasksCompleted}</span>
          <span className="text-sm text-gray-400 font-medium">/ {tasksDueToday.length}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Highest Active Streak</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-orange-500 dark:text-orange-400">{highestStreak}</span>
          <span className="text-xl">🔥</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Habits</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-gray-900 dark:text-white">{activeHabits.length}</span>
        </div>
      </div>
    </div>
  );
}
