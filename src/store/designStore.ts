import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DesignMode = 'classic' | 'glass';

interface DesignState {
  designMode: DesignMode;
  setDesignMode: (mode: DesignMode) => void;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      designMode: 'classic', // Default is classic
      setDesignMode: (mode) => set({ designMode: mode }),
    }),
    {
      name: 'productivity-design-storage',
    }
  )
);
