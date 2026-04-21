import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where = {
      user_id: auth.uid,
      ...(status ? { status } : {}),
    };

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        include: {
          streak_summary: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.habit.count({ where })
    ]);

    return NextResponse.json({
      data: habits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + habits.length < total
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const data = await req.json();

    const habit = await prisma.habit.create({
      data: {
        user_id: auth.uid,
        title: data.title,
        goal: data.goal || null,
        notes: data.notes || null,
        category_id: data.category_id || null,
        reminder_time: data.reminder_time || null,
        recurrence_rule: data.recurrence_rule || null,
      },
    });

    // Initialize StreakSummary
    await prisma.streakSummary.create({
      data: {
        habit_id: habit.id,
      }
    });

    // Note: Push reminder for habit is tricky as it repeats. We'll handle habit push reminders entirely inside the cron job later, since habits don't have a specific `remind_at` date, but a `reminder_time` and `recurrence_rule`.

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
