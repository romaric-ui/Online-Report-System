"use client";
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(t => t.filter(to => to.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++idSeq;
    const ttl = toast.ttl ?? 4000;
    setToasts(t => [...t, { id, ...toast }]);
    if (ttl > 0) {
      setTimeout(() => remove(id), ttl);
    }
  }, [remove]);

  const api = {
    success: (msg, opts={}) => push({ type: 'success', message: msg, ...opts }),
    error: (msg, opts={}) => push({ type: 'error', message: msg, ...opts }),
    info: (msg, opts={}) => push({ type: 'info', message: msg, ...opts }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-stretch gap-3 overflow-hidden rounded-lg border border-app-border bg-app-surface text-app-text text-sm animate-fade-in-down"
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <span
              aria-hidden="true"
              className={`w-1 shrink-0 ${
                t.type === 'success' ? 'bg-app-success' : t.type === 'error' ? 'bg-app-danger' : 'bg-app-faint'
              }`}
            />
            <span className="flex-1 py-3">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="self-start mt-2 mr-2 rounded px-1.5 text-base leading-6 text-app-faint hover:text-app-text hover:bg-app-hover"
              aria-label="Fermer"
            >×</button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes fade-in-down { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0);} }
        .animate-fade-in-down { animation: fade-in-down .25s ease; }
        @media (prefers-reduced-motion: reduce) { .animate-fade-in-down { animation: none; } }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
