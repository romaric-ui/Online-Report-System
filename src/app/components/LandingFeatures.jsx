'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Building2, Users, BarChart3, Wallet,
  ShieldCheck, FolderOpen, MessageCircle, FileText,
} from 'lucide-react';

const FEATURES = [
  { icon: Building2,     title: 'Suivi de chantier',    desc: 'Journal quotidien, photos avant/après, progression en temps réel.', color: '#3b82f6' },
  { icon: Users,         title: "Gestion d'équipes",    desc: 'Pointage numérique, affectation, suivi des heures et habilitations.', color: '#22c55e' },
  { icon: BarChart3,     title: 'Planification Gantt',  desc: 'Diagramme interactif avec chemin critique et dépendances.', color: '#a855f7' },
  { icon: Wallet,        title: 'Budget & Dépenses',    desc: 'Suivi budgétaire, validation des dépenses, alertes dépassement.', color: '#F59E0B' },
  { icon: ShieldCheck,   title: 'Sécurité HSE',         desc: 'Checklists, incidents, stock EPI — score de conformité auto.', color: '#ef4444' },
  { icon: FolderOpen,    title: 'Documents',            desc: 'Plans, contrats, devis, permis — tout centralisé et classifié.', color: '#06b6d4' },
  { icon: MessageCircle, title: "Chat d'équipe",        desc: 'Communication directe bureau ↔ terrain en temps réel.', color: '#14b8a6' },
  { icon: FileText,      title: 'Rapports PDF',         desc: 'Génération automatique de rapports professionnels en un clic.', color: '#f97316' },
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

function FeatureCard({ feature, delay }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div
      ref={ref}
      className="rounded-2xl p-6 border cursor-default transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#1E293B',
        borderColor: 'rgba(255,255,255,.07)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms, box-shadow .3s ease`,
        boxShadow: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 40px -12px ${feature.color}30`; e.currentTarget.style.borderColor = `${feature.color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
        style={{ background: `${feature.color}18` }}>
        <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
      </div>
      <h3 className="text-sm font-bold text-white mb-2">{feature.title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{feature.desc}</p>
    </div>
  );
}

export default function LandingFeatures() {
  const [headerRef, headerVisible] = useInView(0.2);

  return (
    <section id="features" style={{ background: '#0F172A', padding: '96px 0' }}>
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
            Fonctionnalités
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-white">
            Tout ce dont vous avez besoin
          </h2>
          <div className="mt-4 mx-auto w-16 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
          <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: '#64748b' }}>
            Une suite complète d'outils intégrés, conçue pour le terrain comme pour le bureau.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} delay={i * 60} />
          ))}
        </div>
      </div>
    </section>
  );
}
