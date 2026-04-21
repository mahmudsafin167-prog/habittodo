import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { subMonths, subDays, getDay } from "date-fns";
import { buildHeatmapData, weeklyCompletionRate, weekOverWeekTrend } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.uid },
      select: { timezone: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const timezone = user.timezone || "UTC";

    // Fetch habits with streak summaries
    const habits = await prisma.habit.findMany({
      where: { user_id: auth.uid },
      include: {
        streak_summary: true,
      }
    });

    // Fetch logs from the last 3 months
    const threeMonthsAgo = subMonths(new Date(), 3);
    const logs = await prisma.habitLog.findMany({
      where: {
        user_id: auth.uid,
        date: { gte: threeMonthsAgo }
      },
      orderBy: { date: 'asc' }
    });

    // We can group logs by habit
    const analyticsByHabit = habits.map(habit => {
      const habitLogs = logs.filter(l => l.habit_id === habit.id);
      
      return {
        habit_id: habit.id,
        title: habit.title,
        status: habit.status,
        current_streak: habit.streak_summary?.current_streak || 0,
        longest_streak: habit.streak_summary?.longest_streak || 0,
        completion_rate: weeklyCompletionRate(habitLogs, timezone),
        heatmap: buildHeatmapData(habitLogs, timezone, 3),
      };
    });

    // Overall metrics
    const overallWoW = weekOverWeekTrend(logs, timezone);

    // --- ADVANCED ANALYTICS (Last 30 Days) ---
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const completedTasks = await prisma.task.findMany({
      where: {
        user_id: auth.uid,
        status: 'completed',
        completed_at: { gte: thirtyDaysAgo }
      }
    });

    const recentLogs = logs.filter(l => l.date >= thirtyDaysAgo);
    const completedHabitLogs = recentLogs.filter(l => l.status === 'completed');

    // 1. Task vs Habit Completion
    const taskVsHabit = [
      { name: 'Tasks', value: completedTasks.length },
      { name: 'Habits', value: completedHabitLogs.length }
    ];

    // 2. Productive Days (Group by Day of Week 0-6)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const productiveDaysMap = Array(7).fill(0);
    
    completedTasks.forEach(t => {
      if (t.completed_at) {
        productiveDaysMap[getDay(t.completed_at)]++;
      }
    });
    
    completedHabitLogs.forEach(l => {
      productiveDaysMap[getDay(l.date)]++;
    });

    const productiveDays = dayNames.map((name, index) => ({
      day: name,
      count: productiveDaysMap[index]
    }));

    // 3. Weekly Trend (Last 4 Weeks)
    const weeklyTrend = [];
    for(let i=3; i>=0; i--) {
        const shiftedLogs = logs.map(l => ({
            ...l,
            date: new Date(l.date.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
        }));
        const rate = weeklyCompletionRate(shiftedLogs, timezone);
        
        let label = 'This Week';
        if (i === 1) label = '1w ago';
        if (i === 2) label = '2w ago';
        if (i === 3) label = '3w ago';
        
        weeklyTrend.push({ week: label, rate });
    }

    return NextResponse.json({
      habits: analyticsByHabit,
      overall: overallWoW,
      advanced: {
        taskVsHabit,
        productiveDays,
        weeklyTrend
      }
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
