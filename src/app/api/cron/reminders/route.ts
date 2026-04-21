import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(req: NextRequest) {
  // Verify cron secret if needed for security
  const authHeader = req.headers.get('authorization');
  const CRON_SECRET = process.env.CRON_SECRET;
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all unsent due reminders
    const dueReminders = await prisma.reminder.findMany({
      where: {
        remind_at: { lte: now },
        is_sent: false,
      },
      include: {
        user: { select: { push_subs: true } }
      }
    });

    let sentCount = 0;

    for (const reminder of dueReminders) {
      const sub = reminder.user.push_subs[0];
      if (!sub) continue;

      try {
        await webpush.sendNotification(
          sub.subscription_object as unknown as webpush.PushSubscription,
          JSON.stringify({
            title: 'Productivity Reminder',
            body: `Time for your ${reminder.entity_type}!`,
            icon: '/icon-192x192.png',
          })
        );

        // Mark as sent — never send twice
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { is_sent: true },
        });
        
        sentCount++;
      } catch (err) {
        console.error('Push failed for user:', reminder.user_id, err);
        // Subscription likely expired — clean it up
        await prisma.pushSubscription.deleteMany({
          where: { user_id: reminder.user_id },
        });
      }
    }

    return NextResponse.json({ processed: dueReminders.length, sent: sentCount });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
