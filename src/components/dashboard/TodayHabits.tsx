'use client';

import { useEffect, useState } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { useAuthStore } from '@/store/authStore';
import { isDueToday } from '@/lib/recurrence';
import { Check, RotateCcw } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Habit } from '@/store/habitStore';
import { formatInTimeZone } from 'date-fns-tz';

const HabitItem = memo(({ 
  habit, 
  todayStr, 
  timezone, 
  activeNoteHabitId, 
  noteInput, 
  onLog, 
  onSaveNote, 
  onNoteInputChange 
}: { 
  habit: Habit; 
  todayStr: string; 
  timezone: string;
  activeNoteHabitId: string | null;
  noteInput: string;
  onLog: (id: string, isCompleted: boolean) => void;
  onSaveNote: (id: string) => void;
  onNoteInputChange: (value: string) => void;
}) => {
  let isCompleted = false;
  if (habit.streak_summary?.last_completed_date) {
    try {
      const lastCompletedStr = formatInTimeZone(new Date(habit.streak_summary.last_completed_date), timezone, 'yyyy-MM-dd');
      isCompleted = lastCompletedStr === todayStr;
    } catch {
      const d = new Date(habit.streak_summary.last_completed_date);
      const lastStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      isCompleted = lastStr === todayStr;
    }
  }

  const isActiveNote = activeNoteHabitId === habit.id;

  return (
    <div className="flex flex-col gap-2">
      <div 
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
          isCompleted ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30' : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex-1 overflow-hidden">
          <p className={`font-medium truncate ${isCompleted ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`}>{habit.title}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-medium text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded flex items-center gap-1">
              🔥 {habit.streak_summary?.current_streak || 0}
            </span>
            {habit.goal && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{habit.goal}</span>}
          </div>
        </div>
        <button 
          onClick={() => onLog(habit.id, isCompleted)}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isCompleted 
              ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
              : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-400'
          }`}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
      {isActiveNote && isCompleted && (
        <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-2 mb-2">
          <input 
            type="text"
            placeholder="Add a note for today? (Optional)"
            value={noteInput}
            onChange={(e) => onNoteInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSaveNote(habit.id)}
            className="flex-1 text-sm bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:outline-none px-2 py-1 text-gray-700 dark:text-gray-300 transition-colors"
            autoFocus
          />
          <button 
            onClick={() => onSaveNote(habit.id)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
});

HabitItem.displayName = 'HabitItem';

export function TodayHabits() {
  const { habits, isLoading, fetchHabits, logHabit } = useHabitStore();
  const { user } = useAuthStore();
  const [activeNoteHabitId, setActiveNoteHabitId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const timezone = user?.timezone || 'UTC';

  const getTodayString = useCallback(() => {
    try {
      return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
    } catch {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }, [timezone]);

  const todayStr = useMemo(() => getTodayString(), [getTodayString]);

  const handleLog = useCallback((id: string, isCompleted: boolean) => {
    logHabit(id, isCompleted ? 'skipped' : 'completed', todayStr);
    if (!isCompleted) {
      setActiveNoteHabitId(id);
      setNoteInput('');
    } else {
      setActiveNoteHabitId(null);
    }
  }, [logHabit, todayStr]);

  const handleSaveNote = useCallback((id: string) => {
    if (noteInput.trim()) {
      logHabit(id, 'completed', todayStr, noteInput.trim());
    }
    setActiveNoteHabitId(null);
  }, [logHabit, noteInput, todayStr]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const habitsDueToday = habits.filter(h => 
    h.status === 'active' && 
    (h.recurrence_rule ? isDueToday(h.recurrence_rule, timezone) : true)
  );

  if (habitsDueToday.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
          <RotateCcw className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
        </div>
        <p className="text-gray-900 dark:text-gray-100 font-medium">No habits scheduled</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Take a rest or add a new habit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habitsDueToday.map((habit) => (
        <HabitItem 
          key={habit.id}
          habit={habit}
          todayStr={todayStr}
          timezone={timezone}
          activeNoteHabitId={activeNoteHabitId}
          noteInput={noteInput}
          onLog={handleLog}
          onSaveNote={handleSaveNote}
          onNoteInputChange={setNoteInput}
        />
      ))}
    </div>
  );
}
