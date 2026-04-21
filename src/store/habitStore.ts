import { create } from 'zustand';
import { RecurrenceRule } from '@/lib/recurrence';
import { auth } from '@/lib/firebaseClient';
import { queueOfflineAction } from '@/lib/offlineSync';

export interface Habit {
  id: string;
  title: string;
  goal: string | null;
  notes: string | null;
  category_id: string | null;
  reminder_time: string | null;
  recurrence_rule: RecurrenceRule | null;
  status: 'active' | 'paused' | 'archived';
  target_days: number | null;
  streak_summary: {
    current_streak: number;
    longest_streak: number;
    last_completed_date: string | null;
  } | null;
}

interface HabitState {
  habits: Habit[];
  searchQuery: string;
  filterCategory: string | null;
  filterStatus: 'all' | 'active' | 'paused' | 'archived';
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (categoryId: string | null) => void;
  setFilterStatus: (status: 'all' | 'active' | 'paused' | 'archived') => void;
  
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;

  fetchHabits: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  logHabit: (id: string, status: 'completed' | 'skipped' | 'missed', date: string, notes?: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  searchQuery: '',
  filterCategory: null,
  filterStatus: 'active',
  isLoading: true,
  error: null,
  currentPage: 1,
  hasMore: true,
  isLoadingMore: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterCategory: (categoryId) => set({ filterCategory: categoryId }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  fetchHabits: async (page = 1) => {
    set({ isLoading: page === 1, error: null });
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/habits?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      
      const habits = data.data || data;
      const hasMore = data.meta ? data.meta.hasMore : false;

      set((state) => ({ 
        habits: page === 1 ? habits : [...state.habits, ...habits], 
        isLoading: false,
        currentPage: page,
        hasMore
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { currentPage, hasMore, isLoadingMore, fetchHabits } = get();
    if (!hasMore || isLoadingMore) return;
    
    set({ isLoadingMore: true });
    await fetchHabits(currentPage + 1);
    set({ isLoadingMore: false });
  },

  addHabit: async (habitData) => {
    if (!navigator.onLine) throw new Error("No internet. Please reconnect to create new items.");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(habitData)
      });
      if (!res.ok) throw new Error('Failed to create habit');
      const newHabit = await res.json();
      set((state) => ({ habits: [newHabit, ...state.habits] }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg });
      throw err;
    }
  },

  updateHabit: async (id, updates) => {
    if (!navigator.onLine) throw new Error("No internet. Cannot edit habit.");
    const previous = get().habits;
    set((state) => ({
      habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
    }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update habit');
      const updated = await res.json();
      set((state) => ({
        habits: state.habits.map(h => h.id === id ? { ...h, ...updated } : h)
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ habits: previous, error: msg });
      throw err;
    }
  },

  deleteHabit: async (id) => {
    if (!navigator.onLine) throw new Error("No internet. Cannot delete habit.");
    const previous = get().habits;
    set((state) => ({
      habits: state.habits.filter(h => h.id !== id)
    }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete habit');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ habits: previous, error: msg });
      throw err;
    }
  },

  logHabit: async (id, status, date, notes) => {
    const previous = get().habits;
    
    // Optimistic UI
    set((state) => ({
      habits: state.habits.map(h => {
        if (h.id === id) {
          const currentStreak = h.streak_summary?.current_streak || 0;
          const longestStreak = h.streak_summary?.longest_streak || 0;
          const newCurrent = status === 'completed' ? currentStreak + 1 : Math.max(0, currentStreak - 1);
          return {
            ...h,
            streak_summary: {
              current_streak: newCurrent,
              longest_streak: Math.max(longestStreak, newCurrent),
              last_completed_date: status === 'completed' ? date : null
            }
          };
        }
        return h;
      })
    }));

    if (!navigator.onLine) {
      await queueOfflineAction({
        type: status === 'completed' ? 'COMPLETE_HABIT' : 'SKIP_HABIT',
        payload: { habitId: id, status, date, notes }
      });
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/habits/${id}/log`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status, date, notes })
      });
      if (!res.ok) throw new Error('Failed to log habit');
      
      const { streakSummary } = await res.json();
      
      // Update the local habit's streak_summary with real backend data
      set((state) => ({
        habits: state.habits.map(h => 
          h.id === id 
            ? { ...h, streak_summary: streakSummary } 
            : h
        )
      }));
    } catch (err: unknown) {
      // Revert on error
      const msg = err instanceof Error ? err.message : String(err);
      set({ habits: previous, error: msg });
      throw err;
    }
  }
}));
