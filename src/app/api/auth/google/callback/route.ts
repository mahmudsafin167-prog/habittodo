import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const settingsUrl = new URL('/settings', req.url);

  if (!code || !state) {
    settingsUrl.searchParams.set('error', 'missing_params');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const uid = decodedState.uid;

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed", tokenData);
      settingsUrl.searchParams.set('error', 'token_exchange_failed');
      return NextResponse.redirect(settingsUrl);
    }

    const { access_token, refresh_token } = tokenData;

    // Check if we already have a calendar id for this user
    const user = await prisma.user.findUnique({ where: { id: uid } });
    let calendarId = user?.google_calendar_id;

    if (!calendarId) {
      // Create a new calendar named "Productivity App"
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ summary: 'Productivity App' })
      });
      
      const calData = await calRes.json();
      calendarId = calData.id || 'primary'; // Fallback to primary if creation fails
    }

    // Save refresh_token and calendar_id to the user in database
    await prisma.user.update({
      where: { id: uid },
      data: {
        ...(refresh_token && { google_refresh_token: refresh_token }), // Only update if provided
        google_calendar_id: calendarId
      }
    });

    settingsUrl.searchParams.set('google_calendar', 'success');
    return NextResponse.redirect(settingsUrl);

  } catch (error) {
    console.error(error);
    settingsUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(settingsUrl);
  }
}
