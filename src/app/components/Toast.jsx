// Composant de notification toast
'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Attendre la fin de l'animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const tone = type === 'success' ? 'bg-app-success' : type === 'error' ? 'bg-app-danger' : 'bg-app-faint';
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 overflow-hidden rounded-lg border border-app-border bg-app-surface text-app-text pl-0 pr-2 py-0 transition-opacity duration-300 motion-reduce:transition-none ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <span aria-hidden="true" className={`self-stretch w-1 ${tone}`} />
      <Icon aria-hidden="true" className="w-5 h-5 shrink-0 text-app-muted" />
      <span className="py-3 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        aria-label="Fermer"
        className="ml-1 rounded p-1 text-app-faint hover:text-app-text hover:bg-app-hover"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}