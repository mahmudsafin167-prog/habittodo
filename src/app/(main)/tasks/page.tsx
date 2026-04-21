'use client';

import { useEffect, useState } from 'react';
import { Task, useTaskStore } from '@/store/taskStore';
import { useCategoryStore } from '@/store/categoryStore';
import { Check, Circle, Trash2, Calendar as CalendarIcon, Tag, Search, Archive as ArchiveIcon, RotateCcw, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ConfirmDialog = dynamic(() => import('@/components/ui/ConfirmDialog').then(mod => mod.ConfirmDialog), { ssr: false });
const TaskDrawer = dynamic(() => import('@/components/tasks/TaskDrawer').then(mod => mod.TaskDrawer), { ssr: false });

export default function TasksPage() {
  const { tasks, isLoading, hasMore, isLoadingMore, fetchNextPage, fetchTasks, updateTask, deleteTask, searchQuery, setSearchQuery, filterCategory, setFilterCategory, filterPriority, setFilterPriority, sortBy, setSortBy, filterStatus, setFilterStatus } = useTaskStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [fetchTasks, fetchCategories]);

  const filteredTasks = tasks
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())))
    .filter(t => !filterCategory || filterCategory === 'all' || t.category_id === filterCategory)
    .filter(t => !filterPriority || filterPriority === 'all' || t.priority === filterPriority)
    .filter(t => filterStatus === 'all' || (filterStatus === 'active' ? t.status !== 'archived' : t.status === 'archived'))
    .sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === 'priority') {
        const pValues: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return pValues[b.priority] - pValues[a.priority];
      }
      // created_at fallback
      return a.id > b.id ? -1 : 1; 
    });

  const handleToggle = (id: string, currentStatus: string) => {
    updateTask(id, { status: currentStatus === 'completed' ? 'pending' : 'completed' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Tasks</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all your pending and completed tasks.</p>
        </div>
      </header>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'archived')}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="active">Active Tasks</option>
            <option value="archived">Archived</option>
            <option value="all">All Status</option>
          </select>
          <select 
            value={filterPriority || 'all'} 
            onChange={(e) => setFilterPriority(e.target.value === 'all' ? null : e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'due_date' | 'priority' | 'created_at')}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="created_at">Sort by Newest</option>
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!filterCategory || filterCategory === 'all' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
          >
            All
          </button>
          {categories.filter(c => c.type === 'both' || c.type === 'task').map(cat => (
            <button 
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border`}
              style={filterCategory === cat.id ? { backgroundColor: cat.color, borderColor: cat.color, color: '#fff' } : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#4b5563' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: filterCategory === cat.id ? '#fff' : cat.color }} />
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center flex flex-col items-center">
           <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
             <Check className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
           </div>
           <h3 className="text-xl font-medium text-gray-900 dark:text-white">No tasks yet</h3>
           <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">You haven&apos;t created any tasks. Use the Quick Add button to get started.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
           <p className="text-gray-500 dark:text-gray-400 mt-2">No tasks match the selected category.</p>
        </div>
      ) : (
        <motion.div 
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence>
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className={`group flex items-start gap-4 p-5 rounded-xl border transition-all cursor-pointer ${
                  isCompleted ? 'bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-60' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50'
                }`}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleToggle(task.id, task.status); }}
                  className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-lg font-medium truncate transition-all pr-4 ${isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {task.title}
                    </h3>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded">
                        {task.subtasks.filter((st: {is_completed: boolean}) => st.is_completed).length}/{task.subtasks.length}
                      </span>
                    )}
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ml-auto ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className={`text-sm mb-3 line-clamp-2 ${isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                      {task.description}
                    </p>
                  )}

                  {task.notes && (
                    <p className={`text-sm mb-3 italic bg-gray-50 dark:bg-gray-800 p-2 rounded-lg ${isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                      📝 {task.notes}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mt-2">
                    {task.due_date && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {task.reminder_at && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md">
                        <Bell className="w-3.5 h-3.5" />
                        {new Date(task.reminder_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}
                        {!isCompleted && (
                           <select 
                             onClick={(e) => e.stopPropagation()}
                             onChange={(e) => {
                               const val = e.target.value;
                               if (!val) return;
                               const current = new Date(task.reminder_at!).getTime();
                               let newReminder = current;
                               if (val === '1h') newReminder += 60 * 60 * 1000;
                               if (val === '3h') newReminder += 3 * 60 * 60 * 1000;
                               if (val === 'tomorrow') {
                                  const tmrw = new Date();
                                  tmrw.setDate(tmrw.getDate() + 1);
                                  tmrw.setHours(9, 0, 0, 0);
                                  newReminder = tmrw.getTime();
                               }
                               updateTask(task.id, { reminder_at: new Date(newReminder).toISOString() });
                               e.target.value = '';
                             }}
                             className="ml-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60 rounded text-[10px] uppercase font-bold border-none cursor-pointer py-0.5 px-1 focus:ring-0"
                             title="Snooze Reminder"
                           >
                             <option value="">Snooze</option>
                             <option value="1h">+1 Hour</option>
                             <option value="3h">+3 Hours</option>
                             <option value="tomorrow">Tomorrow 9 AM</option>
                           </select>
                        )}
                      </div>
                    )}
                    {task.category_id && categories.find(c => c.id === task.category_id) && (
                      <div 
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md"
                        style={{ 
                          backgroundColor: categories.find(c => c.id === task.category_id)!.color + '15',
                          color: categories.find(c => c.id === task.category_id)!.color 
                        }}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {categories.find(c => c.id === task.category_id)?.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {task.status !== 'archived' ? (
                     <button 
                       onClick={(e) => { e.stopPropagation(); updateTask(task.id, { is_archived: true, status: 'archived' }); }}
                       className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                       title="Archive task"
                     >
                       <ArchiveIcon className="w-5 h-5" />
                     </button>
                   ) : (
                     <button 
                       onClick={(e) => { e.stopPropagation(); updateTask(task.id, { is_archived: false, status: 'pending' }); }}
                       className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                       title="Unarchive task"
                     >
                       <RotateCcw className="w-5 h-5" />
                     </button>
                   )}
                                      <button 
                        onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {!isLoading && tasks.length > 0 && hasMore && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => fetchNextPage()}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : 'Load More'}
          </button>
        </div>
      )}

      <ConfirmDialog 
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (taskToDelete) {
            try {
              await deleteTask(taskToDelete);
            } catch (err: unknown) {
              alert(err instanceof Error ? err.message : String(err));
            }
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />

      <TaskDrawer 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </div>
  );
}
