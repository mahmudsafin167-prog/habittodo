'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { HeatmapCell } from '@/lib/analytics';
import { Flame, TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';

interface HabitAnalytics {
  habit_id: string;
  title: string;
  status: string;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  heatmap: HeatmapCell[];
}

interface AnalyticsData {
  habits: HabitAnalytics[];
  overall: {
    thisWeek: number;
    lastWeek: number;
    delta: number;
  };
  advanced: {
    taskVsHabit: { name: string; value: number }[];
    productiveDays: { day: string; count: number }[];
    weeklyTrend: { week: string; rate: number }[];
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
          {payload[0].value}% Completion
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch analytics');
        
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
           <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
           <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto text-center">
        <p className="text-red-500">Failed to load analytics: {error}</p>
      </div>
    );
  }

  // Sort habits by completion rate for the chart
  const rankingData = [...data.habits].sort((a, b) => b.completion_rate - a.completion_rate);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Analytics & Insights</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Understand your patterns and build consistency.</p>
      </header>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> This Week's Completion
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{data.overall.thisWeek}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
           <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            {data.overall.delta >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
            Week over Week
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${data.overall.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {data.overall.delta > 0 ? '+' : ''}{data.overall.delta}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vs last week</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-sm flex flex-col justify-between text-white">
          <div className="text-sm font-medium text-indigo-100 mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-300" /> Best Active Streak
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
               {Math.max(...data.habits.map(h => h.current_streak), 0)}
            </span>
            <span className="text-indigo-100">days</span>
          </div>
        </div>
      </div>

      {/* ADVANCED ANALYTICS SECTION */}
      {data.advanced && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Weekly Trend (Line Chart) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Weekly Trend</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.advanced.weeklyTrend}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip cursor={{ fill: 'rgba(128,128,128,0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task vs Habit (Donut Chart) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Output Breakdown</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.advanced.taskVsHabit}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell key="cell-0" fill="#4f46e5" /> {/* Tasks: Indigo */}
                    <Cell key="cell-1" fill="#10b981" /> {/* Habits: Emerald */}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#4f46e5]"></span> Tasks</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Habits</div>
            </div>
          </div>

          {/* Most Productive Day (Bar Chart) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Most Productive Day</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.advanced.productiveDays}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip cursor={{ fill: 'rgba(128,128,128,0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>
      )}

      {/* Consistency Ranking Chart */}
      {data.habits.length > 0 && (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Consistency Ranking (This Week)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} width={120} style={{ fontSize: '12px', fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="completion_rate" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Heatmaps */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">90-Day Habit Heatmaps</h2>
        
        {data.habits.length === 0 ? (
           <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
             No habits tracked yet.
           </div>
        ) : (
          data.habits.map(habit => (
            <div key={habit.habit_id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm overflow-x-auto">
              <div className="flex justify-between items-center mb-4 min-w-[600px]">
                <h3 className="font-medium text-gray-900 dark:text-white">{habit.title}</h3>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Current: <strong className="text-orange-500">{habit.current_streak}</strong></span>
                  <span>Longest: <strong>{habit.longest_streak}</strong></span>
                </div>
              </div>
              
              <div className="flex gap-1 min-w-[600px]">
                <div className="flex flex-wrap gap-1">
                  {habit.heatmap.map((cell, i) => {
                    let bgColor = 'bg-gray-100 dark:bg-gray-800'; // none
                    if (cell.status === 'completed') bgColor = 'bg-indigo-500';
                    else if (cell.status === 'skipped') bgColor = 'bg-amber-400';
                    else if (cell.status === 'missed') bgColor = 'bg-rose-200 dark:bg-rose-900/50';

                    return (
                      <div 
                        key={i} 
                        title={`${cell.date}: ${cell.status}`}
                        className={`w-3.5 h-3.5 rounded-sm ${bgColor} transition-all hover:scale-125 hover:ring-2 ring-gray-300 cursor-pointer`} 
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
