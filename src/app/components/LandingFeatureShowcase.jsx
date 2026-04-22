'use client';
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

// ─── Illustrations CSS ────────────────────────────────────────────────────────

function DashboardIllustration() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ background: '#0F172A', padding: 20 }}>
      {/* Faux dots de fenêtre */}
      <div className="flex gap-1.5 mb-4">
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Chantiers', val: '12', color: '#3b82f6' },
          { label: 'Avancement', val: '74%', color: '#22c55e' },
          { label: 'Budget', val: '89%', color: '#f59e0b' },
          { label: 'Alertes', val: '3', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: '#1E293B' }}>
            <div className="text-xs text-gray-500 mb-1">{k.label}</div>
            <div className="text-xl font-black" style={{ color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      {/* Barres de progression */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: '#1E293B' }}>
        {[
          { name: 'Chantier A', pct: 82, color: '#22c55e' },
          { name: 'Chantier B', pct: 55, color: '#f59e0b' },
          { name: 'Chantier C', pct: 30, color: '#3b82f6' },
        ].map((c, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
              <span>{c.name}</span><span>{c.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#334155' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamIllustration() {
  const workers = [
    { name: 'Alexandre M.', role: 'Chef équipe', color: '#3b82f6', present: true,  pct: 100 },
    { name: 'Rachid T.',    role: 'Maçon',       color: '#22c55e', present: true,  pct: 85 },
    { name: 'Luca F.',      role: 'Électricien', color: '#f59e0b', present: false, pct: 60 },
    { name: 'David K.',     role: 'Plombier',    color: '#a855f7', present: true,  pct: 92 },
  ];
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ background: '#0F172A', padding: 20 }}>
      <div className="flex gap-1.5 mb-4">
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div className="text-xs font-semibold mb-3" style={{ color: '#64748b' }}>ÉQUIPE · 8 PRÉSENTS / 10</div>
      <div className="space-y-3">
        {workers.map((w, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ background: '#1E293B' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: w.color }}>
              {w.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{w.name}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>{w.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full" style={{ background: '#334155' }}>
                <div className="h-full rounded-full" style={{ width: `${w.pct}%`, background: w.color }} />
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: w.present ? '#22c55e' : '#ef4444' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportIllustration() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ background: '#0F172A', padding: 20 }}>
      <div className="flex gap-1.5 mb-4">
        {['#ef4444','#f59e0b','#22c55e'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
      </div>
      {/* Faux rapport PDF */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'white', padding: 16 }}>
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-3 w-24 rounded" style={{ background: '#0F172A', marginBottom: 4 }} />
            <div className="h-2 w-16 rounded" style={{ background: '#94a3b8' }} />
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f59e0b' }}>
            <span className="text-white text-xs font-black">PDF</span>
          </div>
        </div>
        {/* Sections */}
        {[
          { label: 'RAPPORT JOURNALIER', color: '#0F172A', w: '100%' },
          { label: 'Travaux réalisés', color: '#3b82f6', w: '80%' },
          { label: 'Main d\'œuvre', color: '#22c55e', w: '65%' },
          { label: 'Observations', color: '#f59e0b', w: '90%' },
        ].map((s, i) => (
          <div key={i} className="mb-3">
            <div className="h-2 rounded mb-1.5" style={{ background: s.color, width: s.w, opacity: i === 0 ? 1 : 0.7 }} />
            <div className="h-1.5 rounded mb-1" style={{ background: '#e2e8f0', width: '95%' }} />
            <div className="h-1.5 rounded" style={{ background: '#e2e8f0', width: '75%' }} />
          </div>
        ))}
        <div className="mt-4 h-7 rounded-lg" style={{ background: '#0F172A' }}>
          <div className="flex items-center justify-center h-full">
            <span className="text-white text-xs font-semibold">Télécharger le PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Blocs ────────────────────────────────────────────────────────────────────

const BLOCS = [
  {
    illustrationLeft: true,
    illustration: DashboardIllustration,
    tag:   'Temps réel',
    title: 'Suivez vos chantiers en temps réel',
    desc:  "Accédez à l'état de tous vos chantiers depuis un seul tableau de bord. Indicateurs clés, alertes et avancement mis à jour en continu.",
    points: ['Tableau de bord centralisé', 'Alertes automatiques', 'Accès mobile & desktop'],
  },
  {
    illustrationLeft: false,
    illustration: TeamIllustration,
    tag:   'Équipes',
    title: 'Gérez vos équipes efficacement',
    desc:  "Affectez vos ouvriers aux chantiers, suivez les présences quotidiennes et gérez les habilitations et les rôles de chacun.",
    points: ['Pointage numérique', 'Gestion des rôles et droits', 'Historique des présences'],
  },
  {
    illustrationLeft: true,
    illustration: ReportIllustration,
    tag:   'Rapports',
    title: 'Générez des rapports professionnels',
    desc:  "Créez des rapports PDF en un clic. Journaux de chantier, rapports d'avancement, bilans de sécurité — tout est automatisé.",
    points: ['Export PDF automatique', 'Modèles personnalisables', 'Archivage sécurisé'],
  },
];

// ─── Hook visibility ──────────────────────────────────────────────────────────

function useInView(threshold = 0.2) {
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

function Bloc({ bloc, index }) {
  const [ref, visible] = useInView(0.15);
  const { illustrationLeft, illustration: Illustration, tag, title, desc, points } = bloc;

  const illStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateX(0)' : `translateX(${illustrationLeft ? '-60px' : '60px'})`,
    transition: 'opacity 0.7s ease, transform 0.7s ease',
  };
  const textStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateX(0)' : `translateX(${illustrationLeft ? '60px' : '-60px'})`,
    transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
  };

  const textContent = (
    <div style={textStyle}>
      <span className="inline-block text-xs font-bold text-yellow-500 uppercase tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/30 mb-4">
        {tag}
      </span>
      <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{title}</h3>
      <p className="text-gray-500 text-lg leading-relaxed mb-6">{desc}</p>
      <ul className="space-y-3">
        {points.map((p, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-700 font-medium">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const illustrationContent = (
    <div style={illStyle}>
      <Illustration />
    </div>
  );

  return (
    <div
      ref={ref}
      className={`grid md:grid-cols-2 gap-12 lg:gap-16 items-center ${index % 2 !== 0 ? '' : ''}`}
    >
      {illustrationLeft ? (
        <>{illustrationContent}{textContent}</>
      ) : (
        <>
          <div className="order-2 md:order-1">{textContent}</div>
          <div className="order-1 md:order-2">{illustrationContent}</div>
        </>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function LandingFeatureShowcase() {
  return (
    <section className="py-24 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-20">
          <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Pourquoi SGTEC ?</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Conçu pour le terrain
          </h2>
          <div className="mt-4 mx-auto w-16 h-1.5 rounded-full bg-yellow-400" />
        </div>

        <div className="space-y-24">
          {BLOCS.map((bloc, i) => (
            <Bloc key={i} bloc={bloc} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
