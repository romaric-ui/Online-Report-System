"use client";
import { Mail, Phone, MapPin } from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-12 mb-12">

          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">SGTEC</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Application de gestion de rapports de chantier. Créez, structurez
              et exportez vos comptes-rendus en PDF professionnel.
            </p>
            <div className="space-y-2.5">
              <a
                href="mailto:sgtec-gc@groupe-imo.com"
                className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                sgtec-gc@groupe-imo.com
              </a>
              <a
                href="tel:+33619996734"
                className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                +33 6 19 99 67 34
              </a>
              <div className="flex items-center gap-2.5 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Paris, France
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Fonctionnalités", href: "#features" },
                { label: "Comment ça marche", href: "#how-it-works" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-sm">
            © {currentYear} SGTEC — Société de Gestion des Travaux et Encadrement de Chantier
          </p>
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
        </div>
      </div>
    </footer>
  );
}
