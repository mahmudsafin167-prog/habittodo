"use client";

import { useAuthStore } from "@/store/authStore";
import { MetricsBanner } from "@/components/dashboard/MetricsBanner";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { TodayHabits } from "@/components/dashboard/TodayHabits";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between mb-2">
        <div>
           <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
             Good morning, {user?.displayName ? user.displayName.split(' ')[0] : 'there'}
           </h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Here is your plan for today.</p>
        </div>
      </header>

      <MetricsBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Today's Tasks</h2>
           </div>
           
           <TodayTasks />
        </section>

        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Today's Habits</h2>
           </div>
           
           <TodayHabits />
        </section>
      </div>
    </div>
  );
}
