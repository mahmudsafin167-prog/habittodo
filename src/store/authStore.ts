import { create } from 'zustand';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone?: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  clearUser: () => set({ user: null }),
}));
