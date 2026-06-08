'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Building2, Users, BarChart3, Wallet,
  ShieldCheck, FolderOpen, MessageCircle, FileText,
  Kanban, Calendar, Zap, Brain, Map, Download,
  ClipboardList, Bell,
} from 'lucide-react';

const FEATURES = [
  { icon: Building2,     title: 'Suivi de chantier',        desc: 'Journal quotidien, photos avant/après, progression en temps réel.', color: '#3b82f6' },
  { icon: Users,         title: "Gestion d'équipes",        desc: 'Pointage numérique géolocalisé, affectation, suivi des heures.', color: '#22c55e' },
  { icon: BarChart3,     title: 'Gantt & Planification',    desc: 'Diagramme interactif, chemin critique, dépendances et jalons.', color: '#a855f7' },
  { icon: Wallet,        title: 'Budget & Dépenses',        desc: 'Suivi budgétaire, validation des dépenses, alertes dépassement.', color: '#F59E0B' },
  { icon: ShieldCheck,   title: 'Sécurité HSE',             desc: 'Checklists, incidents, stock EPI — score de conformité auto.', color: '#ef4444' },
  { icon: FolderOpen,    title: 'Documents',                desc: 'Plans, contrats, devis, permis — tout centralisé et classifié.', color: '#06b6d4' },
  { icon: MessageCircle, title: "Chat d'équipe",            desc: 'Communication directe bureau ↔ terrain en temps réel.', color: '#14b8a6' },
  { icon: FileText,      title: 'Rapports PDF auto',        desc: 'Génération automatique de rapports personnalisés en un clic.', color: '#f97316' },
  { icon: Kanban,        title: 'Vue Kanban',               desc: 'Glisser-déposer les tâches entre colonnes personnalisables.', color: '#8b5cf6' },
  { icon: Calendar,      title: 'Vue Calendrier',           desc: 'Visualisez toutes vos tâches sur un calendrier mensuel interactif.', color: '#ec4899' },
  { icon: Zap,           title: 'Automatisations',          desc: 'Règles automatiques : alertes budget, rappels pointage, rapports hebdo.', color: '#eab308' },
  { icon: Brain,         title: 'Intelligence IA',          desc: 'Assistant IA, génération rapports, OCR factures — 100% gratuit.', color: '#6366f1' },
  { icon: Download,      title: 'Export Excel & PDF',       desc: 'Exportez tâches, pointage, budget, HSE en Excel ou PDF.', color: '#10b981' },
  { icon: ClipboardList, title: 'Templates BTP',            desc: 'Démarrez depuis un template Villa, Immeuble ou Route bitumée.', color: '#f43f5e' },
  { icon: Bell,          title: 'Notifications temps réel', desc: 'Alertes instant sur retards, dépassements et incidents HSE.', color: '#0ea5e9' },
  { icon: Map,           title: 'Mode terrain mobile',      desc: 'PWA installable, pointage géolocalisé, mode hors ligne.', color: '#d97706' },
];

const STATS = [
  { value: 500,  suffix: '+',  label: 'Chantiers gérés' },
  { value: 2000, suffix: '+',  label: 'Rapports générés' },
  { value: 98,   suffix: '%',  label: 'Satisfaction client' },
  { value: 24,   suffix: '/7', label: 'Support disponible' },
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

function useCounter(target, duration = 1500, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

function StatCard({ stat, active }) {
  const count = useCounter(stat.value, 1500, active);
  return (
    <div className="text-center">
      <div className="text-4xl font-black" style={{ color: '#F59E0B' }}>
        {count}{stat.suffix}
      </div>
      <div className="text-sm mt-1" style={{ color: '#64748b' }}>{stat.label}</div>
    </div>
  );
}

function FeatureCard({ feature, index, delay, visible }) {
  const [hovered, setHovered] = useState(false);
  const [iconAnimating, setIconAnimating] = useState(false);

  // Chaque card a un délai de flottement différent
  const floatDelay = (index * 0.3) % 3;
  const floatDuration = 3 + (index % 3) * 0.7;

  const handleMouseEnter = () => {
    setHovered(true);
    setIconAnimating(true);
    setTimeout(() => setIconAnimating(false), 600);
  };

  return (
    <div
      className="rounded-2xl p-6 border cursor-default relative overflow-hidden"
      style={{
        background: hovered
          ? `linear-gradient(135deg, #1E293B 0%, ${feature.color}15 100%)`
          : '#1E293B',
        borderColor: hovered ? `${feature.color}60` : 'rgba(255,255,255,.07)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
        transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
        boxShadow: hovered
          ? `0 24px 48px -12px ${feature.color}35, 0 0 0 1px ${feature.color}20`
          : 'none',
        animation: visible ? `cardFloat ${floatDuration}s ease-in-out ${floatDelay}s infinite` : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Spotlight overlay */}
      {hovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${feature.color}20 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Animated border top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{
          background: hovered
            ? `linear-gradient(90deg, transparent, ${feature.color}, transparent)`
            : 'transparent',
          transition: 'background .3s ease',
        }}
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 relative"
        style={{
          background: hovered ? `${feature.color}25` : `${feature.color}18`,
          transform: iconAnimating
            ? 'rotate(15deg) scale(1.2)'
            : hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform .3s cubic-bezier(.34,1.56,.64,1), background .3s ease',
          boxShadow: hovered ? `0 0 20px ${feature.color}40` : 'none',
        }}
      >
        {hovered && (
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              border: `2px solid ${feature.color}`,
              animation: 'pulseRing .8s ease-out infinite',
            }}
          />
        )}
        <feature.icon className="w-5 h-5 relative z-10" style={{ color: feature.color }} />
      </div>

      <h3
        className="text-sm font-bold text-white mb-2"
        style={{
          transform: hovered ? 'translateX(4px)' : 'translateX(0)',
          transition: 'transform .3s ease',
        }}
      >
        {feature.title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{
          color: hovered ? '#94a3b8' : '#64748b',
          transition: 'color .3s ease',
        }}
      >
        {feature.desc}
      </p>

      {hovered && (
        <div
          className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-full pointer-events-none"
          style={{ background: `${feature.color}12` }}
        />
      )}
    </div>
  );
}

export default function LandingFeatures() {
  const [headerRef, headerVisible] = useInView(0.2);
  const [statsRef, statsVisible] = useInView(0.3);
  const [gridRef, gridVisible] = useInView(0.05);
  const sectionRef = useRef(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: '50%', y: '50%' });

  const handleMouseMove = useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSpotlightPos({ x: `${x}px`, y: `${y}px` });
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      style={{ background: '#0F172A', padding: '96px 0', position: 'relative', overflow: 'hidden' }}
    >
      <style>{`
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px);  }
          50%      { transform: translateY(-8px); }
        }
        @keyframes gridScroll {
          0%   { transform: translateY(0);    }
          100% { transform: translateY(60px); }
        }
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1);      opacity:.15; }
          33%      { transform: translate(40px,-30px) scale(1.2); opacity:.25; }
          66%      { transform: translate(-20px,20px) scale(.9); opacity:.1; }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1);       opacity:.1; }
          50%      { transform: translate(-60px,40px) scale(1.3); opacity:.2; }
        }
        @keyframes headerSlide {
          from { opacity:0; transform: translateY(-20px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>

      {/* Animated background grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.12 }}>
        <div style={{ animation: 'gridScroll 8s linear infinite' }}>
          <svg width="100%" height="200%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#F59E0B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Orbs flottants */}
      <div className="absolute pointer-events-none" style={{
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,.2) 0%, transparent 70%)',
        top: '10%', left: '5%',
        animation: 'orb1 12s ease-in-out infinite',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,.15) 0%, transparent 70%)',
        bottom: '10%', right: '5%',
        animation: 'orb2 15s ease-in-out infinite',
      }} />

      {/* Mouse spotlight */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,.05) 0%, transparent 70%)',
          left: spotlightPos.x, top: spotlightPos.y,
          transform: 'translate(-50%, -50%)',
          transition: 'left .08s ease, top .08s ease',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

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

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-16 py-8 px-6 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.07)',
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity .7s ease .2s, transform .7s ease .2s',
          }}
        >
          {STATS.map((s, i) => (
            <StatCard key={i} stat={s} active={statsVisible} />
          ))}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={i}
              feature={f}
              index={i}
              delay={i * 50}
              visible={gridVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}