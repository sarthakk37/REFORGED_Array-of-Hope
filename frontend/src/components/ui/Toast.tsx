// Toast notification system providing lightweight alerts and status feedback.
// Hand-built with React Context without external toast libraries.

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/classNames';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center justify-between p-3.5 rounded-lg shadow-lg border text-sm font-medium transition-all duration-200 transform translate-y-0',
              t.type === 'success' && 'bg-forge-surface-elevated text-forge-green-light border-forge-green/40 shadow-green-glow',
              t.type === 'error' && 'bg-forge-surface-elevated text-forge-red-light border-forge-red/40 shadow-red-glow',
              t.type === 'info' && 'bg-forge-surface-elevated text-forge-cyan-light border-forge-cyan/40 shadow-cyan-glow',
              t.type === 'warning' && 'bg-forge-surface-elevated text-forge-amber-light border-forge-amber/40 shadow-amber-glow'
            )}
          >
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-3 text-gray-400 hover:text-white focus:outline-none"
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
