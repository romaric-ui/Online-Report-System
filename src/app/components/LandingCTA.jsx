"use client";
import { ArrowRight } from 'lucide-react';

export default function LandingCTA({ onGetStarted, isAuthenticated }) {
  return (
    <section className="py-24 bg-gradient-to-br from-indigo-600 to-indigo-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-300/50" />
          ))}
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
          {isAuthenticated
            ? "Prêt pour votre prochain chantier ?"
            : "Prêt à digitaliser vos chantiers ?"
          }
        </h2>

        <p className="text-indigo-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          {isAuthenticated
            ? "Accédez à votre dashboard pour piloter vos projets en temps réel."
            : "Rejoignez les professionnels du BTP qui gagnent du temps chaque jour."
          }
        </p>

        <button
          onClick={onGetStarted}
          className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-bold text-base hover:bg-indigo-50 transition-all duration-200 shadow-xl hover:scale-[1.03]"
        >
          {isAuthenticated ? "Accéder à mes chantiers" : "Créer mon compte gratuitement"}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-5 text-sm text-indigo-200">
          Configuration en 2 minutes. Sans carte bancaire.
        </p>
      </div>
    </section>
  );
}
