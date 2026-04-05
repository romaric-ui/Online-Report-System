"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, LogOut, LogIn, FileText, ChevronDown, MapPin, Users, Wrench, LayoutDashboard } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Header({ user, onLogout, onShowAuth }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  const isLoggedIn = !!(user || session?.user);
  const displayName = user?.prenom || session?.user?.prenom || session?.user?.name?.split(' ')[0] || '';
  const displayLastName = user?.nom || session?.user?.nom || session?.user?.name?.split(' ').pop() || '';
  const displayEmail = user?.email || session?.user?.email || '';
  const initials = `${displayName.charAt(0)}${displayLastName.charAt(0)}`.toUpperCase() || 'U';

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Liens de navigation landing page
  const navLinks = [
    { label: 'Comment ça marche', anchor: 'how-it-works' },
    { label: 'Fonctionnalités', anchor: 'features' },
    { label: 'FAQ', anchor: 'faq' },
  ];
  
  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo_couleur.png" 
              alt="SGTEC" 
              className="h-9 w-auto rounded-lg shadow-sm group-hover:shadow-md transition-shadow" 
            />
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
              SGTEC
            </span>
          </a>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {isLoggedIn ? (
              <>
                <a
                  href={session?.user?.role === 'admin' ? '/dashboard-projet' : '/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {session?.user?.role === 'admin' ? 'Mon projet' : 'Mes rapports'}
                </a>
                <a
                  href="/chantiers"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  Chantiers
                </a>
                <a
                  href="/equipes"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Équipes
                </a>
                <a
                  href="/materiel"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  Matériel
                </a>
              </>
            ) : (
              navLinks.map((link) => (
                <button
                  key={link.anchor}
                  onClick={() => scrollTo(link.anchor)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  {link.label}
                </button>
              ))
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn && <NotificationCenter />}

            {isLoggedIn ? (
              /* Menu utilisateur */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{displayName}</span>
                  <ChevronDown className={`hidden md:block w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden">
                    {/* Profil */}
                    <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{displayName} {displayLastName}</p>
                          <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Liens dashboard */}
                    <div className="py-1">
                      <a
                        href={session?.user?.role === 'admin' ? '/dashboard-projet' : '/dashboard'}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        <span>{session?.user?.role === 'admin' ? 'Mon projet' : 'Mes rapports'}</span>
                      </a>
                      {session?.user?.role === 'admin' && (
                        <a
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>Mes rapports</span>
                        </a>
                      )}
                    </div>

                    {/* Déconnexion */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (session?.user) {
                            signOut({ callbackUrl: '/' });
                          } else {
                            onLogout();
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
            )}

            {/* Bouton mobile */}
            <button
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setOpen(o => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {isLoggedIn ? (
              <>
                <a
                  href={session?.user?.role === 'admin' ? '/dashboard-projet' : '/dashboard'}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  {session?.user?.role === 'admin' ? 'Mon projet' : 'Mes rapports'}
                </a>
                <a
                  href="/chantiers"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <MapPin className="w-5 h-5" />
                  Chantiers
                </a>
                <a
                  href="/equipes"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Users className="w-5 h-5" />
                  Équipes
                </a>
                <a
                  href="/materiel"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Wrench className="w-5 h-5" />
                  Matériel
                </a>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <button
                    key={link.anchor}
                    onClick={() => scrollTo(link.anchor)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => { setOpen(false); onShowAuth(); }}
                  className="flex items-center justify-center gap-2 w-full mt-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold text-sm shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
