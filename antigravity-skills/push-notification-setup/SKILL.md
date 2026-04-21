---
name: push-notification-setup
description: Use when implementing Web Push notifications, VAPID keys, push subscription storage, Vercel Cron Jobs for reminders, or the /api/cron/reminders endpoint.
---

# Push Notification Setup

## Use this skill when
- Setting up Web Push API
- Storing or retrieving push subscriptions
- Building the `/api/cron/reminders` endpoint
- Configuring Vercel Cron Jobs
- Handling browser notification permission

---

## Environment Variables Required

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your@email.com
```

Generate VAPID keys once:
```bash
npx web-push generate-vapid-keys
```

---

## Push Subscription Flow

### Step 1 — Request Permission (Frontend)

On first login, request permission once. Do NOT retry if denied.

```ts
export async function subscribeToPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    // Show in-app reminder badge as fallback — do not retry
    useNotificationStore.getState().setFallbackMode(true);
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    ),
  });

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getToken()}`,
    },
    body: JSON.stringify(subscription),
  });
}
```

### Step 2 — Store Subscription (Backend)

```ts
// app/api/push/subscribe/route.ts
export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const subscription = await req.json();

  await prisma.pushSubscription.upsert({
    where: { user_id: auth.uid },
    update: { subscription_object: subscription },
    create: { user_id: auth.uid, subscription_object: subscription },
  });

  return NextResponse.json({ ok: true });
}
```

---

## Cron Job — /api/cron/reminders

### vercel.json config

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour (Vercel free tier limitation). Remind users: precision is within ~1 hour.

### Endpoint Implementation

```ts
// app/api/cron/reminders/route.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (not public)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find all unsent due reminders
  const dueReminders = await prisma.reminder.findMany({
    where: {
      remind_at: { lte: now },
      is_sent: false,
    },
    include: {
      user: {
        include: { push_subs: true },
      },
    },
  });

  for (const reminder of dueReminders) {
    const sub = reminder.user.push_subs[0];
    if (!sub) continue;

    try {
      await webpush.sendNotification(
        sub.subscription_object as webpush.PushSubscription,
        JSON.stringify({
          title: 'Reminder',
          body: `Time for: ${reminder.entity_type}`,
          icon: '/icons/icon-192.png',
        })
      );

      // Mark as sent — never send twice
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { is_sent: true },
      });
    } catch {
      // Subscription expired — clean it up
      await prisma.pushSubscription.deleteMany({
        where: { user_id: reminder.user_id },
      });
    }
  }

  return NextResponse.json({ processed: dueReminders.length });
}
```

---

## Fallback — In-App Reminder Badge

If user denies push permission, show a red badge/indicator on Dashboard for tasks/habits with a due reminder. This is the only fallback — do not use email reminders (Phase 3 feature).

---

## Important Rules

- `is_sent` must be set to `true` immediately after sending — reminders must never fire twice
- Never retry push permission after user denies — they must enable it from browser settings manually
- Add `CRON_SECRET` to Vercel env vars and verify it in the cron endpoint
