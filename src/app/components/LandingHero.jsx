"use client";
import { ArrowRight, FileText, Shield, ClipboardCheck } from 'lucide-react';

export default function LandingHero({ onGetStarted, isAuthenticated }) {
  return (
    <section className="bg-white pt-16 pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
              <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Outil de suivi de chantier
              </span>
            </div>

            <h1 className="text-5xl lg:text-[3.75rem] font-bold text-gray-900 leading-[1.1] tracking-tight">
              Vos rapports de chantier,{" "}
              <span className="text-blue-600">simplifiés</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
              Créez vos comptes-rendus en ligne, structurez vos données et générez
              des PDF professionnels prêts à envoyer au client — en quelques minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-200"
              >
                {isAuthenticated ? "Accéder à mes rapports" : "Commencer gratuitement"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Comment ça marche
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100">
              {[
                { icon: Shield, color: "bg-green-100 text-green-600", label: "Inscription gratuite" },
                { icon: FileText, color: "bg-blue-100 text-blue-600", label: "PDF en un clic" },
                { icon: ClipboardCheck, color: "bg-purple-100 text-purple-600", label: "Structure standardisée" },
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup */}
          <div className="relative lg:pl-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
              {/* Topbar */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Rapport de chantier</p>
                    <p className="text-xs text-gray-400">Phase : Fondations</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                  Complété
                </span>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">
                <div className="space-y-1">
                  {[
                    ["Client", "ACME Construction"],
                    ["Localisation", "Paris 15e"],
                    ["Chef de chantier", "J. Dupont"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[["3", "Équipe"], ["5", "Matériels"], ["1", "Incident"]].map(([num, label]) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">{num}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <button className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold cursor-default">
                  Générer le PDF
                </button>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-4 bg-white rounded-xl border border-gray-100 shadow-lg p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Rapport validé</p>
                <p className="text-xs text-gray-400">il y a 2 minutes</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
