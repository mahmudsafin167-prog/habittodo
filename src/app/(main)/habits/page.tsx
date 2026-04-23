'use client';

import { useEffect, useState } from 'react';
import { useHabitStore, Habit } from '@/store/habitStore';
import { useCategoryStore } from '@/store/categoryStore';
import { Trash2, RotateCcw, Target, Pause, Play, ChevronRight, Tag, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ConfirmDialog = dynamic(() => import('@/components/ui/ConfirmDialog').then(mod => mod.ConfirmDialog), { ssr: false });
const HabitDrawer = dynamic(() => import('@/components/habits/HabitDrawer').then(mod => mod.HabitDrawer), { ssr: false });

export default function HabitsPage() {
  const { habits, isLoading, hasMore, isLoadingMore, fetchNextPage, fetchHabits, updateHabit, deleteHabit, searchQuery, setSearchQuery, filterCategory, setFilterCategory, filterStatus, setFilterStatus } = useHabitStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    fetchHabits();
    fetchCategories();
  }, [fetchHabits, fetchCategories]);

  const filteredHabits = habits
    .filter(h => !searchQuery || h.title.toLowerCase().includes(searchQuery.toLowerCase()) || (h.goal && h.goal.toLowerCase().includes(searchQuery.toLowerCase())))
    .filter(h => !filterCategory || filterCategory === 'all' || h.category_id === filterCategory)
    .filter(h => filterStatus === 'all' || h.status === filterStatus);

  const toggleStatus = (id: string, current: string) => {
    updateHabit(id, { status: current === 'active' ? 'paused' : 'active' });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Habits</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Build consistency and track your streaks.</p>
        </div>
      </header>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search habits..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'paused' | 'archived')}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
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
          {categories.filter(c => c.type === 'both' || c.type === 'habit').map(cat => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center flex flex-col items-center">
           <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
             <RotateCcw className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
           </div>
           <h3 className="text-xl font-medium text-gray-900 dark:text-white">No habits yet</h3>
           <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">You haven't created any habits. Use the Quick Add button to get started.</p>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">No habits found</h3>
           <p className="text-gray-500 dark:text-gray-400 mt-2">No habits match the selected category.</p>
        </div>
      ) : (
        <motion.div 
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
          {filteredHabits.map(habit => {
            const isActive = habit.status === 'active';
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                key={habit.id} 
                onClick={() => setSelectedHabit(habit)}
                className={`group flex flex-col justify-between p-5 rounded-xl border transition-all cursor-pointer ${
                  isActive ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate pr-4">
                      {habit.title}
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {habit.recurrence_rule?.type || 'daily'}
                    </span>
                  </div>
                  
                  {habit.goal && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <Target className="w-4 h-4 text-gray-400" />
                      {habit.goal}
                    </div>
                  )}

                  {habit.category_id && categories.find(c => c.id === habit.category_id) && (
                     <div 
                        className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border mb-4"
                        style={{ 
                          borderColor: categories.find(c => c.id === habit.category_id)!.color + '40',
                          color: categories.find(c => c.id === habit.category_id)!.color,
                          backgroundColor: categories.find(c => c.id === habit.category_id)!.color + '10'
                        }}
                      >
                        <Tag className="w-3 h-3" />
                        {categories.find(c => c.id === habit.category_id)?.name}
                     </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-4">
                   <div className="flex flex-col">
                     <span className="text-xs text-gray-500 font-medium mb-1">CURRENT STREAK</span>
                     <div className="flex items-baseline gap-1.5">
                       <span className="text-2xl font-bold text-orange-500">{habit.streak_summary?.current_streak || 0}</span>
                       <span className="text-sm text-gray-500 font-medium">days</span>
                     </div>
                   </div>

                   <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={(e) => { e.stopPropagation(); toggleStatus(habit.id, habit.status); }}
                       className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                       title={isActive ? "Pause habit" : "Resume habit"}
                     >
                       {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setHabitToDelete(habit.id); }}
                       className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {!isLoading && habits.length > 0 && hasMore && (
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
        isOpen={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={async () => {
          if (habitToDelete) {
            try {
              await deleteHabit(habitToDelete);
            } catch (err: any) {
              alert(err.message);
            }
          }
        }}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? All associated logs and streak history will be permanently erased."
        confirmText="Delete Habit"
        isDestructive={true}
      />

      <HabitDrawer 
        habit={selectedHabit} 
        isOpen={!!selectedHabit} 
        onClose={() => setSelectedHabit(null)} 
      />
    </div>
  );
}
