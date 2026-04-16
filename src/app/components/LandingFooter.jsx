"use client";
import { Mail, Phone, MapPin } from 'lucide-react';

const columns = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGU", href: "#" },
      { label: "Politique de confidentialité", href: "#" },
      { label: "Mentions légales", href: "#" },
    ],
  },
];

const socials = [
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
];

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">

          {/* Brand — takes 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">S</span>
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">SGTEC</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              La plateforme tout-en-un pour piloter vos chantiers BTP. Suivi, équipes, budget, planning et sécurité — depuis n'importe où.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 mb-6">
              <a href="mailto:sgtec-gc@groupe-imo.com"
                 className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                sgtec-gc@groupe-imo.com
              </a>
              <a href="tel:+33619996734"
                 className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                +33 6 19 99 67 34
              </a>
              <div className="flex items-center gap-2.5 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                Cotonou, Bénin · Paris, France
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-sm">
            © {currentYear} SGTEC — L'œil du bâtiment. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-gray-600 text-xs">
              Développé par{" "}
              <a
                href="https://github.com/romaric-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Romaric Adekou
              </a>
            </p>
            <a
              href="/admin-login"
              className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
            >
              Vous êtes administrateur ?
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
