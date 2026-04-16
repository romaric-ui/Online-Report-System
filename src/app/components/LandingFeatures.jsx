"use client";
import {
  Building2, Users, BarChart3, Wallet,
  ShieldCheck, FolderOpen, MessageCircle, FileText
} from 'lucide-react';

const features = [
  {
    icon: Building2,
    title: "Suivi de chantier",
    description: "Journal quotidien, photos avant/pendant/après, progression en temps réel.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Users,
    title: "Gestion d'équipes",
    description: "Pointage, affectation, suivi des heures et de la productivité.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Planification Gantt",
    description: "Diagramme interactif avec chemin critique et dépendances.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Wallet,
    title: "Budget & Dépenses",
    description: "Suivi budgétaire, validation des dépenses, alertes dépassement.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité HSE",
    description: "Checklists, incidents, score de conformité automatique.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: FolderOpen,
    title: "Documents",
    description: "Plans, contrats, devis, permis — tout centralisé.",
    color: "bg-sky-100 text-sky-600",
  },
  {
    icon: MessageCircle,
    title: "Chat d'équipe",
    description: "Communication directe entre bureau et terrain.",
    color: "bg-teal-100 text-teal-600",
  },
  {
    icon: FileText,
    title: "Rapports PDF",
    description: "Génération automatique de rapports professionnels.",
    color: "bg-orange-100 text-orange-600",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-24 bg-white">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feature-card {
          animation: fadeInUp .5s ease both;
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px rgba(79,70,229,.12);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            Fonctionnalités
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Tout ce dont vous avez besoin
            <br className="hidden sm:block" />
            <span className="text-indigo-600"> pour gérer vos chantiers</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">
            Une suite complète d'outils intégrés, conçue pour le terrain comme pour le bureau.
          </p>
        </div>

        {/* Grid 4 cols desktop, 2 cols tablet, 1 col mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="feature-card bg-white rounded-2xl p-6 border border-gray-100 cursor-default"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
