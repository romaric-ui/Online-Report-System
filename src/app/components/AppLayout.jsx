'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-app-bg text-app-text">
      {/* Sidebar desktop */}
      <div className="hidden md:block fixed top-0 left-0 h-screen z-40">
        <AppSidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-app-overlay z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-screen z-50 md:hidden">
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="flex-1 md:ml-[250px] flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Barre mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-sb-bg border-b border-sb-border sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={sidebarOpen}
            className="w-10 h-10 -ml-2 rounded-sb flex items-center justify-center text-sb-muted hover:bg-sb-hover hover:text-sb-text transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="flex items-center gap-2 text-sb-text">
            <span aria-hidden="true" className="w-2.5 h-2.5 bg-sb-accent" />
            <span className="font-display font-bold text-display-md uppercase tracking-[0.06em]">PROJECTRA</span>
          </span>
        </div>

        <div className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}