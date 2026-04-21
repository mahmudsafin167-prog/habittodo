import { create } from 'zustand';

interface UIState {
  isQuickAddOpen: boolean;
  setQuickAddOpen: (isOpen: boolean) => void;
  toggleQuickAdd: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isQuickAddOpen: false,
  setQuickAddOpen: (isOpen) => set({ isQuickAddOpen: isOpen }),
  toggleQuickAdd: () => set((state) => ({ isQuickAddOpen: !state.isQuickAddOpen })),
}));
