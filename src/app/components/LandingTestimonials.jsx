"use client";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Koffi Mensah",
    role: "Conducteur de travaux",
    company: "BTP Solutions Togo",
    content:
      "Depuis qu'on utilise SGTEC, la rédaction des comptes-rendus ne prend plus qu'une dizaine de minutes. Le PDF est propre, structuré, et notre maître d'ouvrage est bien plus satisfait.",
    initials: "KM",
    color: "bg-blue-600",
  },
  {
    name: "Adjoua Coulibaly",
    role: "Responsable technique",
    company: "Infrastructures Côte d'Ivoire",
    content:
      "La traçabilité est impeccable. Chaque intervention est enregistrée, chaque rapport est signé et daté. En cas d'audit, on retrouve tout en quelques secondes.",
    initials: "AC",
    color: "bg-orange-500",
  },
  {
    name: "Seydou Traoré",
    role: "Chef de chantier",
    company: "Génie Civil Burkina",
    content:
      "L'upload de photos directement dans le rapport est un vrai plus. On documente les incidents en temps réel depuis le terrain, et le bureau reçoit tout instantanément.",
    initials: "ST",
    color: "bg-green-600",
  },
  {
    name: "Marie-Claire Adande",
    role: "Directrice administrative",
    company: "SETRAB Bénin",
    content:
      "Le tableau de bord admin nous donne une vision globale de tous nos chantiers. On peut suivre les validations, relancer les techniciens en retard et exporter les données.",
    initials: "MA",
    color: "bg-purple-600",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
            Témoignages
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Ils font confiance à SGTEC
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Des équipes terrain aux responsables de bureau — comment SGTEC transforme
            la gestion des rapports de chantier.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-5"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed text-[15px] flex-1">
                "{t.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
