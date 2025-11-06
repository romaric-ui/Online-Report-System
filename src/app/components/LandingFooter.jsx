"use client";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Témoignages", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
      { label: "Documentation", href: "#docs" }
    ],
    company: [
      { label: "À propos", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Carrières", href: "#careers" },
      { label: "Contact", href: "#contact" }
    ],
    legal: [
      { label: "Confidentialité", href: "#privacy" },
      { label: "Conditions", href: "#terms" },
      { label: "Cookies", href: "#cookies" },
      { label: "Mentions légales", href: "#legal" }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-blue-600" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-sky-500" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:bg-blue-700" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:bg-pink-600" }
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Online Report System
            </h3>
            <p className="text-blue-200 mb-6 leading-relaxed">
              La solution complète pour gérer vos rapports de construction en ligne. 
              Simplifiez votre travail et gagnez en productivité.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-blue-200">
                <Mail className="w-4 h-4" />
                <span className="text-sm">sgtec-gc@groupe-imo.com</span>
              </div>
              <div className="flex items-center gap-3 text-blue-200">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+33 6 19 99 67 34</span>
              </div>
              <div className="flex items-center gap-3 text-blue-200">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Paris, France</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Produit</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-blue-200 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-blue-800/50 pt-8 mb-8">
          <div className="max-w-md">
            <h4 className="font-semibold text-lg mb-3">Restez informé</h4>
            <p className="text-blue-200 text-sm mb-4">
              Recevez nos dernières actualités et mises à jour
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-semibold transition-all duration-200">
                S'abonner
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-blue-300 text-sm">
            © {currentYear} Online Report System. Tous droits réservés.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 ${social.color} transition-all duration-200 hover:scale-110 transform`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}