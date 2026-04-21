import { create } from 'zustand';
import { auth } from '@/lib/firebaseClient';

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'task' | 'habit' | 'both';
}

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (cat: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: true,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No user");
      
      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      set({ categories: data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  addCategory: async (categoryData) => {
    if (!navigator.onLine) throw new Error("No internet. Cannot create categories offline.");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(categoryData)
      });
      if (!res.ok) throw new Error('Failed to create category');
      const newCat = await res.json();
      set((state) => ({ categories: [...state.categories, newCat].sort((a,b) => a.name.localeCompare(b.name)) }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg });
      throw err;
    }
  },

  updateCategory: async (id, updates) => {
    if (!navigator.onLine) throw new Error("No internet.");
    const previous = get().categories;
    set((state) => ({
      categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update category');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ categories: previous, error: msg });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    if (!navigator.onLine) throw new Error("No internet.");
    const previous = get().categories;
    set((state) => ({
      categories: state.categories.filter(c => c.id !== id)
    }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete category');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ categories: previous, error: msg });
      throw err;
    }
  }
}));
