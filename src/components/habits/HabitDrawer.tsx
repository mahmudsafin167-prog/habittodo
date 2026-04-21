import { useEffect, useState } from 'react';
import { X, Calendar, Activity, Play, Pause, Archive, Flame, Target, Bell, Edit3 } from 'lucide-react';
import { Habit, useHabitStore } from '@/store/habitStore';
import { auth } from '@/lib/firebaseClient';
import { HeatmapCell } from '@/lib/analytics';

interface HabitDrawerProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HabitDrawer({ habit, isOpen, onClose }: HabitDrawerProps) {
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [reminderInput, setReminderInput] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const updateHabit = useHabitStore(s => s.updateHabit);

  useEffect(() => {
    if (!isOpen || !habit) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const matched = data.habits.find((h: { habit_id: string; heatmap: HeatmapCell[] }) => h.habit_id === habit.id);
          if (matched) setHeatmap(matched.heatmap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
    setTimeout(() => {
      setIsEditingTarget(false);
      setIsEditingDetails(false);
      setTargetInput(habit.target_days?.toString() || "");
      setNotesInput(habit.notes || "");
      setReminderInput(habit.reminder_time || "");
    }, 0);
  }, [isOpen, habit]);

  if (!isOpen || !habit) return null;

  const currentStreak = habit.streak_summary?.current_streak || 0;
  
  const progressPercent = habit.target_days 
    ? Math.min(100, Math.round((currentStreak / habit.target_days) * 100))
    : 0;

  const handleStatusChange = async (status: 'active' | 'paused' | 'archived') => {
    if (confirm(`Are you sure you want to change the status to ${status}?`)) {
      try {
        await updateHabit(habit.id, { status });
      } catch {
        alert("Failed to update status");
      }
    }
  };

  const handleSetTarget = async () => {
    const days = parseInt(targetInput, 10);
    if (isNaN(days) || days <= 0) return alert("Please enter a valid number of days");
    try {
      await updateHabit(habit.id, { target_days: days });
      setIsEditingTarget(false);
    } catch {
      alert("Failed to update target days");
    }
  };

  const handleRemoveTarget = async () => {
    try {
      await updateHabit(habit.id, { target_days: null });
      setIsEditingTarget(false);
    } catch {
      alert("Failed to remove target");
    }
  };

  const handleSaveDetails = async () => {
    try {
      await updateHabit(habit.id, { 
        notes: notesInput || null,
        reminder_time: reminderInput || null
      });
      setIsEditingDetails(false);
    } catch {
      alert("Failed to save details");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{habit.title}</h2>
            <div className="flex gap-2 mt-1.5">
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                 ${habit.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                   habit.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                   'bg-gray-100 text-gray-700'
                 }
               `}>
                 {habit.status}
               </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Challenge Progress */}
          {habit.target_days ? (
            <div className="space-y-2 relative group">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700 flex items-center gap-1.5"><Target className="w-4 h-4 text-indigo-500" /> Challenge Progress</span>
                <span className="text-indigo-600">{currentStreak} / {habit.target_days} Days</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <button 
                onClick={() => setIsEditingTarget(!isEditingTarget)}
                className="text-xs text-gray-400 hover:text-gray-600 absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit target
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 text-center shadow-sm">
               <Target className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
               <p className="text-sm font-medium text-gray-700 mb-3">Want to set a challenge goal?</p>
               {!isEditingTarget ? (
                 <button 
                   onClick={() => setIsEditingTarget(true)}
                   className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                 >
                   Set Target Days
                 </button>
               ) : null}
            </div>
          )}

          {isEditingTarget && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex gap-2 items-center">
              <input 
                type="number" 
                min="1"
                value={targetInput} 
                onChange={e => setTargetInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g. 30"
              />
              <button onClick={handleSetTarget} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium">Save</button>
              {habit.target_days && (
                 <button onClick={handleRemoveTarget} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium">Remove</button>
              )}
            </div>
          )}

          {/* Streaks */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-orange-50/80 border border-orange-100 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1.5 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4"/> Current
                </div>
                <div className="text-3xl font-black text-orange-900">{currentStreak}</div>
             </div>
             <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Activity className="w-4 h-4"/> Longest
                </div>
                <div className="text-3xl font-black text-gray-900">{habit.streak_summary?.longest_streak || 0}</div>
             </div>
          </div>

          {/* Heatmap */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> 90-Day History</h3>
            {isLoading ? (
               <div className="animate-pulse flex flex-wrap gap-1">
                 {Array.from({ length: 90 }).map((_, i) => <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded-sm"></div>)}
               </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                 {heatmap.map((cell, i) => {
                    let bgColor = 'bg-gray-100 border border-gray-200'; 
                    if (cell.status === 'completed') bgColor = 'bg-indigo-500 shadow-sm';
                    else if (cell.status === 'skipped') bgColor = 'bg-amber-400';
                    else if (cell.status === 'missed') bgColor = 'bg-rose-200';
                    return <div key={i} title={`${cell.date}: ${cell.status}`} className={`w-[14px] h-[14px] rounded-[3px] ${bgColor} transition-transform hover:scale-125 cursor-pointer`} />
                 })}
              </div>
            )}
          </div>

          {/* Details (Notes & Reminders) */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                 <Edit3 className="w-4 h-4" /> Details & Reminders
               </h3>
               {!isEditingDetails && (
                 <button onClick={() => setIsEditingDetails(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                   Edit
                 </button>
               )}
            </div>
            
            {isEditingDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea 
                    value={notesInput} 
                    onChange={e => setNotesInput(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" 
                    rows={3} 
                    placeholder="Why are you building this habit?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Daily Reminder Time</label>
                  <input 
                    type="time" 
                    value={reminderInput} 
                    onChange={e => setReminderInput(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" 
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveDetails} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
                  <button onClick={() => {
                    setIsEditingDetails(false);
                    setNotesInput(habit.notes || "");
                    setReminderInput(habit.reminder_time || "");
                  }} className="text-gray-500 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{habit.notes || <span className="italic text-gray-400">No notes added.</span>}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reminder Time</span>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    {habit.reminder_time ? (
                      <><Bell className="w-3.5 h-3.5 text-amber-500"/> {habit.reminder_time}</>
                    ) : <span className="italic text-gray-400">No reminder set.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-8 border-t border-gray-100 space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Management</h3>
             {habit.status !== 'active' && (
               <button onClick={() => handleStatusChange('active')} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-medium transition-colors">
                 <Play className="w-4 h-4" /> Resume Habit
               </button>
             )}
             {habit.status === 'active' && (
               <button onClick={() => handleStatusChange('paused')} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-medium transition-colors">
                 <Pause className="w-4 h-4" /> Pause Habit
               </button>
             )}
             {habit.status !== 'archived' && (
               <button onClick={() => handleStatusChange('archived')} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl font-medium transition-colors shadow-sm">
                 <Archive className="w-4 h-4" /> Archive Habit
               </button>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
