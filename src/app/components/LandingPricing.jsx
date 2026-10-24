"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Users, Crown } from "lucide-react";
import { Reveal, SectionHeading } from "./LandingKit";

const PLANS = [
  {
    slug: "essentiel",
    nom: "Essentiel",
    prix_mensuel: 29.99,
    prix_annuel: 299,
    icon: Zap,
    description: "Pour démarrer la digitalisation de vos chantiers.",
    max_utilisateurs: "1 utilisateur",
    max_chantiers: "5 chantiers actifs",
    features: [
      "Chantiers et journal de chantier",
      "Photos de chantier",
      "Tâches et suivi d'avancement",
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
      "Tout le plan Essentiel",
      "Équipes et gestion des ouvriers",
      "Pointage et présences",
      "Matériel et équipements",
      "Budget et dépenses",
      "Chat d'équipe",
      "Invitation de membres",
    ],
    highlight: true,
    badge: "Le plus choisi",
    cta: "Commencer l'essai gratuit",
  },
  {
    slug: "enterprise",
    nom: "Enterprise",
    prix_mensuel: null,
    prix_annuel: null,
    icon: Crown,
    description: "Pour les grandes structures aux besoins spécifiques.",
    max_utilisateurs: "Utilisateurs illimités",
    max_chantiers: "Chantiers illimités",
    features: [
      "Tout le plan Team",
      "Gantt et chemin critique",
      "Module HSE complet",
      "API dédiée",
      "Support prioritaire 24/7",
      "Accompagnement personnalisé",
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
  "Notifications en temps réel",
  "Gestion des rôles et permissions",
  "Historique complet des actions",
  "Jusqu'à 5 collaborateurs invités sur vos projets",
];

// Contenu commun à tous les plans
const COMMUN = [
  "Accès web et mobile",
  "Connexion chiffrée (SSL)",
  "Mises à jour incluses",
  "Support par email",
];

const formatPrix = (prix) =>
  Number.isInteger(prix)
    ? prix.toLocaleString("fr-FR")
    : prix.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    <section id="pricing" className="bg-beton-2 py-28 md:py-36 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <SectionHeading
            tone="light"
            index={5}
            label="Tarifs"
            title="Une offre pour chaque taille d'entreprise."
            intro="7 jours d'essai gratuit sur toutes les offres."
          />

          {/* Mensuel / annuel */}
          <div
            role="group"
            aria-label="Période de facturation"
            className="inline-flex self-start lg:self-auto items-center gap-1 p-1 rounded-full bg-white border border-ardoise-900/10"
          >
            <button
              type="button"
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
              className={`lk-focus h-11 px-6 rounded-full text-[15px] font-semibold transition-colors ${
                !annual ? "bg-ardoise-900 text-white" : "text-ardoise-500 hover:text-ardoise-900"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
              className={`lk-focus h-11 pl-6 pr-2 rounded-full text-[15px] font-semibold transition-colors flex items-center gap-2 ${
                annual ? "bg-ardoise-900 text-white" : "text-ardoise-500 hover:text-ardoise-900"
              }`}
            >
              Annuel
              <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${annual ? "bg-orange-vif text-nuit" : "bg-securite/10 text-securite"}`}>
                2 mois offerts
              </span>
            </button>
          </div>
        </div>

        {/* Offres */}
        <div className="mt-16 grid md:grid-cols-3 gap-4 items-stretch">
          {PLANS.map((plan, idx) => {
            const Icon = plan.icon;
            const prix = annual ? plan.prix_annuel : plan.prix_mensuel;
            const dark = plan.highlight;

            return (
              <Reveal
                key={plan.slug}
                delay={idx * 80}
                className={`relative rounded-3xl p-8 lg:p-9 flex flex-col border ${
                  dark ? "bg-nuit border-nuit text-craie" : "bg-white border-ardoise-900/10 text-ardoise-900"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${dark ? "text-orange-vif" : "text-ardoise-500"}`} />
                    <h3 className="text-xl font-semibold">{plan.nom}</h3>
                  </div>
                  {plan.badge && (
                    <span className="text-[13px] font-semibold px-3 py-1 rounded-full bg-orange-vif text-nuit">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className={`mt-3 text-base ${dark ? "text-craie-2" : "text-ardoise-500"}`}>{plan.description}</p>

                {/* Prix */}
                <div className="mt-8 min-h-[104px]">
                  {prix !== null ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-semibold tracking-[-0.03em] tabular-nums">
                          {formatPrix(prix)} €
                        </span>
                        <span className={`text-base ${dark ? "text-craie-2" : "text-ardoise-500"}`}>
                          / {annual ? "an" : "mois"}
                        </span>
                      </div>
                      {annual && plan.prix_mensuel && (
                        <p className={`mt-2 text-[15px] ${dark ? "text-craie-2" : "text-ardoise-500"}`}>
                          <span className="line-through mr-2">{formatPrix(Math.round(plan.prix_mensuel * 12))} €</span>
                          soit {Math.round(prix / 12)} € / mois
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-5xl font-semibold tracking-[-0.03em]">Sur devis</span>
                  )}
                </div>

                {/* Limites */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[plan.max_utilisateurs, plan.max_chantiers].map((limite) => (
                    <span
                      key={limite}
                      className={`text-sm font-medium rounded-full px-3 py-1.5 ${
                        dark ? "bg-white/[0.08] text-craie" : "bg-beton-2 text-ardoise-700"
                      }`}
                    >
                      {limite}
                    </span>
                  ))}
                </div>

                {/* Contenu */}
                <ul className={`mt-8 pt-8 space-y-3.5 flex-1 border-t ${dark ? "border-white/10" : "border-ardoise-900/10"}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[15px]">
                      <Check className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${dark ? "text-orange-vif" : "text-securite"}`} strokeWidth={2.25} />
                      <span className={dark ? "text-craie" : "text-ardoise-700"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleCta(plan)}
                  className={`lk-focus mt-10 w-full h-14 rounded-full text-base font-semibold transition-colors ${
                    dark
                      ? "bg-orange-vif text-nuit hover:bg-[#FF8A47]"
                      : plan.cta === "Nous contacter"
                        ? "bg-white border border-ardoise-900/15 text-ardoise-900 hover:border-ardoise-900/40"
                        : "bg-ardoise-900 text-white hover:bg-ardoise-700"
                  }`}
                >
                  {plan.cta}
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Inclus partout + pack collaboratif */}
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-white border border-ardoise-900/10 p-8">
            <h3 className="text-lg font-semibold text-ardoise-900">Inclus dans toutes les offres</h3>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {COMMUN.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[15px] text-ardoise-700">
                  <Check className="w-[18px] h-[18px] shrink-0 text-securite" strokeWidth={2.25} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white border border-ardoise-900/10 p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-ardoise-900">Pack collaboratif</h3>
              <span className="text-[13px] font-semibold px-3 py-1 rounded-full bg-securite/10 text-securite">
                Offre Team uniquement
              </span>
            </div>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {PACK_COLLAB.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-ardoise-700">
                  <Check className="w-[18px] h-[18px] mt-0.5 shrink-0 text-securite" strokeWidth={2.25} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
