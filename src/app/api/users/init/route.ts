import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { uid, email } = authResult;
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      // Get additional info from Firebase to populate the user
      const firebaseUser = await adminAuth.getUser(uid);
      
      // Create new user in PostgreSQL
      user = await prisma.user.create({
        data: {
          id: uid,
          email: email || firebaseUser.email || '',
          display_name: firebaseUser.displayName || null,
          avatar_url: firebaseUser.photoURL || null,
          timezone: 'UTC', // Default, can be updated later by client
        },
      });
      
      // Initialize default UserSettings
      await prisma.userSettings.create({
        data: {
          user_id: uid,
          theme: 'light',
          notification_enabled: true,
        }
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in /api/users/init:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
