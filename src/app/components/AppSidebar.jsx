'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, Wrench,
  UserPlus, LogOut, Settings, CreditCard, Plus,
  FileText, Eye, Zap, Download, Upload,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const isActive = (pathname, href) => {
  const exactRoutes = ['/dashboard-projet', '/dashboard-projet/equipe', '/abonnement', '/parametres', '/dashboard'];
  if (exactRoutes.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
};

// Liens regroupés par usage ; les couleurs viennent des tokens --sb-* (globals.css)
const ADMIN_GROUPS = [
  { title: 'Suivi', links: [
    { label: 'Mes projets',   icon: LayoutDashboard, href: '/dashboard-projet' },
    { label: 'Mes chantiers', icon: Building2,       href: '/chantiers', addHref: '/chantiers/nouveau' },
  ] },
  { title: 'Ressources', links: [
    { label: 'Ouvriers', icon: Users,  href: '/equipes' },
    { label: 'Matériel', icon: Wrench, href: '/materiel' },
  ] },
  { title: 'Fichiers', links: [
    { label: 'Export',        icon: Download, href: '/export' },
    { label: 'Import tâches', icon: Upload,   href: '/import-taches' },
  ] },
  { title: 'Compte', links: [
    { label: 'Mon équipe',         icon: UserPlus,   href: '/dashboard-projet/equipe' },
    { label: "Gérer l'abonnement", icon: CreditCard, href: '/abonnement' },
    { label: 'Paramètres',         icon: Settings,   href: '/parametres' },
  ] },
];

const USER_GROUPS = [
  { title: 'Suivi', links: [
    { label: 'Mes projets',   icon: LayoutDashboard, href: '/dashboard-projet' },
    { label: 'Mes chantiers', icon: Building2,       href: '/chantiers', addHref: '/chantiers/nouveau' },
  ] },
  { title: 'Ressources', links: [
    { label: 'Ouvriers', icon: Users,  href: '/equipes' },
    { label: 'Matériel', icon: Wrench, href: '/materiel' },
  ] },
  { title: 'Fichiers', links: [
    { label: 'Export',        icon: Download, href: '/export' },
    { label: 'Import tâches', icon: Upload,   href: '/import-taches' },
  ] },
];

const PARTICULIER_GROUPS = [
  { title: 'Inspections', links: [
    { label: 'Mes rapports',        icon: FileText, href: '/dashboard' },
    { label: 'Nouvelle inspection', icon: Plus,     href: '/reports/new' },
    { label: 'Voir la démo',        icon: Eye,      href: '/demo' },
  ] },
  { title: 'Compte', links: [
    { label: 'Paramètres', icon: Settings, href: '/parametres' },
  ] },
];

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sb-accent';

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
  const groups = isParticulier ? PARTICULIER_GROUPS : isAdmin ? ADMIN_GROUPS : USER_GROUPS;

  const goToProfil = () => {
    if (onNavigate) onNavigate();
    router.push('/profil');
  };

  return (
    <aside className="w-sb h-dvh flex flex-col bg-sb-bg border-r border-sb-border font-ui text-sb-text">
      {/* Marque */}
      <div className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-sb-border">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="w-2.5 h-2.5 bg-sb-accent" />
          <span className="font-display font-bold text-display-md uppercase tracking-[0.06em]">SGTEC</span>
        </span>
        <ThemeToggle
          className={`w-8 h-8 rounded-sb flex items-center justify-center shrink-0 border border-transparent hover:bg-sb-hover hover:border-sb-border transition-colors motion-reduce:transition-none ${focusRing}`}
        />
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pt-5 pb-1.5 font-display font-semibold text-ui-xs uppercase tracking-[0.14em] text-sb-muted">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={`${link.href}-${link.label}`} className="group/nav relative">
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-3 h-sb-item pl-4 ${link.addHref ? 'pr-10' : 'pr-3'} rounded-sb border text-ui-base transition-colors duration-150 motion-reduce:transition-none ${focusRing} ${
                        active
                          ? 'bg-sb-active border-sb-border text-sb-text font-semibold'
                          : 'border-transparent text-sb-muted font-medium hover:bg-sb-hover hover:text-sb-text'
                      }`}
                    >
                      {active && (
                        <span aria-hidden="true" className="sb-hazard absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-sm" />
                      )}
                      <link.icon
                        className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-sb-accent' : 'text-sb-faint group-hover/nav:text-sb-muted'}`}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      <span className="flex-1 truncate">{link.label}</span>
                    </Link>
                    {link.addHref && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigate) onNavigate();
                          router.push(link.addHref);
                        }}
                        aria-label="Nouveau chantier"
                        title="Nouveau chantier"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-sb flex items-center justify-center border border-sb-border bg-sb-bg text-sb-muted hover:bg-sb-accent hover:border-sb-accent hover:text-sb-on-accent transition motion-reduce:transition-none ${focusRing} ${
                          active ? 'opacity-100' : 'opacity-0 group-hover/nav:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Offre Pro pour les particuliers */}
        {isParticulier && (
          <div className="mt-6 mx-1 p-3 rounded-sb border border-sb-border bg-sb-active">
            <p className="font-display font-bold text-[15px] uppercase tracking-[0.06em]">Passer au Pro</p>
            <p className="mt-1 text-ui-sm text-sb-muted">Rapports illimités et personnalisation.</p>
            <button
              type="button"
              onClick={() => router.push('/abonnement-particulier')}
              className={`mt-3 w-full h-9 rounded-sb bg-sb-accent text-sb-on-accent text-ui-sm font-semibold flex items-center justify-center gap-1.5 hover:brightness-95 transition motion-reduce:transition-none ${focusRing}`}
            >
              <Zap className="w-3.5 h-3.5" /> S&apos;abonner · 9 €/mois
            </button>
          </div>
        )}
      </nav>

      {/* Profil + déconnexion */}
      <div className="shrink-0 border-t border-sb-border p-2 space-y-0.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToProfil}
            className={`flex-1 min-w-0 flex items-center gap-3 p-2 rounded-sb text-left hover:bg-sb-hover transition-colors motion-reduce:transition-none ${focusRing}`}
            title="Modifier mon profil"
          >
            <span className="w-8 h-8 shrink-0 rounded-sb overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-sb-avatar text-white font-display font-bold text-[15px] tracking-wide">
                  {initials}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-ui-base font-semibold truncate">{displayName}</span>
              <span className="block font-data text-ui-xs text-sb-muted truncate">
                {isParticulier ? 'Compte particulier' : displayEmail}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={goToProfil}
            aria-label="Mon profil"
            title="Mon profil"
            className={`w-8 h-8 shrink-0 rounded-sb flex items-center justify-center text-sb-faint hover:text-sb-text hover:bg-sb-hover transition-colors motion-reduce:transition-none ${focusRing}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className={`w-full flex items-center gap-3 h-sb-item pl-4 pr-3 rounded-sb text-ui-base font-medium text-sb-muted hover:text-sb-danger hover:bg-sb-danger-bg transition-colors motion-reduce:transition-none ${focusRing}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
