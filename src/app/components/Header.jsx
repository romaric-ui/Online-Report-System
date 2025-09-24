"use client";
import { useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="app-header">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded border border-gray-300 text-gray-600 focus:outline-none focus:ring"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          <span className="sr-only">Menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/logo_couleur.png" alt="Logo" className="logo rounded-md shrink-0" />
        <div className="truncate">
          <h1 className="text-xl md:text-2xl font-bold leading-tight">Suivi Chantier</h1>
          <div className="text-xs md:text-sm muted">Gestion des rapports et contrôles</div>
        </div>
      </div>
      <nav className={`flex-col md:flex md:flex-row md:items-center gap-3 ${open ? 'flex' : 'hidden'} md:static absolute top-full left-0 w-full md:w-auto bg-white md:bg-transparent p-4 md:p-0 shadow md:shadow-none z-20`}></nav>
    </header>
  );
}
