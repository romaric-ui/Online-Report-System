"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User, LogOut, LogIn, FileText, BarChart3, Settings } from 'lucide-react';

export default function Header({ user, onLogout, onShowAuth }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Effet de scroll pour le header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-white/80 backdrop-blur-sm shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo et titre */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
              onClick={() => setOpen(o => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                <img 
                  src="/logo_couleur.png" 
                  alt="Logo" 
                  className="relative h-10 md:h-12 w-auto rounded-lg shadow-md" 
                />
              </div>
              
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                  Online Report System
                </h1>
                <p className="text-xs md:text-sm text-gray-600">
                  Gestion de rapports professionnelle
                </p>
              </div>
            </div>
          </div>

          {/* Navigation centrale (desktop uniquement) */}
          <nav className="hidden lg:flex items-center gap-1 mx-8">
            <a 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Accueil
            </a>
            {(user || session?.user) && (
              <>
                <a 
                  href="#" 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  Rapports
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4" />
                  Statistiques
                </a>
              </>
            )}
          </nav>

          {/* Actions utilisateur */}
          <div className="flex items-center gap-3">
            {!(user || session?.user) && (
              <button
                onClick={onShowAuth}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
            )}

            {/* Menu utilisateur moderne */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="group relative flex items-center gap-3 focus:outline-none"
                title={(user || session?.user) ? `${user?.prenom || session?.user?.prenom || session?.user?.name} ${user?.nom || session?.user?.nom}` : "Se connecter"}
              >
                {(user || session?.user) ? (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200">
                    <div className="hidden md:block text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {user?.prenom || session?.user?.prenom || session?.user?.name?.split(' ')[0] || ''} {user?.nom || session?.user?.nom || session?.user?.name?.split(' ').pop() || ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.role || 'Utilisateur'}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                      <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white">
                        {user?.prenom?.charAt(0) || session?.user?.prenom?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}
                        {user?.nom?.charAt(0) || session?.user?.nom?.charAt(0) || session?.user?.name?.split(' ').pop()?.charAt(0) || ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sm:hidden w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </button>

              {/* Menu déroulant moderne */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 animate-fade-in-up">
                  {(user || session?.user) ? (
                    <>
                      {/* En-tête du profil */}
                      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-base font-bold shadow-lg">
                              {user?.prenom?.charAt(0) || session?.user?.prenom?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}
                              {user?.nom?.charAt(0) || session?.user?.nom?.charAt(0) || session?.user?.name?.split(' ').pop()?.charAt(0) || ''}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {user?.prenom || session?.user?.prenom || session?.user?.name?.split(' ')[0] || ''} {user?.nom || session?.user?.nom || session?.user?.name?.split(' ').pop() || ''}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {user?.email || session?.user?.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                {user?.role || 'Utilisateur'}
                              </span>
                              {session?.user?.isGoogleUser && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  <svg width="10" height="10" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                  </svg>
                                  Google
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions du menu */}
                      <div className="py-2">
                        <a
                          href="#"
                          className="flex items-center gap-3 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <User className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="font-medium">Mon profil</span>
                        </a>
                        <a
                          href="#"
                          className="flex items-center gap-3 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        >
                          <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="font-medium">Paramètres</span>
                        </a>
                      </div>

                      {/* Déconnexion */}
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            if (session?.user) {
                              signOut({ callbackUrl: '/' });
                            } else {
                              onLogout();
                            }
                          }}
                          className="flex items-center gap-3 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full group"
                        >
                          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          <span className="font-medium">Se déconnecter</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onShowAuth();
                        }}
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <LogIn className="w-4 h-4" />
                        Se connecter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile moderne */}
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-2">
            <a 
              href="/" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Accueil
            </a>
            {(user || session?.user) && (
              <>
                <a 
                  href="#" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <FileText className="w-5 h-5" />
                  Rapports
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <BarChart3 className="w-5 h-5" />
                  Statistiques
                </a>
              </>
            )}
            {!(user || session?.user) && (
              <button
                onClick={() => {
                  setOpen(false);
                  onShowAuth();
                }}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-sm shadow-lg"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
