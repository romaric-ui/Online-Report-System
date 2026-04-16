"use client";
import { useState } from 'react';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Essentiel",
    monthlyPrice: 15000,
    description: "Parfait pour démarrer votre digitalisation.",
    features: [
      "1 utilisateur",
      "3 chantiers actifs",
      "Rapports PDF",
      "Journal de chantier",
      "Photos de chantier",
    ],
    cta: "Commencer",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    monthlyPrice: 45000,
    description: "Pour les équipes qui gèrent plusieurs chantiers.",
    features: [
      "2 utilisateurs",
      "25 chantiers actifs",
      "Tout Essentiel inclus",
      "Équipes & pointage",
      "Matériel",
      "Budget & dépenses",
      "Documents",
      "Chat d'équipe",
    ],
    cta: "Commencer",
    highlight: true,
    badge: "Populaire",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    description: "Pour les grandes structures avec des besoins spécifiques.",
    features: [
      "Utilisateurs illimités",
      "Chantiers illimités",
      "Tout Pro inclus",
      "Gantt & chemin critique",
      "HSE & sécurité",
      "API dédiée",
      "Support prioritaire",
    ],
    cta: "Nous contacter",
    highlight: false,
    badge: null,
  },
];

function formatPrice(price, annual) {
  if (!price) return null;
  const p = annual ? Math.round(price * 0.8) : price;
  return p.toLocaleString('fr-FR');
}

export default function LandingPricing({ onGetStarted }) {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            Tarifs
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Des offres adaptées à{" "}
            <span className="text-indigo-600">votre activité</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Essai gratuit de 14 jours sur tous les plans. Sans carte bancaire.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !annual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annuel
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const price = formatPrice(plan.monthlyPrice, annual);
            return (
              <div
                key={index}
                className={`relative rounded-3xl p-8 flex flex-col border transition-all duration-200 ${
                  plan.highlight
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-100/50 bg-white scale-[1.02]'
                    : 'border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Name & desc */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">{price}</span>
                      <span className="text-sm text-gray-400 ml-1">FCFA / mois</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-extrabold text-gray-900">Sur devis</span>
                    </div>
                  )}
                  {annual && price && (
                    <p className="text-xs text-emerald-600 mt-1 font-semibold">
                      Économisez 20% avec la facturation annuelle
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlight ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? 'text-indigo-600' : 'text-gray-500'}`} />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={plan.cta === "Commencer" ? onGetStarted : undefined}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:scale-[1.01]'
                      : plan.cta === "Nous contacter"
                        ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-sm text-gray-400">
          Essai gratuit de 14 jours sur tous les plans. Sans carte bancaire.
        </p>
      </div>
    </section>
  );
}
