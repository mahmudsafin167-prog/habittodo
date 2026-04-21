---
name: offline-sync-strategy
description: Use when implementing Service Worker, PWA offline support, IndexedDB queue, background sync, or handling conflict resolution between offline actions and server state.
---

# Offline Sync Strategy

## Use this skill when
- Writing or editing the Service Worker
- Implementing offline action queuing
- Building sync-on-reconnect logic
- Handling conflict resolution
- Implementing PWA caching strategy

---

## What Works Offline vs What Doesn't

### ✅ Works Offline — Must Support
- View Dashboard, Tasks, Habits (from cache)
- Mark a task complete or incomplete
- Mark a habit complete or skip for today
- All offline actions are queued in IndexedDB

### ❌ Does NOT Work Offline — Block in UI
- Creating a new task or habit → show: *"No internet. Please reconnect to create new items."*
- Editing task or habit details
- Deleting tasks or habits
- Analytics and Calendar pages
- Scheduling new reminders

---

## Offline Action Queue — IndexedDB Schema

```ts
type OfflineAction = {
  id: string;           // cuid
  type: 'COMPLETE_TASK' | 'UNCOMPLETE_TASK' | 'COMPLETE_HABIT' | 'SKIP_HABIT';
  payload: Record<string, unknown>;
  queued_at: number;    // Date.now()
  retries: number;
};
```

Store in IndexedDB under key `offline_queue` as an array, ordered by `queued_at`.

---

## Conflict Resolution Rules — Follow Exactly

### Rule 1 — Completion Wins
If user marks task/habit complete offline and it was modified on another device:
- Keep the `completed_at` from offline action
- Accept other field updates from server
- Merge: don't overwrite completion with server's non-completed state

### Rule 2 — Server Wins on Edits
Editing task/habit details offline is blocked in UI. If it somehow occurs, server version overwrites. Show toast: *"Some offline changes were overwritten by a newer version."*

### Rule 3 — Delete Beats Complete
If task was deleted on server and completed offline → deletion wins. Discard the completion silently.

### Rule 4 — Queue Order
Replay offline actions in the exact order they were queued (`queued_at` ascending). If a queued action fails (e.g. task deleted server-side), drop it silently and refresh UI from server state.

### Rule 5 — Sync on Reconnect
When `navigator.onLine` fires true, flush the full pending queue BEFORE fetching fresh server data.

---

## Sync Implementation

```ts
// hooks/useOfflineSync.ts
export function useOfflineSync() {
  useEffect(() => {
    const handleOnline = async () => {
      await flushOfflineQueue();   // Step 1: flush queue
      await refreshAppData();       // Step 2: fetch fresh server state
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}

async function flushOfflineQueue() {
  const queue = await getOfflineQueue(); // read from IndexedDB
  const sorted = queue.sort((a, b) => a.queued_at - b.queued_at);

  for (const action of sorted) {
    try {
      await replayAction(action);
      await removeFromQueue(action.id);
    } catch (err) {
      // Rule 4: drop failed actions silently
      await removeFromQueue(action.id);
    }
  }
}
```

---

## Service Worker — Caching Strategy

Cache these routes for offline viewing:
- `/` (Dashboard)
- `/tasks`
- `/habits`
- Static assets (JS, CSS, fonts, icons)

Do NOT cache:
- `/analytics`
- `/calendar`
- `/api/*` — always network-first for API calls

```js
// sw.js — Cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});
```

---

## UI — Offline Indicators

- Show a subtle banner when `navigator.onLine === false`: *"You're offline. Some features are unavailable."*
- Disable create/edit/delete buttons with tooltip: *"No internet. Please reconnect to create new items."*
- Do NOT disable complete/skip buttons — these queue offline
- Show a sync indicator when reconnecting and flushing queue
