'use client';
import { Check } from 'lucide-react';
import { Reveal, SectionHeading } from './LandingKit';

// ─── Illustrations (aperçus d'écran) ──────────────────────────────────────────

function Frame({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-nuit border border-ardoise-900/10">
      <div className="flex items-center justify-between h-11 px-5 border-b border-white/[0.08]">
        <span className="font-data text-[12px] uppercase tracking-[0.14em] text-craie-3">{title}</span>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="w-2 h-2 rounded-full bg-white/15" />
          <span className="w-2 h-2 rounded-full bg-white/15" />
          <span className="w-2 h-2 rounded-full bg-white/15" />
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function DashboardIllustration() {
  return (
    <Frame title="Tableau de bord">
      <div className="grid grid-cols-2 gap-px bg-white/[0.08] rounded-xl overflow-hidden mb-5">
        {[
          { label: 'Chantiers', val: '12' },
          { label: 'Avancement', val: '74 %' },
          { label: 'Budget consommé', val: '89 %' },
          { label: 'Alertes', val: '3', alert: true },
        ].map((k) => (
          <div key={k.label} className="bg-nuit-2 p-4">
            <div className="text-sm text-craie-2">{k.label}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${k.alert ? 'text-orange-vif' : 'text-craie'}`}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[
          { name: 'Résidence Les Acacias', pct: 82 },
          { name: 'Immeuble Plateau', pct: 55 },
          { name: 'Villa Nord', pct: 30 },
        ].map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-sm mb-2 text-craie-2">
              <span>{c.name}</span><span className="tabular-nums text-craie">{c.pct} %</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-orange-vif" style={{ width: `${c.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function TeamIllustration() {
  const workers = [
    { name: 'Alexandre M.', role: "Chef d'équipe", present: true },
    { name: 'Rachid T.',    role: 'Maçon',         present: true },
    { name: 'Luca F.',      role: 'Électricien',   present: false },
    { name: 'David K.',     role: 'Plombier',      present: true },
  ];
  return (
    <Frame title="Équipe · 8 présents / 10">
      <ul className="divide-y divide-white/[0.08]">
        {workers.map((w) => (
          <li key={w.name} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.08] text-craie text-sm font-semibold shrink-0">
              {w.name.split(' ').map((n) => n[0]).join('')}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium text-craie truncate">{w.name}</span>
              <span className="block text-sm text-craie-2">{w.role}</span>
            </span>
            <span className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-[13px] font-medium ${w.present ? 'bg-[#3FB27F]/15 text-[#6FD3A4]' : 'bg-white/[0.06] text-craie-3'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${w.present ? 'bg-[#6FD3A4]' : 'bg-craie-3'}`} />
              {w.present ? 'Présent' : 'Absent'}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function ReportIllustration() {
  return (
    <Frame title="Rapport journalier · PDF">
      <div className="rounded-xl bg-white p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="h-3 w-28 rounded bg-ardoise-900 mb-2" />
            <div className="h-2 w-20 rounded bg-ardoise-100" />
          </div>
          <span className="h-9 px-3 rounded-md flex items-center bg-securite text-nuit text-[12px] font-bold tracking-wide">PDF</span>
        </div>
        {['Travaux réalisés', "Main-d'œuvre", 'Observations'].map((label, i) => (
          <div key={label} className="mb-4 last:mb-0">
            <div className="text-[13px] font-semibold text-ardoise-900 mb-2">{label}</div>
            <div className="h-1.5 rounded bg-ardoise-100 mb-1.5" style={{ width: `${95 - i * 8}%` }} />
            <div className="h-1.5 rounded bg-ardoise-100" style={{ width: `${70 - i * 6}%` }} />
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ─── Blocs ────────────────────────────────────────────────────────────────────

const BLOCS = [
  {
    illustration: DashboardIllustration,
    tag:   'Temps réel',
    title: 'Suivez vos chantiers en temps réel',
    desc:  "L'état de tous vos chantiers sur un seul tableau de bord : indicateurs clés, alertes et avancement mis à jour en continu.",
    points: ['Tableau de bord centralisé', 'Alertes automatiques', 'Accès mobile et ordinateur'],
  },
  {
    illustration: TeamIllustration,
    tag:   'Équipes',
    title: 'Gérez vos équipes efficacement',
    desc:  "Affectez vos ouvriers aux chantiers, suivez les présences du jour et gérez les habilitations et les rôles de chacun.",
    points: ['Pointage numérique', 'Gestion des rôles et des droits', 'Historique des présences'],
  },
  {
    illustration: ReportIllustration,
    tag:   'Rapports',
    title: 'Générez des rapports professionnels',
    desc:  "Journaux de chantier, rapports d'avancement, bilans de sécurité : vos rapports PDF sont prêts en un clic.",
    points: ['Export PDF automatique', 'Modèles personnalisables', 'Archivage sécurisé'],
  },
];

function Bloc({ bloc, reversed }) {
  const { illustration: Illustration, tag, title, desc, points } = bloc;
  return (
    <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
      <Reveal className={reversed ? 'md:order-2' : ''}>
        <Illustration />
      </Reveal>
      <Reveal delay={100} className={reversed ? 'md:order-1' : ''}>
        <p className="font-data text-[13px] uppercase tracking-[0.14em] text-securite">{tag}</p>
        <h3 className="mt-4 font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.02em] text-ardoise-900">{title}</h3>
        <p className="mt-4 text-lg leading-relaxed text-ardoise-500">{desc}</p>
        <ul className="mt-8 border-t border-ardoise-900/10">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 h-14 border-b border-ardoise-900/10 text-base font-medium text-ardoise-900">
              <Check className="w-[18px] h-[18px] text-securite shrink-0" strokeWidth={2.25} />
              {p}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function LandingFeatureShowcase() {
  return (
    <section id="how-it-works" className="bg-beton py-28 md:py-36 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHeading
          tone="light"
          index={3}
          label="Comment ça marche"
          title="Conçu pour le terrain."
          intro="Ce que vos équipes saisissent sur le chantier arrive directement au bureau."
        />
        <div className="mt-20 space-y-28">
          {BLOCS.map((bloc, i) => (
            <Bloc key={bloc.tag} bloc={bloc} reversed={i % 2 !== 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
