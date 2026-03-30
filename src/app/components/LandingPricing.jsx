"use client";
import { Check, Zap, Star, Crown, Clock } from 'lucide-react';

export default function LandingPricing({ onGetStarted, isAuthenticated }) {
  const plans = [
    {
      name: "Gratuit",
      icon: Zap,
      price: "0",
      description: "Pour découvrir et utiliser l'application",
      features: [
        "Rapports illimités",
        "Export PDF professionnel",
        "Photos de couverture",
        "Tableau de bord personnel",
        "Connexion Google ou email",
      ],
      cta: isAuthenticated ? "Accéder à mes rapports" : "Commencer gratuitement",
      available: true,
      highlight: true,
    },
    {
      name: "Pro",
      icon: Star,
      price: null,
      description: "Bientôt disponible",
      features: [
        "Toutes les fonctionnalités gratuites",
        "Modèles de rapports personnalisés",
        "Logo de l'entreprise sur les PDF",
        "Export en lot",
        "Archivage avancé",
      ],
      cta: "Bientôt disponible",
      available: false,
      highlight: false,
    },
    {
      name: "Entreprise",
      icon: Crown,
      price: null,
      description: "Bientôt disponible",
      features: [
        "Tout du plan Pro",
        "Multi-utilisateurs",
        "Gestion des rôles avancée",
        "Support prioritaire",
        "Facturation mensuelle",
      ],
      cta: "Bientôt disponible",
      available: false,
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Tarifs
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Gratuit pour commencer
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            L'application est pleinement fonctionnelle et gratuite. Des formules avancées
            arrivent prochainement.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`rounded-2xl p-8 border flex flex-col transition-all duration-200 ${
                  plan.highlight
                    ? 'border-blue-600 shadow-xl shadow-blue-100/40 bg-white'
                    : 'border-gray-200 bg-gray-50/50 opacity-70'
                }`}
              >
                {/* Badge */}
                <div className="mb-5 h-6">
                  {plan.highlight && (
                    <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      Disponible maintenant
                    </span>
                  )}
                  {!plan.available && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      Prochainement
                    </span>
                  )}
                </div>

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.available ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>

                <p className="text-sm text-gray-400 mb-5">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                      <span className="text-sm text-gray-400">/ mois</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-gray-200">—</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.available ? 'text-blue-600' : 'text-gray-300'
                      }`} />
                      <span className={`text-sm ${
                        plan.available ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={plan.available ? onGetStarted : undefined}
                  disabled={!plan.available}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.available
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-400">
          Les formules Pro et Entreprise sont en développement. L'offre gratuite est sans limitation de durée.
        </p>
      </div>
    </section>
  );
}
