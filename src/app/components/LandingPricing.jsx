"use client";
import { Check, Zap, Star, Crown } from 'lucide-react';

export default function LandingPricing({ onGetStarted, isAuthenticated }) {
  const plans = [
    {
      name: "Gratuit",
      icon: Zap,
      price: "0",
      period: "mois",
      description: "Parfait pour commencer",
      features: [
        "5 rapports par mois",
        "Export PDF basique",
        "Stockage 100 MB",
        "Support par email",
        "1 utilisateur"
      ],
      buttonText: "Commencer gratuitement",
      buttonStyle: "bg-gray-600 hover:bg-gray-700",
      popular: false
    },
    {
      name: "Pro",
      icon: Star,
      price: "29",
      period: "mois",
      description: "Pour les professionnels",
      features: [
        "Rapports illimités",
        "Export PDF personnalisé",
        "Stockage 10 GB",
        "Support prioritaire 24/7",
        "5 utilisateurs",
        "API access",
        "Branding personnalisé"
      ],
      buttonText: "Essai gratuit 14 jours",
      buttonStyle: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
      popular: true
    },
    {
      name: "Entreprise",
      icon: Crown,
      price: "99",
      period: "mois",
      description: "Pour les grandes équipes",
      features: [
        "Tout du plan Pro",
        "Utilisateurs illimités",
        "Stockage illimité",
        "Support dédié",
        "Formation personnalisée",
        "SLA garanti 99.9%",
        "Intégrations avancées",
        "Gestionnaire de compte dédié"
      ],
      buttonText: "Contacter les ventes",
      buttonStyle: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-4">
            <Check className="w-4 h-4 mr-2 text-green-600" />
            <span className="text-sm font-semibold text-green-600">Tarifs</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre formule
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Des tarifs simples et transparents pour tous vos besoins
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in-up ${
                  plan.popular ? 'ring-4 ring-blue-500 scale-105 md:scale-110' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Le plus populaire
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex w-16 h-16 items-center justify-center rounded-2xl mb-4 ${
                    plan.popular 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}€</span>
                    <span className="text-gray-600">/ {plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={onGetStarted}
                  className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 ${plan.buttonStyle}`}
                >
                  {isAuthenticated ? "Accéder à mon espace" : plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Toutes les formules incluent une garantie satisfait ou remboursé de 30 jours
          </p>
          <p className="text-sm text-gray-500">
            TVA non incluse • Facturation mensuelle ou annuelle • Annulation à tout moment
          </p>
        </div>
      </div>
    </section>
  );
}
