---
name: firebase-auth-pattern
description: Use when building or modifying any authentication flow, protected API routes, middleware, login/register pages, or anything involving Firebase ID tokens, Firebase Admin SDK, or user session management.
---

# Firebase Auth Pattern

## Use this skill when
- Creating or editing login / register pages
- Building any protected API route
- Writing auth middleware
- Handling token verification on the backend
- Managing user session or Zustand auth state

## Do NOT use this skill when
- Working on non-auth UI components
- Database schema changes unrelated to users table

---

## Core Rules — Never Violate These

1. **Token lives in memory only** — never store in localStorage, never in cookies
2. **Never write manual token refresh logic** — Firebase SDK handles it automatically
3. **Every protected API route must verify the Firebase ID token** via Admin SDK middleware
4. **Never build a custom auth system** — Firebase Auth is the sole auth layer
5. **On page reload**, Firebase SDK restores session via IndexedDB — do not fight this

---

## Frontend — Token Handling

```ts
// Get token fresh on every API call — do NOT cache it manually
const token = await auth.currentUser?.getIdToken();

const res = await fetch('/api/some-protected-route', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## Backend — Auth Middleware

Every protected API route must use this middleware:

```ts
// lib/authMiddleware.ts
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
  } catch {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}
```

Usage in any API route:

```ts
export async function GET(req: NextRequest) {
  const auth = await verifyToken(req);
  if ('error' in auth) return auth.error;
  // auth.uid is now available
}
```

---

## Registration Flow

1. User submits email/password or clicks Google OAuth
2. Firebase Auth creates account → returns ID token
3. Frontend calls `POST /api/users/init` with `Authorization: Bearer <token>`
4. Backend verifies token → creates user row in PostgreSQL:
   ```sql
   INSERT INTO users (id, email, display_name, timezone, created_at)
   VALUES (firebase_uid, email, display_name, 'UTC', NOW())
   ```
5. Return user profile → store in Zustand → redirect to `/dashboard`
6. If `/api/users/init` fails → call `firebase.signOut()` + show error: *"Account setup failed. Please try again."*

---

## Error Messages — Use Exactly These

| Scenario | Message |
|---|---|
| Wrong password | "Incorrect email or password" |
| Email already exists | "An account with this email already exists. Try logging in." |
| Google account conflict | "This email is linked to a password account. Please log in with email." |
| Network failure | "Could not connect. Please check your internet connection." |
| /api/users/init fails | "Account setup failed. Please try again." |

---

## Sign Out Flow

```ts
await signOut(auth);       // Firebase sign out
useAuthStore.getState().clearUser();  // Clear Zustand state
router.push('/login');     // Redirect
```

---

## Route Protection

All pages except `/login` and `/register` must redirect to `/login` if no valid Firebase session exists. Use a client-side auth guard or Next.js middleware.
