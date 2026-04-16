"use client";
import { ArrowRight, Play } from 'lucide-react';

export default function LandingHero({ onGetStarted, isAuthenticated }) {
  return (
    <section className="bg-white pt-20 pb-28 overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .hero-title    { animation: fadeInUp .7s ease both; }
        .hero-sub      { animation: fadeInUp .7s .15s ease both; }
        .hero-btns     { animation: fadeInUp .7s .3s ease both; }
        .hero-stats    { animation: fadeInUp .7s .45s ease both; }
        .hero-mockup   { animation: fadeIn .9s .2s ease both; }
        .hero-float    { animation: floatY 4s ease-in-out infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left ── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="hero-title inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                Plateforme SaaS BTP
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
              Pilotez vos chantiers.{" "}
              <span className="text-indigo-600">Maîtrisez</span>{" "}
              vos projets.
            </h1>

            {/* Subtitle */}
            <p className="hero-sub text-lg text-gray-500 leading-relaxed max-w-lg">
              La plateforme tout-en-un pour les professionnels du BTP. Suivi en temps réel,
              gestion d'équipes, budget, planning et sécurité — depuis votre bureau ou le terrain.
            </p>

            {/* Buttons */}
            <div className="hero-btns flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 px-7 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-200 hover:scale-[1.02]"
              >
                {isAuthenticated ? "Accéder au dashboard" : "Démarrer gratuitement"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                Voir la démo
              </button>
            </div>

            {/* Mini stats */}
            <div className="hero-stats flex flex-wrap gap-8 pt-4 border-t border-gray-100">
              {[
                { value: "500+", label: "chantiers gérés" },
                { value: "2 000+", label: "rapports générés" },
                { value: "98%", label: "de satisfaction" },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-2xl font-extrabold text-indigo-600">{value}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — CSS dashboard illustration ── */}
          <div className="hidden lg:block relative hero-mockup">
            <div className="hero-float">
              {/* Main card */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
                {/* Topbar */}
                <div className="px-5 py-3.5 bg-indigo-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-300" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-100">Dashboard SGTEC</span>
                  <div className="w-6 h-6 rounded-full bg-white/20" />
                </div>

                <div className="p-5 space-y-4 bg-gray-50">
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Chantiers actifs", value: "12", color: "bg-indigo-500", light: "bg-indigo-50" },
                      { label: "Budget consommé", value: "68%", color: "bg-emerald-500", light: "bg-emerald-50" },
                      { label: "Incidents HSE", value: "2", color: "bg-amber-500", light: "bg-amber-50" },
                    ].map(({ label, value, color, light }) => (
                      <div key={label} className={`${light} rounded-2xl p-3 border border-white`}>
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className={`text-2xl font-extrabold ${color.replace('bg-', 'text-')}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Gantt-like bar */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Planning semaine</p>
                    <div className="space-y-2">
                      {[
                        { label: "Fondations", w: "w-3/4", color: "bg-indigo-500" },
                        { label: "Gros œuvre", w: "w-1/2", color: "bg-indigo-300" },
                        { label: "Charpente",  w: "w-1/4", color: "bg-emerald-400" },
                      ].map(({ label, w, color }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${w} ${color} rounded-full`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team + activity row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Équipe présente</p>
                      <div className="flex -space-x-2">
                        {["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"].map((c, i) => (
                          <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                            {["K", "A", "M", "+"][i]}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">14 ouvriers</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Sécurité HSE</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full w-11/12 bg-emerald-500 rounded-full" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600">94%</span>
                      </div>
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">Conforme</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge — rapport validé */}
            <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl border border-gray-100 shadow-xl px-4 py-3 flex items-center gap-3 animate-none">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-base">✓</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Rapport PDF généré</p>
                <p className="text-xs text-gray-400">il y a 3 minutes</p>
              </div>
            </div>

            {/* Floating badge — alerte */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl border border-gray-100 shadow-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-base">⚡</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Alerte budget</p>
                <p className="text-xs text-gray-400">Chantier A — 90%</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
