'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { isDueToday } from '@/lib/recurrence';
import { Check, Circle } from 'lucide-react';
import { useState } from 'react';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { memo, useCallback } from 'react';
import { Task } from '@/store/taskStore';

const TaskItem = memo(({ 
  task, 
  onToggle, 
  onClick 
}: { 
  task: Task; 
  onToggle: (id: string, status: string) => void;
  onClick: (task: Task) => void;
}) => {
  const isCompleted = task.status === 'completed';
  
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => onClick(task)}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
        isCompleted ? 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-60' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50'
      }`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.status); }}
        className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
      >
        {isCompleted ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
      <div className={`flex-1 overflow-hidden transition-all ${isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{task.title}</p>
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded">
              {task.subtasks.filter((st: {is_completed: boolean}) => st.is_completed).length}/{task.subtasks.length}
            </span>
          )}
        </div>
        {task.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{task.description}</p>}
      </div>
      {task.priority !== 'medium' && (
        <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
          task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {task.priority}
        </div>
      )}
    </motion.div>
  );
});

TaskItem.displayName = 'TaskItem';

export function TodayTasks() {
  const { tasks, isLoading, fetchTasks, updateTask } = useTaskStore();
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = useCallback((id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateTask(id, { status: newStatus });
    
    if (newStatus === 'completed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
      });
    }
  }, [updateTask]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const timezone = user?.timezone || 'UTC';
  
  const tasksDueToday = tasks.filter(t => 
    t.status !== 'archived' && 
    (t.recurrence_rule ? isDueToday(t.recurrence_rule, timezone) : (t.due_date && isDueToday({ type: 'once' }, timezone, new Date(t.due_date))))
  );

  if (tasksDueToday.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
          <Check className="w-6 h-6 text-green-500 dark:text-green-400" />
        </div>
        <p className="text-gray-900 dark:text-gray-100 font-medium">You&apos;re all caught up!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enjoy the rest of your day.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {tasksDueToday.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onToggle={handleToggle} 
          onClick={handleTaskClick} 
        />
      ))}

      <TaskDrawer 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </motion.div>
  );
}
