import { useEffect, useState } from 'react';
import { getOfflineQueue, removeOfflineAction, replayAction } from '@/lib/offlineSync';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { auth } from '@/lib/firebaseClient';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { fetchTasks } = useTaskStore();
  const { fetchHabits } = useHabitStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSyncingAlready = false;

    const handleOnline = async () => {
      setIsOnline(true);
      if (isSyncingAlready) return;
      isSyncingAlready = true;
      setIsSyncing(true);

      try {
        const queue = await getOfflineQueue();
        if (queue.length > 0) {
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            for (const action of queue) {
              try {
                await replayAction(action, token);
                await removeOfflineAction(action.id);
              } catch (err) {
                console.error('Failed to replay action, dropping:', action, err);
                await removeOfflineAction(action.id);
              }
            }
          }
        }
      } finally {
        await Promise.all([fetchTasks(), fetchHabits()]);
        setIsSyncing(false);
        isSyncingAlready = false;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
       handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchTasks, fetchHabits]);

  return { isOnline, isSyncing };
}
