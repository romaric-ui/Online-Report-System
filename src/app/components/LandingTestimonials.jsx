'use client';
import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Koffi A.',
    role: 'Chef de chantier',
    city: 'Cotonou',
    content: "SGTEC a révolutionné notre suivi de chantier. On gagne 2 heures par jour sur les rapports. Je ne pourrais plus m'en passer.",
    initials: 'KA',
    color: '#3b82f6',
  },
  {
    name: 'Amina D.',
    role: 'Conductrice de travaux',
    city: 'Lomé',
    content: "Enfin un outil adapté au BTP africain. Simple, efficace, et ça marche même avec une connexion lente. Mes équipes adorent.",
    initials: 'AD',
    color: '#22c55e',
  },
  {
    name: 'Marc T.',
    role: 'Directeur BTP',
    city: 'Abidjan',
    content: "Le dashboard me donne une vue claire sur tous mes chantiers simultanément. La gestion des budgets est devenue un jeu d'enfant.",
    initials: 'MT',
    color: '#a855f7',
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function TestimonialCard({ t, index }) {
  const [ref, visible] = useInView(0.1);
  const dir = index % 2 === 0 ? -40 : 40;
  return (
    <div
      ref={ref}
      className="rounded-2xl p-8 flex flex-col gap-5 border transition-all duration-300"
      style={{
        background: '#1E293B',
        borderColor: 'rgba(255,255,255,.07)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : `translateX(${dir}px)`,
        transition: `opacity .7s ease ${index * 100}ms, transform .7s ease ${index * 100}ms`,
      }}
    >
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Quote mark */}
      <div className="text-5xl font-black leading-none -mb-2" style={{ color: t.color, opacity: .3 }}>"</div>

      {/* Content */}
      <p className="text-sm leading-relaxed flex-1" style={{ color: '#cbd5e1' }}>
        {t.content}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: t.color }}>
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{t.name}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>{t.role} · {t.city}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingTestimonials() {
  const [headerRef, headerVisible] = useInView(0.2);

  return (
    <section style={{ background: '#0F172A', padding: '96px 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-16"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity .7s ease, transform .7s ease',
          }}
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>
            Témoignages
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-white">
            Ils nous font <span style={{ color: '#F59E0B' }}>confiance</span>
          </h2>
          <div className="mt-4 mx-auto w-16 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
          <p className="mt-6 text-lg max-w-xl mx-auto" style={{ color: '#64748b' }}>
            Des professionnels du BTP qui ont digitalisé leur gestion de chantier avec SGTEC.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
