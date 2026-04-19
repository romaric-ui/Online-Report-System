'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop — fixe */}
      <div className="hidden md:block fixed top-0 left-0 h-screen z-40">
        <AppSidebar />
      </div>

      {/* Sidebar mobile — overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 h-screen z-50 md:hidden">
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="flex-1 md:ml-[250px] flex flex-col min-h-screen">
        {/* Barre mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900">SGTEC</span>
        </div>

        {children}
      </div>
    </div>
  );
}
