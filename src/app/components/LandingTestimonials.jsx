"use client";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Koffi A.",
    role: "Chef de chantier",
    city: "Cotonou",
    content:
      "SGTEC a révolutionné notre suivi de chantier. On gagne 2 heures par jour sur les rapports.",
    initials: "KA",
    color: "bg-indigo-600",
  },
  {
    name: "Amina D.",
    role: "Conductrice de travaux",
    city: "Lomé",
    content:
      "Enfin un outil adapté au BTP africain. Simple, efficace, et ça marche même avec une connexion lente.",
    initials: "AD",
    color: "bg-emerald-600",
  },
  {
    name: "Marc T.",
    role: "Directeur BTP",
    city: "Abidjan",
    content:
      "Le dashboard me donne une vue claire sur tous mes chantiers. Je recommande vivement.",
    initials: "MT",
    color: "bg-purple-600",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            Témoignages
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Ils nous font <span className="text-indigo-600">confiance</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Des professionnels du BTP qui ont digitalisé leur gestion de chantier avec SGTEC.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed text-[15px] italic flex-1">
                "{t.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div
                  className={`w-11 h-11 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.role} · {t.city}
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
