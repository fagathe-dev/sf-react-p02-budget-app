// frontend/src/ui/components/Feedback/Toast/useToast.ts
import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);

  return {
    toast: addToast,
    success: (message: string, title?: string) =>
      addToast({ message, title, variant: 'success' }),
    error: (message: string, title?: string) =>
      addToast({ message, title, variant: 'danger' }),
    warning: (message: string, title?: string) =>
      addToast({ message, title, variant: 'warning' }),
    info: (message: string, title?: string) =>
      addToast({ message, title, variant: 'info' }),
    dismiss: removeToast,
  };
};