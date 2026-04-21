import { create } from 'zustand';
import { RecurrenceRule } from '@/lib/recurrence';
import { auth } from '@/lib/firebaseClient';
import { queueOfflineAction } from '@/lib/offlineSync';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'archived';
  due_date: string | null;
  due_time: string | null;
  reminder_at: string | null;
  recurrence_rule: RecurrenceRule | null;
  is_pinned: boolean;
  is_archived: boolean;
  category_id?: string | null;
  notes: string | null;
  subtasks?: { id: string; title: string; is_completed: boolean; created_at?: string }[];
}

interface TaskState {
  tasks: Task[];
  searchQuery: string;
  filterCategory: string | null;
  filterPriority: string | null;
  filterStatus: 'all' | 'active' | 'archived';
  sortBy: 'due_date' | 'priority' | 'created_at';
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (categoryId: string | null) => void;
  setFilterPriority: (priority: string | null) => void;
  setFilterStatus: (status: 'all' | 'active' | 'archived') => void;
  setSortBy: (sort: 'due_date' | 'priority' | 'created_at') => void;
  
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  
  fetchTasks: (page?: number) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  searchQuery: '',
  filterCategory: null,
  filterPriority: null,
  filterStatus: 'active',
  sortBy: 'due_date',
  isLoading: true,
  error: null,
  currentPage: 1,
  hasMore: true,
  isLoadingMore: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterCategory: (categoryId) => set({ filterCategory: categoryId }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSortBy: (sort) => set({ sortBy: sort }),

  fetchTasks: async (page = 1) => {
    set({ isLoading: page === 1, error: null });
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tasks?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      
      const tasks = data.data || data; // handle backward compatibility if API not updated yet
      const hasMore = data.meta ? data.meta.hasMore : false;

      set((state) => ({ 
        tasks: page === 1 ? tasks : [...state.tasks, ...tasks], 
        isLoading: false,
        currentPage: page,
        hasMore
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { currentPage, hasMore, isLoadingMore, fetchTasks } = get();
    if (!hasMore || isLoadingMore) return;
    
    set({ isLoadingMore: true });
    await fetchTasks(currentPage + 1);
    set({ isLoadingMore: false });
  },

  addTask: async (taskData) => {
    if (!navigator.onLine) throw new Error("No internet. Please reconnect to create new items.");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg });
      throw err;
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic update
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));

    if (!navigator.onLine) {
      if (updates.status) {
        await queueOfflineAction({
          type: updates.status === 'completed' ? 'COMPLETE_TASK' : 'UNCOMPLETE_TASK',
          payload: { taskId: id, status: updates.status }
        });
        return;
      }
      set({ tasks: previousTasks, error: "No internet. Cannot edit task." });
      throw new Error("No internet. Cannot edit task.");
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updatedTask = await res.json();
      // Replace with server version
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
      }));
    } catch (err: unknown) {
      // Revert on failure
      const msg = err instanceof Error ? err.message : String(err);
      set({ tasks: previousTasks, error: msg });
      throw err;
    }
  },

  deleteTask: async (id) => {
    if (!navigator.onLine) throw new Error("No internet. Cannot delete task.");
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ tasks: previousTasks, error: msg });
      throw err;
    }
  }
}));
