import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";

export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  // Encode the uid in the state parameter
  const state = Buffer.from(JSON.stringify({ uid: auth.uid })).toString('base64');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.events');
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent'); // Forces refresh token generation
  url.searchParams.append('state', state);

  return NextResponse.json({ url: url.toString() });
}
