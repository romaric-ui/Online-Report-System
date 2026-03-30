"use client";
import {
  FileText, Download, Shield, UserPlus, LayoutDashboard, Camera,
  ClipboardList, ArrowRight, CheckCircle2
} from 'lucide-react';

export default function LandingFeatures() {
  const features = [
    {
      icon: ClipboardList,
      title: "Rapports structurés",
      description: "Formulaire complet : infos chantier, équipe, matériel, avancement, incidents et observations.",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Download,
      title: "Export PDF professionnel",
      description: "PDF paginé avec page de garde et tableaux formatés — prêt à envoyer au maître d'ouvrage.",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Camera,
      title: "Photos de chantier",
      description: "Ajoutez des images de couverture dans vos rapports pour documenter visuellement le chantier.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: UserPlus,
      title: "Connexion simple",
      description: "Inscription en 30 secondes avec email ou Google. Vérification par code OTP.",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: LayoutDashboard,
      title: "Tableau de bord",
      description: "Tous vos rapports au même endroit. Recherchez, filtrez, modifiez ou supprimez facilement.",
      color: "bg-sky-100 text-sky-600",
    },
    {
      icon: Shield,
      title: "Données sécurisées",
      description: "Mots de passe hashés, sessions JWT, validation des entrées, protection SQL et XSS.",
      color: "bg-red-100 text-red-600",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Créez votre compte",
      description: "Inscrivez-vous avec votre email ou via Google. Un code OTP confirme votre adresse.",
    },
    {
      number: "02",
      title: "Remplissez votre rapport",
      description: "Client, localisation, phase, équipe, matériel, avancement, incidents, observations.",
    },
    {
      number: "03",
      title: "Générez le PDF",
      description: "En un clic, obtenez un document professionnel prêt à envoyer au maître d'ouvrage.",
    },
  ];

  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
              Comment ça marche
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              3 étapes, c'est tout
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              De l'inscription à la génération du PDF, tout se fait en quelques minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
                  <span className="block text-5xl font-bold text-gray-100 mb-4 leading-none">
                    {step.number}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
              Fonctionnalités
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Ce que l'application fait concrètement
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Pas de promesses — voici ce qui est intégré et fonctionnel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Why digitize */}
          <div className="mt-24 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                Pourquoi digitaliser
              </span>
              <h3 className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
                Fini les rapports papier
              </h3>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Les rapports papier ou Excel se perdent, manquent de structure et sont difficiles
                à retrouver. Cette application résout ces problèmes concrètement.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Fini les rapports qui se perdent sur le chantier",
                  "Structure unique imposée — aucune rubrique oubliée",
                  "PDF professionnel généré automatiquement",
                  "Historique complet, consultable à tout moment",
                  "Accessible depuis n'importe quel appareil",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="space-y-3">
                {[
                  { title: "Chantier Tour Eiffel - Phase 2", date: "12 Fév 2026", status: "Validé", green: true },
                  { title: "Rénovation Gare du Nord", date: "10 Fév 2026", status: "En cours", green: false },
                  { title: "Extension Bureau Paris 8e", date: "08 Fév 2026", status: "Validé", green: true },
                ].map((report, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{report.title}</p>
                        <p className="text-xs text-gray-400">{report.date}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        report.green
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
