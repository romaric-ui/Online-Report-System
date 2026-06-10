'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, Wrench,
  UserPlus, LogOut, Settings, CreditCard, Plus,
  FileText, Eye, Zap,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const isActive = (pathname, href) => {
  const exactRoutes = ['/dashboard-projet', '/dashboard-projet/equipe', '/abonnement', '/parametres', '/dashboard'];
  if (exactRoutes.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
};

// Couleurs Archireport-style : chaque lien a sa couleur d'icône + fond actif pastel
const ADMIN_LINKS = [
  { label: 'Mes projets',         icon: LayoutDashboard, href: '/dashboard-projet',       color: '#F97316', bg: 'rgba(249,115,22,0.10)' },
  { label: 'Mes chantiers',       icon: Building2,       href: '/chantiers',               color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', addHref: '/chantiers/nouveau' },
  { label: 'Ouvriers',            icon: Users,           href: '/equipes',                 color: '#22C55E', bg: 'rgba(34,197,94,0.10)'  },
  { label: 'Matériel',            icon: Wrench,          href: '/materiel',                color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  { label: 'Mon équipe',          icon: UserPlus,        href: '/dashboard-projet/equipe', color: '#A855F7', bg: 'rgba(168,85,247,0.10)' },
  { label: "Gérer l'abonnement",  icon: CreditCard,      href: '/abonnement',              color: '#EC4899', bg: 'rgba(236,72,153,0.10)' },
  { label: 'Paramètres',          icon: Settings,        href: '/parametres',              color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
];

const USER_LINKS = [
  { label: 'Mes projets',   icon: LayoutDashboard, href: '/dashboard-projet', color: '#F97316', bg: 'rgba(249,115,22,0.10)' },
  { label: 'Mes chantiers', icon: Building2,       href: '/chantiers',        color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', addHref: '/chantiers/nouveau' },
  { label: 'Ouvriers',      icon: Users,           href: '/equipes',          color: '#22C55E', bg: 'rgba(34,197,94,0.10)'  },
  { label: 'Matériel',      icon: Wrench,          href: '/materiel',         color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
];

const PARTICULIER_LINKS = [
  { label: 'Mes rapports',        icon: FileText, href: '/dashboard',   color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  { label: 'Nouvelle inspection', icon: Plus,     href: '/reports/new', color: '#22C55E', bg: 'rgba(34,197,94,0.10)'  },
  { label: 'Voir la démo',        icon: Eye,      href: '/demo',        color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  { label: 'Paramètres',          icon: Settings, href: '/parametres',  color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
];

export default function AppSidebar({ onNavigate }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = session?.user?.roleEntreprise === 1;
  const isParticulier = !session?.user?.entrepriseId;

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
  const links = isParticulier ? PARTICULIER_LINKS : isAdmin ? ADMIN_LINKS : USER_LINKS;

  const goToProfil = () => {
    if (onNavigate) onNavigate();
    router.push('/profil');
  };

  return (
    <aside
      className="w-[250px] h-screen flex flex-col"
      style={{ background: '#FFFFFF', borderRight: '1px solid #F0F0F0' }}
    >
      {/* Profil */}
      <div className="px-4 py-4 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid #F0F0F0' }}>
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
              <div
                className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #F97316, #1E3A5F)' }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-gray-800">{displayName}</p>
            <p className="text-xs truncate text-gray-400">
              {isParticulier ? 'Compte particulier' : displayEmail}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={goToProfil}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition"
            title="Paramètres"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <div key={`${link.href}-${link.label}`} className="group/nav relative">
              <Link
                href={link.href}
                onClick={onNavigate}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={active ? {
                  background: link.bg,
                  color: link.color,
                } : {
                  color: '#4B5563',
                }}
              >
                <link.icon
                  className="w-5 h-5 shrink-0"
                  style={{ color: active ? link.color : link.color, opacity: active ? 1 : 0.7 }}
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
                    style={{ background: link.color, color: 'white' }}
                    title="Nouveau chantier"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </Link>
            </div>
          );
        })}

        {/* CTA upgrade particulier */}
        {isParticulier && (
          <div
            className="mt-4 p-3 rounded-xl"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
          >
            <p className="text-xs font-semibold mb-1 text-gray-800">Passez au Pro</p>
            <p className="text-xs mb-2 text-gray-400">Rapports illimités + personnalisation</p>
            <button
              onClick={() => router.push('/abonnement-particulier')}
              className="w-full py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1 transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F97316, #ea6500)' }}
            >
              <Zap className="w-3 h-3" /> 9€/mois
            </button>
          </div>
        )}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #F0F0F0' }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 w-full hover:bg-red-50"
          style={{ color: '#EF4444' }}
        >
          <LogOut className="w-5 h-5 shrink-0" style={{ color: '#EF4444' }} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}