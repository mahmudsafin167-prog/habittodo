import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { calculateStreak } from "@/lib/recurrence";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const data = await req.json();
    const { date, status, notes } = data; // date should be an ISO string YYYY-MM-DD
    const targetDate = new Date(date);

    // Get user timezone to properly calculate streaks relative to their day
    const user = await prisma.user.findUnique({ where: { id: auth.uid } });
    const userTimezone = user?.timezone || 'UTC';

    const existingHabit = await prisma.habit.findUnique({ 
      where: { id },
      include: { streak_summary: true }
    });
    if (!existingHabit || existingHabit.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    // Upsert the log
    await prisma.habitLog.upsert({
      where: {
        habit_id_date: {
          habit_id: id,
          date: targetDate,
        }
      },
      update: {
        status,
        notes: notes || null,
        logged_at: new Date()
      },
      create: {
        habit_id: id,
        user_id: auth.uid,
        date: targetDate,
        status,
        notes: notes || null,
      }
    });

    // Recalculate streak
    const allLogs = await prisma.habitLog.findMany({
      where: { habit_id: id },
      select: { date: true, status: true },
    });

    const { current, longest, lastCompletedDate } = calculateStreak(allLogs, userTimezone);

    // Update StreakSummary
    const streakSummary = await prisma.streakSummary.upsert({
      where: { habit_id: id },
      update: {
        current_streak: current,
        longest_streak: Math.max(longest, existingHabit.streak_summary?.longest_streak || 0),
        last_completed_date: lastCompletedDate,
      },
      create: {
        habit_id: id,
        current_streak: current,
        longest_streak: longest,
        last_completed_date: lastCompletedDate,
      }
    });

    return NextResponse.json({ success: true, streakSummary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to log habit' }, { status: 500 });
  }
}
