'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2, Settings } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'custom';

const MODES = {
  pomodoro: { label: 'Focus', minutes: 25, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', activeBg: 'bg-indigo-600 text-white' },
  shortBreak: { label: 'Short Break', minutes: 5, icon: Coffee, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', activeBg: 'bg-emerald-600 text-white' },
  longBreak: { label: 'Long Break', minutes: 15, icon: Coffee, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', activeBg: 'bg-blue-600 text-white' },
  custom: { label: 'Custom', minutes: 30, icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20', activeBg: 'bg-gray-800 dark:bg-gray-700 text-white' },
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { tasks, updateTask } = useTaskStore();
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setTimeout(() => setIsActive(false), 0);
      // Play a sound when timer finishes
      try {
         const audio = new Audio('/notification.mp3');
         audio.play().catch(e => console.log('Audio play failed', e));
      } catch {}
      
      if (mode === 'pomodoro' && selectedTaskId) {
         if (confirm("Pomodoro finished! Would you like to mark the selected task as completed?")) {
            updateTask(selectedTaskId, { status: 'completed' });
            setTimeout(() => setSelectedTaskId(null), 0);
         }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, selectedTaskId, updateTask]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft((mode === 'custom' ? customMinutes : MODES[mode].minutes) * 60);
  }, [mode, customMinutes]);

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft((newMode === 'custom' ? customMinutes : MODES[newMode].minutes) * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = (mode === 'custom' ? customMinutes : MODES[mode].minutes) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-10 shadow-sm max-w-2xl mx-auto flex flex-col items-center relative overflow-hidden">
      {/* Background progress bar indicator */}
      <div 
        className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
           mode === 'pomodoro' ? 'bg-indigo-500' : 
           mode === 'shortBreak' ? 'bg-emerald-500' : 
           mode === 'longBreak' ? 'bg-blue-500' : 'bg-gray-800 dark:bg-gray-500'
        }`}
        style={{ width: `${progress}%` }} 
      />

      {/* Mode Selector */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-10 w-full max-w-md">
        {(Object.keys(MODES) as TimerMode[]).map((m) => {
          const modeDef = MODES[m];
          const Icon = modeDef.icon;
          return (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === m 
                  ? modeDef.activeBg + ' shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 hidden sm:block" />
              {modeDef.label}
            </button>
          );
        })}
      </div>

      {/* Timer Display */}
      <div className="text-[5rem] md:text-[8rem] font-bold text-gray-900 dark:text-white tracking-tighter leading-none mb-10 tabular-nums">
        {formatTime(timeLeft)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-12">
        <button
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
             mode === 'pomodoro' ? 'bg-indigo-600 hover:bg-indigo-700' : 
             mode === 'shortBreak' ? 'bg-emerald-600 hover:bg-emerald-700' : 
             mode === 'longBreak' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Custom Timer Input */}
      {mode === 'custom' && !isActive && (
        <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800 mb-6 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Set Custom Minutes</h3>
          <input 
            type="number" 
            min="1" 
            max="120" 
            value={customMinutes || ''} 
            onChange={(e) => {
               const val = parseInt(e.target.value);
               setCustomMinutes(val || 0);
               if (val) setTimeLeft(val * 60);
            }}
            className="w-24 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-lg font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 outline-none"
          />
        </div>
      )}

      {/* Task Linking */}
      {mode === 'pomodoro' && (
        <div className="w-full max-w-md bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            Focusing on
          </h3>
          <select
            value={selectedTaskId || ""}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Select a task to focus on --</option>
            {pendingTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
