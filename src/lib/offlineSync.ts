import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type ActionType = 'COMPLETE_TASK' | 'UNCOMPLETE_TASK' | 'COMPLETE_HABIT' | 'SKIP_HABIT';

export interface OfflineAction {
  id: string;
  type: ActionType;
  payload: {
    taskId?: string;
    habitId?: string;
    status?: string;
    date?: string;
    notes?: string;
  };
  queued_at: number;
  retries: number;
}

interface ProductivityDB extends DBSchema {
  offline_queue: {
    key: string;
    value: OfflineAction;
  };
}

let dbPromise: Promise<IDBPDatabase<ProductivityDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<ProductivityDB>('productivity-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id' });
      }
    },
  });
}

export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'queued_at' | 'retries'>) {
  if (!dbPromise) return;
  const db = await dbPromise;
  
  const fullAction: OfflineAction = {
    ...action,
    id: crypto.randomUUID(),
    queued_at: Date.now(),
    retries: 0,
  };
  
  await db.add('offline_queue', fullAction);
  return fullAction;
}

export async function getOfflineQueue() {
  if (!dbPromise) return [];
  const db = await dbPromise;
  const all = await db.getAll('offline_queue');
  return all.sort((a, b) => a.queued_at - b.queued_at);
}

export async function removeOfflineAction(id: string) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('offline_queue', id);
}

export async function replayAction(action: OfflineAction, token: string) {
  switch (action.type) {
    case 'COMPLETE_TASK':
    case 'UNCOMPLETE_TASK': {
      const { taskId, status } = action.payload;
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`Failed to replay ${action.type}`);
      break;
    }
    case 'COMPLETE_HABIT':
    case 'SKIP_HABIT': {
      const { habitId, status, date } = action.payload;
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, date })
      });
      if (!res.ok) throw new Error(`Failed to replay ${action.type}`);
      break;
    }
    default:
      console.warn('Unknown offline action type:', action.type);
  }
}
