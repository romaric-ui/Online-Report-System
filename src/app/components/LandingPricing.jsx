"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Users, Crown } from "lucide-react";

const PLANS = [
  {
    slug: "essentiel",
    nom: "Essentiel",
    prix_mensuel: 29.99,
    prix_annuel: 299,
    icon: Zap,
    description: "Parfait pour démarrer votre digitalisation BTP.",
    max_utilisateurs: "1 utilisateur",
    max_chantiers: "5 chantiers actifs",
    features: [
      "Chantiers & journal de chantier",
      "Photos de chantier",
      "Tâches & suivi d'avancement",
      "Rapports PDF",
      "Documents",
    ],
    highlight: false,
    badge: null,
    cta: "Commencer l'essai gratuit",
  },
  {
    slug: "team",
    nom: "Team",
    prix_mensuel: 100,
    prix_annuel: 1000,
    icon: Users,
    description: "Pour les équipes qui gèrent plusieurs chantiers.",
    max_utilisateurs: "5 utilisateurs",
    max_chantiers: "15 chantiers actifs",
    features: [
      "Tout le plan Essentiel inclus",
      "Équipes & gestion des ouvriers",
      "Pointage & présences",
      "Matériel & équipements",
      "Budget & dépenses",
      "Chat d'équipe",
      "Invitations membres",
      "Collaborez jusqu'à 5 utilisateurs sur vos chantiers.",
    ],
    highlight: true,
    badge: "Populaire",
    cta: "Commencer l'essai gratuit",
  },
  {
    slug: "enterprise",
    nom: "Enterprise",
    prix_mensuel: null,
    prix_annuel: null,
    icon: Crown,
    description: "Pour les grandes structures avec des besoins spécifiques.",
    max_utilisateurs: "Utilisateurs illimités",
    max_chantiers: "Chantiers illimités",
    features: [
      "Tout le plan Team inclus",
      "Gantt & chemin critique",
      "Module HSE complet",
      "API dédiée",
      "Support prioritaire 24/7",
      "Onboarding personnalisé",
      "Collaborez jusqu'à 5 utilisateurs sur vos chantiers.",
    ],
    highlight: false,
    badge: null,
    cta: "Nous contacter",
  },
];

// Pack collaboratif Team uniquement
const PACK_COLLAB = [
  "Tableau de bord chef de projet",
  "Rapport hebdo automatique",
  "Notifications temps réel",
  "Gestion des rôles & permissions",
  "Historique complet des actions",
  "Invitez jusqu'à 5 collaborateurs sur vos projets",
];

// Contenu commun à tous les plans
const COMMUN = [
  "Accès web & mobile",
  "SSL & sécurité des données",
  "Mises à jour incluses",
  "Support par email",
];

export default function LandingPricing({ onGetStarted }) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);

  const handleCta = (plan) => {
    if (plan.cta === "Nous contacter") {
      window.location.href =
        "mailto:contact@projectra.com?subject=Plan Enterprise PROJECTRA";
      return;
    }
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push("/inscription");
    }
  };

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#F97316" }}
          >
            Tarifs
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Des offres adaptées à{" "}
            <span style={{ color: "#F97316" }}>votre activité</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Essai gratuit de 7 jours sur tous les plans.
          </p>

          {/* Toggle mensuel/annuel */}
          <div className="mt-8 inline-flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !annual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
                    ? "shadow-2xl bg-white scale-[1.02]"
                    : "border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1"
                }`}
                style={
                  plan.highlight
                    ? {
                        border: "2px solid #F97316",
                        boxShadow: "0 20px 60px rgba(249,115,22,0.15)",
                      }
                    : {}
                }
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md"
                      style={{ background: "#F97316" }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <Icon
                    className="w-5 h-5"
                    style={{ color: plan.highlight ? "#F97316" : "#6B7280" }}
                  />
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.nom}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                {/* Prix */}
                <div className="mb-2">
                  {prix !== null ? (
                    <div>
                      {annual && plan.prix_mensuel && (
                        <span className="text-sm text-gray-400 line-through mr-2">
                          {(plan.prix_mensuel * 12).toFixed(0)} €
                        </span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          {typeof prix === "number" && !Number.isInteger(prix)
                            ? prix.toFixed(2)
                            : prix}
                        </span>
                        <span className="text-sm text-gray-400 ml-1">
                          € / {annual ? "an" : "mois"}
                        </span>
                      </div>
                      {annual && (
                        <p className="text-xs text-emerald-600 mt-1 font-semibold">
                          Soit {Math.round(prix / 12)} €/mois — 2 mois offerts
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-gray-900">
                      Sur devis
                    </span>
                  )}
                </div>

                {/* Limites */}
                <div className="flex flex-wrap gap-1.5 mb-6 mt-3">
                  {[plan.max_utilisateurs, plan.max_chantiers].map(
                    (limite, i) => (
                      <span
                        key={i}
                        className="text-xs rounded-full px-2.5 py-1 font-medium"
                        style={{
                          background: plan.highlight
                            ? "rgba(249,115,22,0.08)"
                            : "#F3F4F6",
                          color: plan.highlight ? "#F97316" : "#4B5563",
                        }}
                      >
                        {limite}
                      </span>
                    ),
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: plan.highlight
                            ? "rgba(249,115,22,0.12)"
                            : "#F3F4F6",
                        }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{
                            color: plan.highlight ? "#F97316" : "#6B7280",
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCta(plan)}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200"
                  style={
                    plan.highlight
                      ? {
                          background:
                            "linear-gradient(135deg, #F97316, #ea6500)",
                          color: "white",
                          boxShadow: "0 8px 24px rgba(249,115,22,0.3)",
                        }
                      : plan.cta === "Nous contacter"
                        ? {
                            background: "white",
                            border: "2px solid #E5E7EB",
                            color: "#374151",
                          }
                        : {
                            background: "#1E3A5F",
                            color: "white",
                          }
                  }
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Section : Toutes les offres contiennent */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-center text-lg font-bold text-gray-900 mb-6">
            Toutes les offres contiennent
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COMMUN.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <Check
                  className="w-4 h-4 shrink-0"
                  style={{ color: "#F97316" }}
                />
                <span className="text-sm text-gray-700 font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section : Pack collaboratif Team */}
        <div
          className="mt-10 max-w-3xl mx-auto rounded-2xl p-6 border"
          style={{
            background: "rgba(249,115,22,0.04)",
            borderColor: "rgba(249,115,22,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" style={{ color: "#F97316" }} />
            <h3 className="text-lg font-bold text-gray-900">
              Pack collaboratif
            </h3>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: "#F97316" }}
            >
              Team uniquement
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PACK_COLLAB.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check
                  className="w-4 h-4 shrink-0"
                  style={{ color: "#F97316" }}
                />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-400">
          Essai gratuit de 7 jours.
        </p>
      </div>
    </section>
  );
}
