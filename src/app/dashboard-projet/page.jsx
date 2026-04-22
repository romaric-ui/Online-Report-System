'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2, Wallet, AlertTriangle, ShieldCheck,
  PlusCircle, UserPlus, Wrench, ChevronRight, Clock,
  ClipboardList, Camera, FileBarChart, ArrowUpRight,
  MapPin,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUT_LABELS = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  en_pause: 'En pause',
  termine:  'Terminé',
  annule:   'Annulé',
};

const STATUT_CLASSES = {
  planifie: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-emerald-100 text-emerald-700',
  en_pause: 'bg-yellow-100 text-yellow-700',
  termine:  'bg-slate-100 text-slate-600',
  annule:   'bg-red-100 text-red-600',
};

const URGENCE_CLASSES = {
  rouge:  'border-red-400 bg-red-50 text-red-700',
  orange: 'border-orange-400 bg-orange-50 text-orange-700',
  bleu:   'border-blue-400 bg-blue-50 text-blue-700',
};

const URGENCE_DOT = {
  rouge:  'bg-red-500',
  orange: 'bg-orange-400',
  bleu:   'bg-blue-400',
};

const ACTIVITE_ICONS = {
  journal:  ClipboardList,
  photo:    Camera,
  incident: AlertTriangle,
};

const ACTIVITE_COLORS = {
  journal:  'bg-indigo-100 text-indigo-600',
  photo:    'bg-emerald-100 text-emerald-600',
  incident: 'bg-red-100 text-red-600',
};

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
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

// ─── SVG Circle Progress ──────────────────────────────────────────────────────

function CircleProgress({ value, size = 56, stroke = 5, color = '#10b981' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition">
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

  const budgetColor = budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f97316' : '#8b5cf6';

  return (
    <AppLayout>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.4); }
        }
        .anim-fade { animation: fadeIn 0.4s ease both; }
        .anim-pulse-dot { animation: pulse-dot 1.5s ease infinite; }
      `}</style>

      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── En-tête ── */}
        <div className="anim-fade flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-1 capitalize">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Bonjour {prenom} 👋
            </h1>
            {data?.entreprise_nom && (
              <p className="mt-1 text-gray-500 text-sm">{data.entreprise_nom}</p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button
              onClick={() => router.push('/chantiers/nouveau')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
            >
              <PlusCircle className="w-4 h-4" /> Nouveau chantier
            </button>
            <button
              onClick={() => router.push('/equipes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm shadow-violet-200"
            >
              <UserPlus className="w-4 h-4" /> Ajouter un ouvrier
            </button>
            <button
              onClick={() => router.push('/materiel')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition shadow-sm shadow-amber-200"
            >
              <Wrench className="w-4 h-4" /> Ajouter du matériel
            </button>
            <button
              onClick={() => router.push('/dashboard-projet/rapport-hebdo')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              <FileBarChart className="w-4 h-4" /> Rapport hebdo
            </button>
          </div>
        </div>

        {/* ── Section 1 — 4 KPIs ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

          {/* KPI 1 — Chantiers actifs */}
          <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4" style={{ animationDelay: '0.05s' }}>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Chantiers actifs</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.chantiers_en_cours ?? 0}</p>
              <p className="text-xs text-gray-400">{kpis.chantiers_total ?? 0} au total</p>
            </div>
          </div>

          {/* KPI 2 — Avancement moyen (SVG circle) */}
          <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4" style={{ animationDelay: '0.1s' }}>
            <div className="relative flex-shrink-0">
              <CircleProgress value={avancementMoyen} color="#10b981" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-700">
                {avancementMoyen}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Avancement moyen</p>
              <p className="text-2xl font-bold text-gray-900">{avancementMoyen}%</p>
              <p className="text-xs text-gray-400">{kpis.chantiers_termines ?? 0} terminés</p>
            </div>
          </div>

          {/* KPI 3 — Budget consommé */}
          <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Budget consommé</p>
                <p className="text-lg font-bold text-gray-900">{fmtCurrency(kpis.budget_total_depense)}</p>
                <p className="text-xs text-gray-400">/ {fmtCurrency(kpis.budget_total_prevu)} prévu</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">{budgetPct}% utilisé</span>
                {budgetPct >= 80 && <span className="text-xs font-semibold" style={{ color: budgetColor }}>⚠ Attention</span>}
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: budgetColor, transition: 'width 1s ease' }}
                />
              </div>
            </div>
          </div>

          {/* KPI 4 — Alertes (pulse si > 0) */}
          <div
            className={`anim-fade bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${alertes.length > 0 ? 'border-red-200' : 'border-gray-100'}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${alertes.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${alertes.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              {alertes.length > 0 && (
                <span className="anim-pulse-dot absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Alertes</p>
              <p className={`text-2xl font-bold ${alertes.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{alertes.length}</p>
              <p className="text-xs text-gray-400">{alertes.length > 0 ? 'non résolues' : 'Tout est en ordre'}</p>
            </div>
          </div>
        </div>

        {/* ── Section 2 — Chantiers en cards ── */}
        <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Mes chantiers <span className="text-gray-400 font-normal text-sm">({chantiers.length})</span>
            </h2>
            <button
              onClick={() => router.push('/chantiers')}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Voir tous <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {chantiers.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">
              Aucun chantier.{' '}
              <button onClick={() => router.push('/chantiers/nouveau')} className="text-indigo-600 hover:underline">
                Créer le premier
              </button>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {chantiers.map((c, idx) => {
                const prog    = Math.round(parseFloat(c.progression) || 0);
                const depPct  = c.budget_prevu > 0 ? Math.round((parseFloat(c.total_depense) / parseFloat(c.budget_prevu)) * 100) : 0;
                const retard  = c.date_fin_prevue && new Date(c.date_fin_prevue) < new Date() && !['termine', 'annule'].includes(c.statut);
                return (
                  <button
                    key={c.id_chantier}
                    onClick={() => router.push(`/chantiers/${c.id_chantier}`)}
                    className="anim-fade text-left bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl p-4 transition-all group"
                    style={{ animationDelay: `${0.3 + idx * 0.04}s` }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1.5">
                          {c.nom}
                          {retard && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="En retard" />}
                        </p>
                        {(c.client_nom || c.ville) && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[c.client_nom, c.ville].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${STATUT_CLASSES[c.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUT_LABELS[c.statut] || c.statut}
                      </span>
                    </div>

                    {/* Progression */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">Avancement</span>
                        <span className="text-xs font-semibold text-gray-700">{prog}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.min(prog, 100)}%`, transition: 'width 0.8s ease' }}
                        />
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${depPct >= 90 ? 'text-red-600' : 'text-gray-600'}`}>
                        {fmtCurrency(c.total_depense)} / {c.budget_prevu ? fmtCurrency(c.budget_prevu) : '—'}
                      </span>
                      {c.dernier_journal_date && (
                        <span className="text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.dernier_journal_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 3+4 — Alertes + Activité (2 colonnes) ── */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 mb-6">

          {/* Alertes */}
          <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                Alertes
                {alertes.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {alertes.length}
                  </span>
                )}
              </h2>
            </div>

            {alertes.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune alerte. Tout est en ordre.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {alertes.map(a => (
                  <button
                    key={a.id}
                    onClick={() => router.push(a.lien)}
                    className={`w-full flex items-start gap-3 px-5 py-3.5 text-left hover:brightness-95 transition border-l-4 ${URGENCE_CLASSES[a.urgence]}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${URGENCE_DOT[a.urgence]}`} />
                    <span className="text-xs leading-snug flex-1">{a.message}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activité récente */}
          <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ animationDelay: '0.4s' }}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Activité récente</h2>
            </div>

            {activite.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Aucune activité récente.</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {activite.map((a, i) => {
                  const Icon    = ACTIVITE_ICONS[a.type] || ClipboardList;
                  const iconCls = ACTIVITE_COLORS[a.type] || 'bg-gray-100 text-gray-500';
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <div className={`rounded-lg p-1.5 flex-shrink-0 ${iconCls}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-snug">
                          <span className="font-medium">{a.auteur}</span>
                          {a.type === 'journal' ? ' a rempli le journal' :
                           a.type === 'photo'   ? ' a ajouté une photo' :
                           ' a déclaré un incident'}
                          {' sur '}
                          <button
                            onClick={() => router.push(`/chantiers/${a.id_chantier}`)}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {a.chantier_nom}
                          </button>
                        </p>
                        {a.detail && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.detail}</p>}
                        <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(a.date_action)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 5 — Budget mensuel (bar chart CSS) ── */}
        <div className="anim-fade bg-white rounded-2xl border border-gray-100 shadow-sm p-6" style={{ animationDelay: '0.45s' }}>
          <h2 className="text-base font-semibold text-gray-900 mb-6">
            Dépenses mensuelles <span className="text-gray-400 font-normal text-sm">(6 derniers mois)</span>
          </h2>

          {chartData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Aucune dépense enregistrée.</p>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {chartData.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-gray-600 text-center leading-tight">
                    {fmtCurrency(b.total)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-indigo-500 hover:bg-indigo-600 transition-colors"
                    style={{ height: `${Math.max(b.pct, 4)}%`, minHeight: 6 }}
                  />
                  <span className="text-xs text-gray-400 truncate w-full text-center">
                    {b.mois_label?.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
