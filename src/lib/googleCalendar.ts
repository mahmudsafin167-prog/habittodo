import { prisma } from "./prisma";

/**
 * Ensures the Google access token is valid, refreshing it if necessary.
 * Returns the valid access token.
 */
export async function getValidGoogleAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { google_refresh_token: true }
  });

  if (!user?.google_refresh_token) {
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Failed to refresh Google token:", data);
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return null;
  }
}

/**
 * Creates an event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  userId: string, 
  task: { title: string; description?: string | null; due_date?: Date | null; reminder_at?: Date | null; id: string }
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { google_calendar_id: true }
  });

  const calendarId = user?.google_calendar_id || 'primary';
  const accessToken = await getValidGoogleAccessToken(userId);

  if (!accessToken) return null;

  // We only sync if there is a specific time or date
  if (!task.due_date && !task.reminder_at) return null;

  const event: {
    summary: string;
    description: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  } = {
    summary: task.title,
    description: task.description || '',
  };

  if (task.reminder_at) {
    event.start = { dateTime: task.reminder_at.toISOString() };
    // Default duration 1 hour
    const end = new Date(task.reminder_at.getTime() + 60 * 60 * 1000);
    event.end = { dateTime: end.toISOString() };
  } else if (task.due_date) {
    // All day event
    const dateStr = task.due_date.toISOString().split('T')[0];
    event.start = { date: dateStr };
    event.end = { date: dateStr };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Failed to create GCal event", data);
      return null;
    }

    return data.id; // google_event_id
  } catch (err) {
    console.error("Error creating GCal event", err);
    return null;
  }
}

/**
 * Updates an event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  userId: string, 
  eventId: string,
  task: { title: string; description?: string | null; due_date?: Date | null; reminder_at?: Date | null; status?: string }
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { google_calendar_id: true }
  });

  const calendarId = user?.google_calendar_id || 'primary';
  const accessToken = await getValidGoogleAccessToken(userId);

  if (!accessToken) return false;

  const event: {
    summary: string;
    description: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  } = {
    summary: task.title,
    description: task.description || '',
  };

  if (task.status === 'completed') {
    event.summary = `âœ… ${task.title}`;
  } else if (task.status === 'archived') {
    event.summary = `âŒ ${task.title} (Archived)`;
  }

  if (task.reminder_at) {
    event.start = { dateTime: task.reminder_at.toISOString() };
    const end = new Date(task.reminder_at.getTime() + 60 * 60 * 1000);
    event.end = { dateTime: end.toISOString() };
  } else if (task.due_date) {
    const dateStr = task.due_date.toISOString().split('T')[0];
    event.start = { date: dateStr };
    event.end = { date: dateStr };
  } else {
    // Has no date/time anymore, we might want to delete it or leave it as today
    const todayStr = new Date().toISOString().split('T')[0];
    event.start = { date: todayStr };
    event.end = { date: todayStr };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Failed to update GCal event", data);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error updating GCal event", err);
    return false;
  }
}

/**
 * Deletes an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { google_calendar_id: true }
  });

  const calendarId = user?.google_calendar_id || 'primary';
  const accessToken = await getValidGoogleAccessToken(userId);

  if (!accessToken) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    return res.ok || res.status === 404;
  } catch (err) {
    console.error("Error deleting GCal event", err);
    return false;
  }
}
