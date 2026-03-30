"use client";
import { ArrowRight, FileText } from 'lucide-react';

export default function LandingCTA({ onGetStarted, isAuthenticated }) {
  return (
    <section className="py-24 bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-7 border border-white/10">
          <FileText className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
          {isAuthenticated
            ? "Prêt à créer votre prochain rapport ?"
            : "Essayez par vous-même"
          }
        </h2>

        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          {isAuthenticated
            ? "Retournez sur votre tableau de bord pour créer, modifier ou télécharger vos rapports."
            : "Créez un compte gratuit, remplissez votre premier rapport et générez votre PDF en quelques minutes."
          }
        </p>

        <button
          onClick={onGetStarted}
          className="group inline-flex items-center gap-2 px-7 py-3.5 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg"
        >
          {isAuthenticated ? "Accéder à mes rapports" : "Créer un compte gratuit"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="mt-5 text-sm text-gray-600">
          Inscription gratuite · Aucune carte bancaire demandée
        </p>
      </div>
    </section>
  );
}
