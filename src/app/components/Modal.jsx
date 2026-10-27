'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes modal-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes modal-slide {
          from { opacity:0; transform:translateY(24px) scale(0.96) }
          to   { opacity:1; transform:translateY(0)    scale(1)    }
        }
        .modal-overlay { animation: modal-fade  0.18s ease both }
        .modal-panel   { animation: modal-slide 0.22s ease both }
        @media (prefers-reduced-motion: reduce) {
          .modal-overlay, .modal-panel { animation: none }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-app-overlay" />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          className={`modal-panel relative w-full ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} bg-app-surface text-app-text rounded-t-2xl sm:rounded-2xl border border-app-border flex flex-col max-h-[92dvh]`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-app-border shrink-0">
              <h2 className="text-lg font-semibold tracking-[-0.01em] text-app-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-2 text-app-faint hover:bg-app-hover hover:text-app-text transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
