'use client';
import { Mail, Phone, MapPin } from 'lucide-react';

const columns = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Tarifs',         href: '#pricing' },
      { label: 'FAQ',            href: '#faq' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '#' },
      { label: 'Contact',  href: '#' },
      { label: 'Blog',     href: '#' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'CGU',                          href: '#' },
      { label: 'Politique de confidentialité', href: '#' },
      { label: 'Mentions légales',             href: '#' },
    ],
  },
];

const socials = [
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'Twitter / X',
    href: '#',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
];

const linkClass = 'lk-focus rounded text-[15px] text-craie-2 hover:text-craie transition-colors';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#080B0E] text-craie border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Marque */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="w-3 h-3 bg-orange-vif" />
              <span className="font-display font-bold text-2xl uppercase tracking-[0.06em]">PROJECTRA</span>
            </div>
            <p className="mt-5 text-base leading-relaxed max-w-sm text-craie-2">
              La plateforme pour piloter vos chantiers BTP : suivi, équipes, budget, planning et sécurité, où que vous soyez.
            </p>

            <ul className="mt-8 space-y-3">
              <li>
                <a href="mailto:sgtec-gc@groupe-imo.com" className={`${linkClass} inline-flex items-center gap-3`}>
                  <Mail className="w-4 h-4 shrink-0 text-orange-vif" />
                  sgtec-gc@groupe-imo.com
                </a>
              </li>
              <li>
                <a href="tel:+33619996734" className={`${linkClass} inline-flex items-center gap-3`}>
                  <Phone className="w-4 h-4 shrink-0 text-orange-vif" />
                  +33 6 19 99 67 34
                </a>
              </li>
              <li className="flex items-center gap-3 text-[15px] text-craie-2">
                <MapPin className="w-4 h-4 shrink-0 text-orange-vif" />
                Cotonou, Bénin · Paris, France
              </li>
            </ul>

            <div className="mt-8 flex items-center gap-2">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="lk-focus w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-craie-2 hover:bg-orange-vif hover:border-orange-vif hover:text-nuit transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Colonnes */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="font-data text-[13px] uppercase tracking-[0.14em] text-craie-3">{col.title}</h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={linkClass}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 pt-8 flex flex-col md:flex-row justify-between md:items-center gap-4 border-t border-white/[0.08]">
          <p className="text-sm text-craie-3">
            © {currentYear} PROJECTRA. Tous droits réservés.
          </p>
          <a href="/admin-login" className="lk-focus rounded text-sm text-craie-3 hover:text-craie transition-colors">
            Vous êtes administrateur ?
          </a>
        </div>
      </div>
    </footer>
  );
}
