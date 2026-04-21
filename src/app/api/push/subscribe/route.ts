import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth || !auth.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await req.json();

    // Since Prisma might not have upsert without a unique field on user_id, let's check schema.
    // user_id isn't marked @unique on PushSubscription in schema. Prisma create/delete is safer.
    // Wait, let's find existing first.
    const existing = await prisma.pushSubscription.findFirst({
      where: { user_id: auth.uid }
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { subscription_object: subscription }
      });
    } else {
      await prisma.pushSubscription.create({
        data: { user_id: auth.uid, subscription_object: subscription }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Failed to save push subscription:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
