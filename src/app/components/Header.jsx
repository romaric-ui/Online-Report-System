"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Header({ user, onLogout, onShowAuth }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
      
      {/* Icône utilisateur permanente */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={(user || session?.user) ? `${user?.prenom || session?.user?.prenom || session?.user?.name} ${user?.nom || session?.user?.nom}` : "Se connecter"}
        >
          {(user || session?.user) ? (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.prenom?.charAt(0) || session?.user?.prenom?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}
              {user?.nom?.charAt(0) || session?.user?.nom?.charAt(0) || session?.user?.name?.split(' ').pop()?.charAt(0) || ''}
            </div>
          ) : (
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>

        {/* Menu déroulant */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
            <div className="py-1">
              {(user || session?.user) ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">
                      {user?.prenom || session?.user?.prenom || session?.user?.name?.split(' ')[0] || ''} {user?.nom || session?.user?.nom || session?.user?.name?.split(' ').pop() || ''}
                    </div>
                    <div className="text-gray-500">{user?.email || session?.user?.email}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-blue-600 capitalize">{user?.role || 'Utilisateur'}</div>
                      {session?.user?.isGoogleUser && (
                        <div className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          <svg width="12" height="12" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (session?.user) {
                        signOut({ callbackUrl: '/' });
                      } else {
                        onLogout();
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Se déconnecter
                    </div>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onShowAuth();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Se connecter
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu mobile caché - gardé pour compatibilité */}
      <nav className={`flex-col md:flex md:flex-row md:items-center gap-3 ${open ? 'flex' : 'hidden'} md:hidden absolute top-full left-0 w-full bg-white p-4 shadow z-20`}>
        {/* Contenu mobile si nécessaire */}
      </nav>
    </header>
  );
}
