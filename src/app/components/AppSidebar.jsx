'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Wrench,
  UserPlus, LogOut, Settings, CreditCard, Plus,
} from 'lucide-react';

const isActive = (pathname, href) => {
  const exactMatch = ['/dashboard-projet', '/dashboard-projet/equipe', '/abonnement'];
  if (exactMatch.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
};

export default function AppSidebar({ onNavigate }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = session?.user?.roleEntreprise === 1;

  const prenom = session?.user?.prenom || session?.user?.name?.split(' ')[0] || '';
  const nom = session?.user?.nom || session?.user?.name?.split(' ').slice(1).join(' ') || '';
  const displayName = `${prenom} ${nom}`.trim() || 'Utilisateur';
  const displayEmail = session?.user?.email || '';
  const initials = [prenom[0], nom[0]].filter(Boolean).join('').toUpperCase() || 'U';
  const [avatarOverride, setAvatarOverride] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('userAvatarUrl');
    if (stored) setAvatarOverride(stored);
    const handler = (e) => setAvatarOverride(e.detail);
    window.addEventListener('avatarUpdated', handler);
    return () => window.removeEventListener('avatarUpdated', handler);
  }, []);

  const photoUrl = avatarOverride || session?.user?.photoUrl || null;

  const adminLinks = [
    { label: 'Mes projets',         icon: LayoutDashboard, href: '/dashboard-projet' },
    { label: 'Mes chantiers',       icon: Building2,       href: '/chantiers', addHref: '/chantiers/nouveau' },
    { label: 'Ouvriers',            icon: Users,           href: '/equipes' },
    { label: 'Matériel',            icon: Wrench,          href: '/materiel' },
    { label: 'Mon équipe',          icon: UserPlus,        href: '/dashboard-projet/equipe' },
    { label: 'Gérer l\'abonnement', icon: CreditCard,      href: '/abonnement' },
  ];

  const userLinks = [
    { label: 'Mes projets',  icon: LayoutDashboard, href: '/dashboard-projet' },
    { label: 'Mes chantiers',icon: Building2,       href: '/chantiers', addHref: '/chantiers/nouveau' },
    { label: 'Ouvriers',     icon: Users,           href: '/equipes' },
    { label: 'Matériel',     icon: Wrench,          href: '/materiel' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const goToProfil = () => {
    if (onNavigate) onNavigate();
    router.push('/profil');
  };

  return (
    <aside className="w-[250px] h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Profil utilisateur */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goToProfil}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition text-left"
          title="Modifier mon profil"
        >
          <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
          </div>
        </button>
        <a
          href="/profil"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition shrink-0"
          title="Paramètres du profil"
          onClick={onNavigate}
        >
          <Settings className="w-4 h-4" />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <div key={`${link.href}-${link.label}`} className="group/nav relative mb-0.5">
              <a
                href={link.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border-l-4 ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                }`}
              >
                <link.icon
                  className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`}
                />
                <span className="flex-1">{link.label}</span>
                {link.addHref && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onNavigate) onNavigate(); router.push(link.addHref); }}
                    className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-indigo-200"
                    title="Nouveau chantier"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </a>
            </div>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
