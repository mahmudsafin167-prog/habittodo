import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/googleCalendar";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  try {
    const data = await req.json();

    // Verify ownership
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const parsedDueDate = data.due_date !== undefined ? (data.due_date ? new Date(data.due_date) : null) : existing.due_date;
    const parsedReminderAt = data.reminder_at !== undefined ? (data.reminder_at ? new Date(data.reminder_at) : null) : existing.reminder_at;

    // Handle completed_at logic
    let completedAt = existing.completed_at;
    if (data.status === 'completed' && existing.status !== 'completed') {
      completedAt = new Date();
    } else if (data.status === 'pending' && existing.status !== 'pending') {
      completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        priority: data.priority !== undefined ? data.priority : existing.priority,
        status: data.status !== undefined ? data.status : existing.status,
        due_date: parsedDueDate,
        due_time: data.due_time !== undefined ? data.due_time : existing.due_time,
        reminder_at: parsedReminderAt,
        recurrence_rule: data.recurrence_rule !== undefined ? data.recurrence_rule : existing.recurrence_rule,
        category_id: data.category_id !== undefined ? data.category_id : existing.category_id,
        is_pinned: data.is_pinned !== undefined ? data.is_pinned : existing.is_pinned,
        is_archived: data.is_archived !== undefined ? data.is_archived : existing.is_archived,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        completed_at: completedAt,
      },
    });

    // Update reminder record if changed
    if (data.reminder_at !== undefined) {
      // Clear existing
      await prisma.reminder.deleteMany({
        where: { entity_type: 'task', entity_id: id }
      });
      // Add new if valid
      if (parsedReminderAt) {
        await prisma.reminder.create({
          data: {
            user_id: auth.uid,
            entity_type: 'task',
            entity_id: id,
            remind_at: parsedReminderAt,
          }
        });
      }
    }

    // Sync subtasks if provided
    if (data.subtasks !== undefined) {
      const incomingIds = data.subtasks.map((st: {id?: string}) => st.id).filter((id: string | undefined) => id && !id.startsWith('temp-'));
      
      // Delete missing subtasks
      if (incomingIds.length > 0) {
        await prisma.subtask.deleteMany({
          where: { task_id: id, id: { notIn: incomingIds } }
        });
      } else {
        await prisma.subtask.deleteMany({
          where: { task_id: id }
        });
      }

      // Upsert remaining
      for (const st of data.subtasks) {
        if (st.id && !st.id.startsWith('temp-')) {
          await prisma.subtask.update({
            where: { id: st.id },
            data: { title: st.title, is_completed: st.is_completed }
          });
        } else {
          await prisma.subtask.create({
            data: { task_id: id, title: st.title, is_completed: st.is_completed || false }
          });
        }
      }
    }

    // Fetch updated task with subtasks to return
    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: { subtasks: { orderBy: { created_at: 'asc' } } }
    });

    // Google Calendar Sync
    if (existing.google_event_id) {
      await updateGoogleCalendarEvent(auth.uid, existing.google_event_id, updatedTask as NonNullable<typeof updatedTask>);
    } else if (updatedTask?.due_date || updatedTask?.reminder_at) {
      const eventId = await createGoogleCalendarEvent(auth.uid, updatedTask);
      if (eventId) {
        await prisma.task.update({ where: { id: updatedTask.id }, data: { google_event_id: eventId } });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task Update Error:", error);
    return NextResponse.json({ error: 'Failed to update task', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
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
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || existing.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    
    if (existing.google_event_id) {
      // Best effort delete, ignore failures
      deleteGoogleCalendarEvent(auth.uid, existing.google_event_id).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
