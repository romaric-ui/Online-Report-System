"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Star, Crown } from 'lucide-react';

const PLANS = [
  {
    slug:        'essentiel',
    nom:         'Essentiel',
    prix_mensuel: 29,
    prix_annuel:  290,
    icon:        Zap,
    description: 'Parfait pour démarrer votre digitalisation.',
    max_utilisateurs: '1 utilisateur',
    max_chantiers:    '2 chantiers actifs',
    stockage:         '2 Go de stockage',
    features: [
      'Chantiers & journal de chantier',
      'Photos de chantier',
      'Tâches & suivi d\'avancement',
      'Rapports PDF',
      'Documents',
    ],
    highlight: false,
    badge: null,
    cta: 'Commencer l\'essai gratuit',
  },
  {
    slug:        'pro',
    nom:         'Pro',
    prix_mensuel: 79,
    prix_annuel:  790,
    icon:        Star,
    description: 'Pour les équipes qui gèrent plusieurs chantiers.',
    max_utilisateurs: '5 utilisateurs',
    max_chantiers:    '15 chantiers actifs',
    stockage:         '10 Go de stockage',
    features: [
      'Tout le plan Essentiel inclus',
      'Équipes & gestion des ouvriers',
      'Pointage & présences',
      'Matériel & équipements',
      'Budget & dépenses',
      'Chat d\'équipe',
      'Invitations membres',
    ],
    highlight: true,
    badge: 'Populaire',
    cta: 'Commencer l\'essai gratuit',
  },
  {
    slug:        'enterprise',
    nom:         'Enterprise',
    prix_mensuel: null,
    prix_annuel:  null,
    icon:        Crown,
    description: 'Pour les grandes structures avec des besoins spécifiques.',
    max_utilisateurs: 'Utilisateurs illimités',
    max_chantiers:    'Chantiers illimités',
    stockage:         '100 Go de stockage',
    features: [
      'Tout le plan Pro inclus',
      'Gantt & chemin critique',
      'Module HSE complet',
      'API dédiée',
      'Support prioritaire 24/7',
    ],
    highlight: false,
    badge: null,
    cta: 'Nous contacter',
  },
];

export default function LandingPricing({ onGetStarted }) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);

  const handleCta = (plan) => {
    if (plan.cta === 'Nous contacter') {
      window.location.href = 'mailto:contact@sgtec.fr?subject=Plan Enterprise';
      return;
    }
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/inscription');
    }
  };

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            Tarifs
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Des offres adaptées à{' '}
            <span className="text-indigo-600">votre activité</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Essai gratuit de 7 jours sur tous les plans. Sans carte bancaire.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annuel
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                2 mois offerts
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const prix = annual ? plan.prix_annuel : plan.prix_mensuel;

            return (
              <div
                key={plan.slug}
                className={`relative rounded-3xl p-8 flex flex-col border transition-all duration-200 ${
                  plan.highlight
                    ? 'border-indigo-500 shadow-2xl shadow-indigo-100/50 bg-white scale-[1.02]'
                    : 'border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${plan.highlight ? 'text-indigo-600' : 'text-gray-500'}`} />
                  <h3 className="text-xl font-bold text-gray-900">{plan.nom}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                {/* Prix */}
                <div className="mb-2">
                  {prix !== null ? (
                    <div>
                      {annual && plan.prix_mensuel && (
                        <span className="text-sm text-gray-400 line-through mr-2">{plan.prix_mensuel * 12} €</span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">{prix}</span>
                        <span className="text-sm text-gray-400 ml-1">€ / {annual ? 'an' : 'mois'}</span>
                      </div>
                      {annual && (
                        <p className="text-xs text-emerald-600 mt-1 font-semibold">
                          Soit {Math.round(prix / 12)} €/mois — 2 mois offerts
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-gray-900">Sur devis</span>
                  )}
                </div>

                {/* Limites */}
                <div className="flex flex-wrap gap-1.5 mb-6 mt-3">
                  {[plan.max_utilisateurs, plan.max_chantiers, plan.stockage].map((l, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">{l}</span>
                  ))}
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
                  onClick={() => handleCta(plan)}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:scale-[1.01]'
                      : plan.cta === 'Nous contacter'
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

        <p className="mt-10 text-center text-sm text-gray-400">
          Essai gratuit de 7 jours sur tous les plans. Carte bancaire requise à l'activation.
        </p>
      </div>
    </section>
  );
}
