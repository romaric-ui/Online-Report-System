'use client';
import { useEffect, useState } from 'react';
import {
  Building2, Users, BarChart3, Wallet,
  ShieldCheck, FolderOpen, MessageCircle, FileText,
  Kanban, Calendar, Zap, Brain, Map, Download,
  ClipboardList, Bell,
} from 'lucide-react';
import { Reveal, SectionHeading, useInView } from './LandingKit';

const FEATURES = [
  { icon: Building2,     title: 'Suivi de chantier',        desc: 'Journal quotidien, photos avant/après, progression en temps réel.' },
  { icon: Users,         title: "Gestion d'équipes",        desc: 'Pointage numérique géolocalisé, affectation, suivi des heures.' },
  { icon: BarChart3,     title: 'Gantt & planification',    desc: 'Diagramme interactif, chemin critique, dépendances et jalons.' },
  { icon: Wallet,        title: 'Budget & dépenses',        desc: 'Suivi budgétaire, validation des dépenses, alertes de dépassement.' },
  { icon: ShieldCheck,   title: 'Sécurité HSE',             desc: 'Checklists, incidents, stock EPI et score de conformité automatique.' },
  { icon: FolderOpen,    title: 'Documents',                desc: 'Plans, contrats, devis, permis : tout centralisé et classé.' },
  { icon: MessageCircle, title: "Chat d'équipe",            desc: 'Communication directe entre le bureau et le terrain.' },
  { icon: FileText,      title: 'Rapports PDF',             desc: 'Rapports personnalisés générés en un clic.' },
  { icon: Kanban,        title: 'Vue Kanban',               desc: 'Glissez-déposez les tâches entre colonnes personnalisables.' },
  { icon: Calendar,      title: 'Vue calendrier',           desc: 'Toutes vos tâches sur un calendrier mensuel interactif.' },
  { icon: Zap,           title: 'Automatisations',          desc: 'Alertes budget, rappels de pointage, rapports hebdomadaires.' },
  { icon: Brain,         title: 'Assistant IA',             desc: 'Rédaction de rapports et lecture de factures (OCR), sans surcoût.' },
  { icon: Download,      title: 'Export Excel & PDF',       desc: 'Tâches, pointage, budget et HSE exportés en Excel ou PDF.' },
  { icon: ClipboardList, title: 'Modèles BTP',              desc: 'Démarrez depuis un modèle Villa, Immeuble ou Route bitumée.' },
  { icon: Bell,          title: 'Notifications',            desc: 'Alertes immédiates sur retards, dépassements et incidents HSE.' },
  { icon: Map,           title: 'Mode terrain mobile',      desc: 'Application installable et pointage géolocalisé.' },
];

const STATS = [
  { value: 500,  suffix: '+',  label: 'Chantiers gérés' },
  { value: 2000, suffix: '+',  label: 'Rapports générés' },
  { value: 98,   suffix: ' %', label: 'Clients satisfaits' },
  { value: 24,   suffix: '/7', label: 'Support disponible' },
];

function useCounter(target, duration = 1400, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }
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

function Stat({ stat, active }) {
  const count = useCounter(stat.value, 1400, active);
  return (
    <div className="bg-nuit py-8 px-6">
      <div className="font-ui font-semibold text-[clamp(2.25rem,4vw,3.25rem)] leading-none tracking-[-0.03em] text-craie tabular-nums">
        {count.toLocaleString('fr-FR')}<span className="text-orange-vif">{stat.suffix}</span>
      </div>
      <div className="mt-3 text-base text-craie-2">{stat.label}</div>
    </div>
  );
}

export default function LandingFeatures() {
  const [statsRef, statsVisible] = useInView(0.3);

  return (
    <section id="features" className="relative bg-nuit py-28 md:py-36 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          index={2}
          label="Fonctionnalités"
          title={<>Tout le chantier,<br className="hidden sm:block" /> dans un seul outil.</>}
          intro="Une suite complète, pensée pour le terrain comme pour le bureau."
        />

        {/* Chiffres */}
        <div
          ref={statsRef}
          className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.09] border-y border-white/[0.09]"
        >
          {STATS.map((s) => (
            <Stat key={s.label} stat={s} active={statsVisible} />
          ))}
        </div>

        {/* Grille des fonctionnalités : trame fine, sans cartes flottantes */}
        <ul className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.09] border border-white/[0.09] rounded-2xl overflow-hidden">
          {FEATURES.map((f, i) => (
            <Reveal
              as="li"
              key={f.title}
              delay={(i % 4) * 60}
              className="group bg-nuit p-7 transition-colors duration-300 hover:bg-nuit-2"
            >
              <f.icon className="w-6 h-6 text-orange-vif" strokeWidth={1.6} />
              <h3 className="mt-6 text-lg font-semibold text-craie">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-craie-2">{f.desc}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
