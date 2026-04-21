'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useUIStore } from '@/store/uiStore';
import { Modal } from '@/components/ui/Modal';
import { Sparkles } from 'lucide-react';

export function QuickAdd() {
  const { isQuickAddOpen, setQuickAddOpen } = useUIStore();
  const pathname = usePathname();
  const [type, setType] = useState<'task' | 'habit'>('task');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isLoading = false;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { addTask } = useTaskStore();
  const { addHabit } = useHabitStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!navigator.onLine) {
      alert("No internet. Please reconnect to create new items.");
      return;
    }

    // Close modal immediately for a snappy feel
    setQuickAddOpen(false);
    setTitle('');
    setCategoryId('');
    setNotes('');
    setReminderAt('');
    setShowAdvanced(false);

    if (type === 'task') {
      const today = new Date().toISOString();
      addTask({ 
        title, 
        priority: 'medium', 
        status: 'pending', 
        due_date: today, 
        category_id: categoryId || null,
        notes: notes || null,
        reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null
      }).catch(console.error);
    } else {
      addHabit({ 
        title, 
        status: 'active', 
        recurrence_rule: { type: 'daily' }, 
        category_id: categoryId || null,
        notes: notes || null,
        reminder_time: reminderAt || null
      }).catch(console.error);
    }
  };

  return (
    <>
      {pathname !== '/settings' && (
        <button
          onClick={() => setQuickAddOpen(true)}
          disabled={!isOnline}
          title={!isOnline ? "No internet. Please reconnect to create new items." : "Quick Add"}
          className={`fixed bottom-10 right-10 p-4 rounded-full shadow-2xl transition-all z-50 hidden md:flex items-center justify-center border-2 border-white/20 ${
            isOnline ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-110 active:scale-95' : 'bg-gray-400 text-white cursor-not-allowed opacity-75'
          }`}
        >
          <Sparkles className="w-6 h-6 fill-white/20" />
        </button>
      )}

      <Modal isOpen={isQuickAddOpen} onClose={() => setQuickAddOpen(false)} title="Quick Add">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'task' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setType('task')}
            >
              Task
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'habit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setType('habit')}
            >
              Habit
            </button>
          </div>

          <div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'task' ? "What needs to be done?" : "What habit to build?"}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          <div>
             <select 
               value={categoryId} 
               onChange={e => setCategoryId(e.target.value)}
               className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
               disabled={isLoading}
             >
               <option value="">No Category</option>
               {categories.filter(c => c.type === 'both' || c.type === type).map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>

          <div>
             <button
               type="button"
               onClick={() => setShowAdvanced(!showAdvanced)}
               className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
             >
               {showAdvanced ? '- Hide advanced details' : '+ Add details (Notes, Reminders)'}
             </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {type === 'task' ? 'Reminder Date & Time' : 'Daily Reminder Time'}
                </label>
                <input
                  type={type === 'task' ? 'datetime-local' : 'time'}
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="w-full bg-gray-900 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : `Add ${type === 'task' ? 'Task' : 'Habit'}`}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
