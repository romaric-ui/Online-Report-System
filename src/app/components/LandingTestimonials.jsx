'use client';
import { Reveal, SectionHeading } from './LandingKit';

const TESTIMONIALS = [
  {
    name: 'Koffi A.',
    role: 'Chef de chantier',
    city: 'Cotonou',
    content: "SGTEC a révolutionné notre suivi de chantier. On gagne 2 heures par jour sur les rapports. Je ne pourrais plus m'en passer.",
    initials: 'KA',
  },
  {
    name: 'Amina D.',
    role: 'Conductrice de travaux',
    city: 'Lomé',
    content: "Enfin un outil adapté au BTP africain. Simple, efficace, et ça marche même avec une connexion lente. Mes équipes adorent.",
    initials: 'AD',
  },
  {
    name: 'Marc T.',
    role: 'Directeur BTP',
    city: 'Abidjan',
    content: "Le tableau de bord me donne une vue claire sur tous mes chantiers en même temps. La gestion des budgets est devenue un jeu d'enfant.",
    initials: 'MT',
  },
];

export default function LandingTestimonials() {
  return (
    <section className="bg-nuit py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          index={4}
          label="Témoignages"
          title="Ils pilotent leurs chantiers avec nous."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-px bg-white/[0.09] border border-white/[0.09] rounded-2xl overflow-hidden">
          {TESTIMONIALS.map((t, i) => (
            <Reveal as="figure" key={t.name} delay={i * 80} className="bg-nuit p-8 lg:p-10 flex flex-col">
              <span aria-hidden="true" className="font-ui text-6xl leading-none text-orange-vif">“</span>
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-craie">
                {t.content}
              </blockquote>
              <figcaption className="mt-10 flex items-center gap-4">
                <span className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.08] text-craie text-sm font-semibold shrink-0">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-base font-semibold text-craie">{t.name}</span>
                  <span className="block text-sm text-craie-2">{t.role} · {t.city}</span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
