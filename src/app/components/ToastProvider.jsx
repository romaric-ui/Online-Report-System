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
            className={`px-4 py-3 rounded shadow text-sm text-white flex items-start gap-2 animate-fade-in-down ${
              t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-700'
            }`}
            role="status"
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-white/80 hover:text-white text-xs mt-0.5"
              aria-label="Fermer"
            >×</button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes fade-in-down { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0);} }
        .animate-fade-in-down { animation: fade-in-down .25s ease; }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
