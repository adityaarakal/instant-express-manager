import { create } from 'zustand';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  duration?: number; // in milliseconds, default 4000
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastState = {
  toasts: Toast[];
  showToast: (message: string, severity?: ToastSeverity, duration?: number, action?: Toast['action']) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, severity = 'info', duration = 4000, action) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: Toast = {
      id,
      message,
      severity,
      duration,
      action,
    };
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  showSuccess: (message, duration) => {
    useToastStore.getState().showToast(message, 'success', duration);
  },
  showError: (message, duration) => {
    useToastStore.getState().showToast(message, 'error', duration);
  },
  showWarning: (message, duration) => {
    useToastStore.getState().showToast(message, 'warning', duration);
  },
  showInfo: (message, duration) => {
    useToastStore.getState().showToast(message, 'info', duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAll: () => {
    set({ toasts: [] });
  },
}));

