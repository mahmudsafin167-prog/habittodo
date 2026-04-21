'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, Calendar as CalendarIcon, XCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface HistoryTask {
  id: string;
  title: string;
  completed_at: string;
  priority: string;
}

interface HabitLog {
  id: string;
  date: string;
  status: 'completed' | 'skipped' | 'missed';
  habit: { title: string };
}

interface HistoryData {
  tasks: HistoryTask[];
  habitLogs: HabitLog[];
}

export default function CalendarPage() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<HistoryData>({ tasks: [], habitLogs: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Drill-down state
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const dateParam = format(currentDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/history?date=${dateParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user, currentDate]);

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayData = (day: Date) => {
    const dayTasks = data.tasks.filter(t => t.completed_at && isSameDay(new Date(t.completed_at), day));
    const dayLogs = data.habitLogs.filter(l => isSameDay(new Date(l.date), day));
    return { dayTasks, dayLogs };
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Calendar & History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review your past completions and consistency.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="font-medium w-32 text-center text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);
            const { dayTasks, dayLogs } = getDayData(day);
            const completedHabits = dayLogs.filter(l => l.status === 'completed');
            
            const totalActivity = dayTasks.length + completedHabits.length;
            
            return (
              <div 
                key={i} 
                onClick={() => isCurrentMonth && setSelectedDay(day)}
                className={`min-h-[100px] md:min-h-[120px] p-2 border-b border-r border-gray-100 dark:border-gray-800 transition-colors relative
                  ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/20 text-gray-400 dark:text-gray-600' : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 cursor-pointer'}
                  ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                `}
              >
                <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2
                  ${isTodayDate ? 'bg-indigo-600 text-white' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                
                {isCurrentMonth && !isLoading && (
                  <div className="space-y-1 mt-1">
                    {dayTasks.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                        <CheckSquare className="w-3 h-3 hidden md:block" />
                        {dayTasks.length} Task{dayTasks.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {completedHabits.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded">
                        <CalendarIcon className="w-3 h-3 hidden md:block" />
                        {completedHabits.length} Habit{completedHabits.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
                
                {isLoading && isCurrentMonth && (
                   <div className="w-1/2 h-2 bg-gray-100 dark:bg-gray-800 rounded mt-2 animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill Down Modal */}
      {selectedDay && (
        <Modal
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          title={`Activity for ${format(selectedDay, 'MMMM do, yyyy')}`}
        >
          <div className="space-y-6">
            {(() => {
               const { dayTasks, dayLogs } = getDayData(selectedDay);
               
               if (dayTasks.length === 0 && dayLogs.length === 0) {
                 return <p className="text-gray-500 text-center py-4">No activity logged for this day.</p>;
               }

               return (
                 <>
                   {dayTasks.length > 0 && (
                     <div>
                       <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Tasks Completed</h4>
                       <ul className="space-y-2">
                         {dayTasks.map(task => (
                           <li key={task.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                             <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                             <span className="text-gray-900 dark:text-white font-medium">{task.title}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}

                   {dayLogs.length > 0 && (
                     <div>
                       <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 mt-4">Habits Logged</h4>
                       <ul className="space-y-2">
                         {dayLogs.map(log => (
                           <li key={log.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                             {log.status === 'completed' ? (
                               <CheckCircle2 className="w-5 h-5 text-orange-500" />
                             ) : log.status === 'skipped' ? (
                               <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-500 font-bold">-</div>
                             ) : (
                               <XCircle className="w-5 h-5 text-red-400" />
                             )}
                             <span className="text-gray-900 dark:text-white font-medium">{log.habit.title}</span>
                             <span className="ml-auto text-xs uppercase font-bold text-gray-500">{log.status}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </>
               );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}
