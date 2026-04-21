import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { createGoogleCalendarEvent } from "@/lib/googleCalendar";

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

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [
          { is_pinned: 'desc' },
          { due_date: 'asc' },
          { created_at: 'desc' },
        ],
        include: {
          subtasks: {
            orderBy: { created_at: 'asc' }
          }
        },
        skip,
        take: limit
      }),
      prisma.task.count({ where })
    ]);

    return NextResponse.json({
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + tasks.length < total
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  try {
    const data = await req.json();
    
    // Convert dates if provided
    let parsedDueDate = null;
    let parsedReminderAt = null;
    if (data.due_date) parsedDueDate = new Date(data.due_date);
    if (data.reminder_at) parsedReminderAt = new Date(data.reminder_at);

    const task = await prisma.task.create({
      data: {
        user_id: auth.uid,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'medium',
        due_date: parsedDueDate,
        due_time: data.due_time || null,
        reminder_at: parsedReminderAt,
        recurrence_rule: data.recurrence_rule || null,
        category_id: data.category_id || null,
      },
    });

    // If a reminder_at is set, create a reminder record
    if (parsedReminderAt) {
      await prisma.reminder.create({
        data: {
          user_id: auth.uid,
          entity_type: 'task',
          entity_id: task.id,
          remind_at: parsedReminderAt,
        }
      });
    }

    // Google Calendar Sync
    if (parsedDueDate || parsedReminderAt) {
      const eventId = await createGoogleCalendarEvent(auth.uid, task);
      if (eventId) {
        await prisma.task.update({ where: { id: task.id }, data: { google_event_id: eventId } });
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
