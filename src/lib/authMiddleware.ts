import { adminAuth } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    console.error('Token verification error:', error);
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}
