import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const data = await req.json();

    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        goal: data.goal !== undefined ? data.goal : existing.goal,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        category_id: data.category_id !== undefined ? data.category_id : existing.category_id,
        reminder_time: data.reminder_time !== undefined ? data.reminder_time : existing.reminder_time,
        recurrence_rule: data.recurrence_rule !== undefined ? data.recurrence_rule : existing.recurrence_rule,
        status: data.status !== undefined ? data.status : existing.status,
        target_days: data.target_days !== undefined ? data.target_days : existing.target_days,
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } }); // Cascades to habit_logs, streak_summary, reminders
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
