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
      `}</style>

      {/* Overlay */}
      <div
        className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        {/* Panel */}
        <div
          className={`modal-panel relative w-full ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92dvh]`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-slate-100 transition text-slate-400 hover:text-slate-700"
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
