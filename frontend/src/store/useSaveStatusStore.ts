import { create } from 'zustand';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type SaveStatusState = {
  status: SaveStatus;
  lastSaved: Date | null;
  setSaving: () => void;
  setSaved: () => void;
  setError: () => void;
  reset: () => void;
};

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: 'idle',
  lastSaved: null,
  setSaving: () => {
    set({ status: 'saving' });
  },
  setSaved: () => {
    const now = new Date();
    set({ status: 'saved', lastSaved: now });
    // Auto-reset to idle after 3 seconds
    setTimeout(() => {
      set((state) => {
        // Only reset if still in saved state (user might have triggered another save)
        if (state.status === 'saved') {
          return { status: 'idle' };
        }
        return state;
      });
    }, 3000);
  },
  setError: () => {
    set({ status: 'error' });
    // Auto-reset to idle after 5 seconds
    setTimeout(() => {
      set((state) => {
        if (state.status === 'error') {
          return { status: 'idle' };
        }
        return state;
      });
    }, 5000);
  },
  reset: () => {
    set({ status: 'idle' });
  },
}));

