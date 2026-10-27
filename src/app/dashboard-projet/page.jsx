'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2, Wallet, AlertTriangle, ShieldCheck,
  PlusCircle, UserPlus, Wrench, ChevronRight, Clock,
  ClipboardList, Camera, FileBarChart, ArrowUpRight,
  MapPin, Calendar,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import StatutBadge from '../components/StatutBadge';

// ─── Constantes ──────────────────────────────────────────────────────────────

const URGENCE_CLASSES = {
  rouge:  'border-[var(--st-alerte-fg)] bg-[var(--st-alerte-bg)] text-[var(--st-alerte-fg)]',
  orange: 'border-[var(--st-attente-fg)] bg-[var(--st-attente-bg)] text-[var(--st-attente-fg)]',
  bleu:   'border-app-border-strong bg-app-subtle text-app-text',
};

const ACTIVITE_ICONS = {
  journal:  ClipboardList,
  photo:    Camera,
  incident: AlertTriangle,
};

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

// ─── SVG Circle Progress ──────────────────────────────────────────────────────

function CircleProgress({ value, size = 64, stroke = 6 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--app-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--app-text)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Briques d'affichage ──────────────────────────────────────────────────────

function Kpi({ icon: Icon, label, children, sub, tone = 'neutre' }) {
  const iconCls = tone === 'alerte'
    ? 'bg-[var(--st-alerte-bg)] text-[var(--st-alerte-fg)]'
    : 'bg-app-subtle text-app-text border border-app-border';
  return (
    <div className="flex items-center gap-4">
      {Icon && (
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
          <Icon aria-hidden="true" className="w-6 h-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-base font-medium text-app-muted">{label}</p>
        {children}
        {sub && <p className="text-sm text-app-faint mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Panneau({ titre, compteur, action, children, className = '' }) {
  return (
    <section className={`bg-app-surface rounded-2xl border border-app-border overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-app-border">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-app-text flex items-center gap-2">
          {titre}
          {compteur !== undefined && (
            <span className="font-data text-sm font-normal text-app-faint">{compteur}</span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardProjetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/dashboard-projet');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de chargement');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data?.budget_par_mois?.length) return [];
    const max = Math.max(...data.budget_par_mois.map(b => parseFloat(b.total)));
    return data.budget_par_mois.map(b => ({
      ...b,
      pct: max > 0 ? (parseFloat(b.total) / max) * 100 : 0,
    }));
  }, [data?.budget_par_mois]);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const prenom = session?.user?.prenom || session?.user?.name?.split(' ')[0] || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center" role="status">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-app-border border-t-app-accent rounded-full animate-spin motion-reduce:animate-none mx-auto mb-4" />
          <p className="text-app-muted text-base">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
        <div role="alert" className="bg-app-surface border border-app-border rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle aria-hidden="true" className="w-8 h-8 text-app-danger mx-auto mb-3" />
          <p className="text-lg text-app-text font-medium">{error}</p>
          <button onClick={fetchData} className={`btn btn-primary mt-5 ${focusRing}`}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const kpis      = data?.kpis || {};
  const chantiers = data?.chantiers || [];
  const alertes   = data?.alertes || [];
  const activite  = data?.activite_recente || [];

  const budgetPct   = kpis.budget_total_prevu > 0
    ? Math.round((kpis.budget_total_depense / kpis.budget_total_prevu) * 100)
    : 0;

  const avancementMoyen = chantiers.length > 0
    ? Math.round(chantiers.reduce((s, c) => s + (parseFloat(c.progression) || 0), 0) / chantiers.length)
    : 0;

  const budgetBarCls = budgetPct >= 100 ? 'bg-app-danger' : budgetPct >= 80 ? 'bg-[var(--st-attente-fg)]' : 'bg-app-text';

  const actionSecondaire = `btn btn-soft text-base px-4 ${focusRing}`;

  return (
    <AppLayout>
      <div className="max-w-screen-2xl mx-auto px-1 sm:px-2 lg:px-4 py-4 sm:py-6 text-app-text">

        {/* ── En-tête ── */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="font-data text-sm uppercase tracking-[0.12em] text-app-muted">{today}</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold leading-[1.05] tracking-[-0.03em]">
              Bonjour {prenom}
            </h1>
            {data?.entreprise_nom && (
              <p className="mt-2 text-lg text-app-muted">{data.entreprise_nom}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
            <button onClick={() => router.push('/chantiers/nouveau')} className={`btn btn-primary text-base px-4 ${focusRing}`}>
              <PlusCircle aria-hidden="true" className="w-5 h-5" /> Nouveau chantier
            </button>
            <button onClick={() => router.push('/equipes')} className={actionSecondaire}>
              <UserPlus aria-hidden="true" className="w-5 h-5" /> Ajouter un ouvrier
            </button>
            <button onClick={() => router.push('/materiel')} className={actionSecondaire}>
              <Wrench aria-hidden="true" className="w-5 h-5" /> Ajouter du matériel
            </button>
            <button onClick={() => router.push('/dashboard-projet/rapport-hebdo')} className={actionSecondaire}>
              <FileBarChart aria-hidden="true" className="w-5 h-5" /> Rapport hebdo
            </button>
          </div>
        </div>

        {/* ── Section 1 — 4 KPIs (trame gap-px) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-app-border border border-app-border rounded-2xl overflow-hidden mb-8">

          {/* KPI 1 — Chantiers actifs */}
          <div className="bg-app-surface p-6">
            <Kpi icon={Building2} label="Chantiers actifs" sub={`${kpis.chantiers_total ?? 0} au total`}>
              <p className="text-4xl font-semibold tracking-[-0.03em] leading-tight">{kpis.chantiers_en_cours ?? 0}</p>
            </Kpi>
          </div>

          {/* KPI 2 — Avancement moyen */}
          <div className="bg-app-surface p-6 flex items-center gap-4">
            <CircleProgress value={avancementMoyen} />
            <div className="min-w-0">
              <p className="text-base font-medium text-app-muted">Avancement moyen</p>
              <p className="text-4xl font-semibold tracking-[-0.03em] leading-tight">{avancementMoyen}&nbsp;%</p>
              <p className="text-sm text-app-faint mt-0.5">{kpis.chantiers_termines ?? 0} terminé{(kpis.chantiers_termines ?? 0) > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* KPI 3 — Budget consommé */}
          <div className="bg-app-surface p-6 flex flex-col gap-4">
            <Kpi icon={Wallet} label="Budget consommé" sub={`sur ${fmtCurrency(kpis.budget_total_prevu)} prévus`}>
              <p className="text-3xl font-semibold tracking-[-0.03em] leading-tight">{fmtCurrency(kpis.budget_total_depense)}</p>
            </Kpi>
            <div>
              <div className="flex justify-between mb-1.5 text-sm">
                <span className="text-app-muted">{budgetPct}&nbsp;% utilisé</span>
                {budgetPct >= 80 && (
                  <span className={`font-semibold ${budgetPct >= 100 ? 'text-app-danger' : 'text-[var(--st-attente-fg)]'}`}>
                    {budgetPct >= 100 ? 'Budget dépassé' : 'Attention'}
                  </span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-app-border overflow-hidden" role="progressbar" aria-valuenow={Math.min(budgetPct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget utilisé">
                <div className={`h-full rounded-full ${budgetBarCls}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* KPI 4 — Alertes */}
          <div className="bg-app-surface p-6">
            <Kpi
              icon={alertes.length > 0 ? AlertTriangle : ShieldCheck}
              label="Alertes"
              sub={alertes.length > 0 ? 'non résolues' : 'Tout est en ordre'}
              tone={alertes.length > 0 ? 'alerte' : 'neutre'}
            >
              <p className={`text-4xl font-semibold tracking-[-0.03em] leading-tight ${alertes.length > 0 ? 'text-app-danger' : ''}`}>{alertes.length}</p>
            </Kpi>
          </div>
        </div>

        {/* ── Section 2 — Chantiers ── */}
        <Panneau
          titre="Mes chantiers"
          compteur={chantiers.length}
          className="mb-6"
          action={
            <button
              onClick={() => router.push('/chantiers')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-base font-semibold text-app-accent-text hover:bg-app-hover ${focusRing}`}
            >
              Voir tous <ChevronRight aria-hidden="true" className="w-5 h-5" />
            </button>
          }
        >
          {chantiers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-lg text-app-muted">Aucun chantier pour l&apos;instant.</p>
              <button onClick={() => router.push('/chantiers/nouveau')} className={`btn btn-primary mt-4 ${focusRing}`}>
                <PlusCircle aria-hidden="true" className="w-5 h-5" /> Créer le premier chantier
              </button>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {chantiers.map((c) => {
                const prog    = Math.round(parseFloat(c.progression) || 0);
                const depPct  = c.budget_prevu > 0 ? Math.round((parseFloat(c.total_depense) / parseFloat(c.budget_prevu)) * 100) : 0;
                const retard  = c.date_fin_prevue && new Date(c.date_fin_prevue) < new Date() && !['termine', 'annule'].includes(c.statut);
                return (
                  <button
                    key={c.id_chantier}
                    onClick={() => router.push(`/chantiers/${c.id_chantier}`)}
                    className={`text-left bg-app-subtle hover:bg-app-hover border border-app-border hover:border-app-border-strong rounded-xl p-5 transition-colors ${focusRing}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-lg leading-snug text-app-text truncate">{c.nom}</p>
                        {(c.client_nom || c.ville) && (
                          <p className="text-sm text-app-muted flex items-center gap-1.5 mt-1">
                            <MapPin aria-hidden="true" className="w-4 h-4 shrink-0" />
                            <span className="truncate">{[c.client_nom, c.ville].filter(Boolean).join(' · ')}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatutBadge statut={c.statut} />
                        {retard && <StatutBadge statut="en_retard" />}
                      </div>
                    </div>

                    {/* Progression */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5 text-sm">
                        <span className="text-app-muted">Avancement</span>
                        <span className="font-semibold text-app-text">{prog}&nbsp;%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-app-border overflow-hidden">
                        <div className="h-full rounded-full bg-app-text" style={{ width: `${Math.min(prog, 100)}%` }} />
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className={`font-medium ${depPct >= 90 ? 'text-app-danger' : 'text-app-text'}`}>
                        {fmtCurrency(c.total_depense)} / {c.budget_prevu ? fmtCurrency(c.budget_prevu) : '—'}
                      </span>
                      {c.dernier_journal_date && (
                        <span className="text-app-muted flex items-center gap-1.5">
                          <Calendar aria-hidden="true" className="w-4 h-4" />
                          {new Date(c.dernier_journal_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Panneau>

        {/* ── Section 3+4 — Alertes + Activité ── */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 mb-6">

          {/* Alertes */}
          <Panneau titre="Alertes" compteur={alertes.length > 0 ? alertes.length : undefined}>
            {alertes.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ShieldCheck aria-hidden="true" className="w-9 h-9 text-app-success mx-auto mb-3" />
                <p className="text-base text-app-muted">Aucune alerte. Tout est en ordre.</p>
              </div>
            ) : (
              <ul className="divide-y divide-app-border max-h-96 overflow-y-auto">
                {alertes.map(a => (
                  <li key={a.id}>
                    <button
                      onClick={() => router.push(a.lien)}
                      className={`w-full flex items-start gap-3 px-6 py-4 text-left border-l-4 hover:brightness-[0.97] transition ${URGENCE_CLASSES[a.urgence] || URGENCE_CLASSES.bleu} ${focusRing}`}
                    >
                      <AlertTriangle aria-hidden="true" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-base leading-snug flex-1">{a.message}</span>
                      <ArrowUpRight aria-hidden="true" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          {/* Activité récente */}
          <Panneau titre="Activité récente">
            {activite.length === 0 ? (
              <div className="px-6 py-10 text-center text-base text-app-muted">Aucune activité récente.</div>
            ) : (
              <ul className="divide-y divide-app-border max-h-96 overflow-y-auto">
                {activite.map((a, i) => {
                  const Icon = ACTIVITE_ICONS[a.type] || ClipboardList;
                  const iconCls = a.type === 'incident'
                    ? 'bg-[var(--st-alerte-bg)] text-[var(--st-alerte-fg)]'
                    : 'bg-app-subtle text-app-text border border-app-border';
                  return (
                    <li key={i} className="flex items-start gap-3 px-6 py-4">
                      <div className={`rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                        <Icon aria-hidden="true" className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base text-app-text leading-snug">
                          <span className="font-semibold">{a.auteur}</span>
                          {a.type === 'journal' ? ' a rempli le journal' :
                           a.type === 'photo'   ? ' a ajouté une photo' :
                           ' a déclaré un incident'}
                          {' sur '}
                          <button
                            onClick={() => router.push(`/chantiers/${a.id_chantier}`)}
                            className={`font-semibold text-app-accent-text hover:underline rounded ${focusRing}`}
                          >
                            {a.chantier_nom}
                          </button>
                        </p>
                        {a.detail && <p className="text-sm text-app-muted mt-1 truncate">{a.detail}</p>}
                        <p className="text-sm text-app-faint mt-1 flex items-center gap-1.5">
                          <Clock aria-hidden="true" className="w-4 h-4" />
                          {timeAgo(a.date_action)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panneau>
        </div>

        {/* ── Section 5 — Dépenses mensuelles ── */}
        <Panneau titre="Dépenses mensuelles" compteur="6 derniers mois">
          {chartData.length === 0 ? (
            <p className="text-center text-app-muted text-base py-10">Aucune dépense enregistrée.</p>
          ) : (
            <div className="flex items-end gap-3 h-48 p-6">
              {chartData.map((b, i) => (
                <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-0">
                  <span className="text-sm font-semibold text-app-text text-center leading-tight">
                    {fmtCurrency(b.total)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-app-text"
                    style={{ height: `${Math.max(b.pct, 4)}%`, minHeight: 6 }}
                  />
                  <span className="text-sm text-app-muted truncate w-full text-center capitalize">
                    {b.mois_label?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panneau>

      </div>
    </AppLayout>
  );
}
