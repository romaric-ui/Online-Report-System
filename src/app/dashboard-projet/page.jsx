'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2, Wallet, Users, TrendingUp, AlertTriangle, ShieldCheck,
  PlusCircle, UserPlus, Wrench, ChevronRight, Clock, Camera,
  ClipboardList, Calendar, ArrowUpRight,
} from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUT_LABELS = {
  planifie:  'Planifié',
  en_cours:  'En cours',
  en_pause:  'En pause',
  termine:   'Terminé',
  annule:    'Annulé',
};

const STATUT_CLASSES = {
  planifie:  'bg-blue-100 text-blue-700',
  en_cours:  'bg-emerald-100 text-emerald-700',
  en_pause:  'bg-yellow-100 text-yellow-700',
  termine:   'bg-slate-100 text-slate-600',
  annule:    'bg-red-100 text-red-600',
};

const URGENCE_CLASSES = {
  rouge:  'bg-red-50 border-red-200 text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  bleu:   'bg-blue-50 border-blue-200 text-blue-700',
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

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}

function fmtCurrency(n) {
  if (!n) return '—';
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

// ─── Composant KPI card ───────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, label, value, sub, progress, progressColor, alert }) {
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col gap-3 ${alert ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {progress !== undefined && (
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor || 'bg-blue-500'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardProjetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

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

  // Calcul du graphique budget
  const chartData = useMemo(() => {
    if (!data?.budget_par_mois?.length) return [];
    const max = Math.max(...data.budget_par_mois.map(b => parseFloat(b.total)));
    return data.budget_par_mois.map(b => ({
      ...b,
      pct: max > 0 ? (parseFloat(b.total) / max) * 100 : 0,
    }));
  }, [data?.budget_par_mois]);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

  const budgetPct = kpis.budget_total_prevu > 0
    ? Math.round((kpis.budget_total_depense / kpis.budget_total_prevu) * 100)
    : 0;

  const hseColor = kpis.score_hse_moyen === null ? 'text-gray-400'
    : kpis.score_hse_moyen >= 80 ? 'text-emerald-600'
    : kpis.score_hse_moyen >= 50 ? 'text-orange-500'
    : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── En-tête ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1 capitalize">{today}</p>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            {data?.entreprise_nom && (
              <p className="mt-1 text-gray-500 text-sm">{data.entreprise_nom}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/chantiers/nouveau')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200"
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
          </div>
        </div>

        {/* ── Section 1 — KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KpiCard
            icon={Building2}
            iconBg="bg-blue-100 text-blue-600"
            label="Chantiers actifs"
            value={kpis.chantiers_en_cours ?? 0}
            sub={`${kpis.chantiers_total ?? 0} au total · ${kpis.chantiers_termines ?? 0} terminés`}
            alert={kpis.chantiers_en_retard > 0}
          />
          <KpiCard
            icon={Wallet}
            iconBg="bg-emerald-100 text-emerald-600"
            label="Budget global"
            value={fmtCurrency(kpis.budget_total_depense)}
            sub={`/ ${fmtCurrency(kpis.budget_total_prevu)} prévu`}
            progress={budgetPct}
            progressColor={budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-orange-400' : 'bg-emerald-500'}
          />
          <KpiCard
            icon={Users}
            iconBg="bg-violet-100 text-violet-600"
            label="Présents aujourd'hui"
            value={`${kpis.ouvriers_pointes_aujourdhui ?? 0} / ${kpis.ouvriers_affectes ?? 0}`}
            sub={`${kpis.ouvriers_actifs ?? 0} ouvriers actifs`}
          />
          <KpiCard
            icon={TrendingUp}
            iconBg="bg-cyan-100 text-cyan-600"
            label="Taux de présence"
            value={`${kpis.taux_presence ?? 0}%`}
            progress={kpis.taux_presence}
            progressColor={
              (kpis.taux_presence ?? 0) >= 80 ? 'bg-emerald-500' :
              (kpis.taux_presence ?? 0) >= 50 ? 'bg-amber-400' : 'bg-red-500'
            }
          />
          <KpiCard
            icon={AlertTriangle}
            iconBg={(kpis.incidents_ouverts ?? 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}
            label="Incidents ouverts"
            value={kpis.incidents_ouverts ?? 0}
            sub="non clos"
            alert={(kpis.incidents_ouverts ?? 0) > 0}
          />
          <KpiCard
            icon={ShieldCheck}
            iconBg={
              kpis.score_hse_moyen === null ? 'bg-gray-100 text-gray-400' :
              kpis.score_hse_moyen >= 80    ? 'bg-emerald-100 text-emerald-600' :
              kpis.score_hse_moyen >= 50    ? 'bg-orange-100 text-orange-500' :
              'bg-red-100 text-red-600'
            }
            label="Score HSE"
            value={kpis.score_hse_moyen !== null ? `${kpis.score_hse_moyen}%` : '—'}
            sub="mois en cours"
          />
        </div>

        {/* ── Contenu principal (2 colonnes) ── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

          {/* Colonne principale */}
          <div className="space-y-6">

            {/* ── Section 2 — Chantiers ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Chantiers <span className="text-gray-400 font-normal text-sm">({chantiers.length})</span>
                </h2>
                <button
                  onClick={() => router.push('/chantiers')}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir tous <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {chantiers.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-500 text-sm">
                  Aucun chantier.{' '}
                  <button onClick={() => router.push('/chantiers/nouveau')} className="text-blue-600 hover:underline">
                    Créer le premier
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chantier</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progression</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tâches ⚠</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernier journal</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {chantiers.map(c => {
                        const depPct = c.budget_prevu > 0 ? Math.round((parseFloat(c.total_depense) / parseFloat(c.budget_prevu)) * 100) : 0;
                        const isEnRetard = c.date_fin_prevue && new Date(c.date_fin_prevue) < new Date() && !['termine','annule'].includes(c.statut);
                        const isBudgetAlert = depPct >= 90;

                        return (
                          <tr
                            key={c.id_chantier}
                            onClick={() => router.push(`/chantiers/${c.id_chantier}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium text-gray-900 flex items-center gap-1.5">
                                    {c.nom}
                                    {isEnRetard && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" title="En retard" />}
                                  </p>
                                  {c.reference && <p className="text-xs text-gray-400">Réf. {c.reference}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_CLASSES[c.statut] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUT_LABELS[c.statut] || c.statut}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${Math.min(parseFloat(c.progression) || 0, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-8 text-right">{Math.round(parseFloat(c.progression) || 0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className={`text-xs font-medium ${isBudgetAlert ? 'text-red-600' : 'text-gray-700'}`}>
                                {fmtCurrency(c.total_depense)}
                              </p>
                              <p className="text-xs text-gray-400">{c.budget_prevu ? `/ ${fmtCurrency(c.budget_prevu)}` : '—'}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              {parseInt(c.taches_en_retard, 10) > 0 ? (
                                <span className="inline-flex items-center rounded-full bg-red-100 text-red-600 px-2.5 py-1 text-xs font-semibold">
                                  {c.taches_en_retard} en retard
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">{c.nombre_taches} tâches</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-gray-400">
                              {c.dernier_journal_date
                                ? new Date(c.dernier_journal_date).toLocaleDateString('fr-FR')
                                : '—'}
                            </td>
                            <td className="px-4 py-3.5">
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Section 5 — Budget mensuel ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-6">
                Dépenses mensuelles <span className="text-gray-400 font-normal text-sm">(6 derniers mois)</span>
              </h2>

              {chartData.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucune dépense enregistrée.</p>
              ) : (
                <div className="flex items-end gap-3 h-36">
                  {chartData.map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-gray-700">
                        {fmtCurrency(b.total)}
                      </span>
                      <div className="w-full rounded-t-lg bg-blue-500 transition-all hover:bg-blue-600" style={{ height: `${Math.max(b.pct, 4)}%`, minHeight: 6 }} />
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {b.mois_label?.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Colonne latérale ── */}
          <div className="space-y-6">

            {/* Section 3 — Alertes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Alertes
                  {alertes.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
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
                      className={`w-full flex items-start gap-3 px-5 py-3.5 text-left hover:brightness-95 transition border-l-4 ${URGENCE_CLASSES[a.urgence]} ${a.urgence === 'rouge' ? 'border-l-red-500' : a.urgence === 'orange' ? 'border-l-orange-400' : 'border-l-blue-400'}`}
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${URGENCE_DOT[a.urgence]}`} />
                      <span className="text-xs leading-snug flex-1">{a.message}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4 — Activité récente */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Activité récente</h2>
              </div>

              {activite.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Aucune activité récente.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activite.map((a, i) => {
                    const Icon = ACTIVITE_ICONS[a.type] || ClipboardList;
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
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {a.chantier_nom}
                            </button>
                          </p>
                          {a.detail && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{a.detail}</p>
                          )}
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
        </div>
      </div>
    </div>
  );
}
