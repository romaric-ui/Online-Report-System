'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Wrench,
  UserPlus, LogOut, Settings, CreditCard, Plus,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

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
    { label: "Gérer l'abonnement",  icon: CreditCard,      href: '/abonnement' },
  ];

  const userLinks = [
    { label: 'Mes projets',   icon: LayoutDashboard, href: '/dashboard-projet' },
    { label: 'Mes chantiers', icon: Building2,       href: '/chantiers', addHref: '/chantiers/nouveau' },
    { label: 'Ouvriers',      icon: Users,           href: '/equipes' },
    { label: 'Matériel',      icon: Wrench,          href: '/materiel' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const goToProfil = () => {
    if (onNavigate) onNavigate();
    router.push('/profil');
  };

  return (
    <aside
      className="w-[250px] h-screen flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        boxShadow: '4px 0 16px var(--shadow-dark)',
      }}
    >
      {/* Profil utilisateur */}
      <div
        className="p-4 flex items-center justify-between gap-2"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
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
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{displayName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{displayEmail}</p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <a
            href="/profil"
            className="p-1.5 rounded-lg transition hover:opacity-70 shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            title="Paramètres du profil"
            onClick={onNavigate}
          >
            <Settings className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <div key={`${link.href}-${link.label}`} className="group/nav relative mb-1">
              <a
                href={link.href}
                onClick={onNavigate}
                className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
                style={active ? {
                  background: 'var(--bg-base)',
                  color: 'var(--color-primary)',
                  boxShadow: 'var(--shadow-neu-pressed)',
                } : {
                  color: 'var(--color-text-secondary)',
                }}
              >
                <link.icon
                  className="w-5 h-5 shrink-0"
                  style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                />
                <span className="flex-1">{link.label}</span>
                {link.addHref && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onNavigate) onNavigate();
                      router.push(link.addHref);
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/nav:opacity-100 transition-opacity"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
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
      <div className="p-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 w-full hover:opacity-80"
          style={{ color: 'var(--color-danger)' }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
