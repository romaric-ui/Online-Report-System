'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, BarChart3, Clock, AlertTriangle, Calendar, Link2 } from 'lucide-react';

// ─── Constantes Gantt ───────────────────────────────────────────────────────
const LEFT_WIDTH    = 220;
const ROW_HEIGHT    = 44;
const BAR_HEIGHT    = 24;
const HEADER_HEIGHT = 44;
const JALON_ROW_H   = 64;

const PX_PER_DAY = { day: 40, week: 8, month: 2 };
const TICK_STEP  = { day: 7, week: 30, month: 90 };

function formatTickDate(dayOffset, projectStartDate) {
  const d = new Date(projectStartDate || Date.now());
  d.setDate(d.getDate() + dayOffset);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function jalonOffsetDays(jalon, projectStartDate) {
  if (!projectStartDate) return 0;
  const diff = new Date(jalon.date_prevue) - new Date(projectStartDate);
  return Math.round(diff / 86400000);
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ChantierPlanningPage({ params: paramsPromise }) {
  const params   = use(paramsPromise);
  const id       = params.id;
  const router   = useRouter();
  const { status } = useSession();

  const [planning, setPlanning]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [zoom, setZoom]           = useState('week');

  // Formulaire dépendance
  const [depForm, setDepForm]     = useState({ id_predecesseur: '', id_successeur: '', type_lien: 'FS', delai_jours: 0 });
  const [savingDep, setSavingDep] = useState(false);
  const [depError, setDepError]   = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchPlanning();
  }, [status, id]);

  const fetchPlanning = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/chantiers/${id}/planning`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger le planning');
      setPlanning(json.data);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDep = async (e) => {
    e.preventDefault();
    setDepError('');
    setSavingDep(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_predecesseur: parseInt(depForm.id_predecesseur, 10),
          id_successeur:   parseInt(depForm.id_successeur,   10),
          type_lien:       depForm.type_lien,
          delai_jours:     parseInt(depForm.delai_jours, 10) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setDepForm({ id_predecesseur: '', id_successeur: '', type_lien: 'FS', delai_jours: 0 });
      fetchPlanning();
    } catch (err) {
      setDepError(err.message || 'Erreur inattendue');
    } finally {
      setSavingDep(false);
    }
  };

  // ─── Données dérivées ────────────────────────────────────────────────────
  const taches      = planning?.taches      || [];
  const dependances = planning?.dependances || [];
  const jalons      = planning?.jalons      || [];
  const resume      = planning?.resume      || {};

  const pxPerDay   = PX_PER_DAY[zoom];
  const tickStep   = TICK_STEP[zoom];
  const totalDays  = Math.max(resume.duree_totale || 0, 30);
  const ganttWidth = totalDays * pxPerDay + 120;

  // Ticks pour la frise
  const ticks = [];
  for (let d = 0; d <= totalDays + tickStep; d += tickStep) ticks.push(d);

  // Jalons avec leur position en jours
  const jalonsPositioned = jalons.map(j => ({
    ...j,
    _offsetDays: jalonOffsetDays(j, resume.date_debut_projet),
  }));

  // Index par id_tache pour les flèches SVG
  const taskIndexMap = new Map(taches.map((t, i) => [t.id_tache, i]));

  const hasJalons = jalonsPositioned.length > 0;

  // ─── Rendu ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-6">

        {/* En-tête page */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Planning — Diagramme de Gantt</h1>
            <p className="mt-2 text-slate-500">Chemin critique et dépendances entre les tâches du chantier.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/chantiers/${id}`)}
            className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement...</div>
        ) : (
          <>
            {/* Cards résumé */}
            <div className="grid gap-6 sm:grid-cols-3 mb-8">
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700"><Clock className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Durée totale</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{resume.duree_totale || 0} jours</p>
              </div>
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-red-100 p-2.5 text-red-700"><AlertTriangle className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Tâches critiques</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{resume.nb_taches_critiques || 0}</p>
                <p className="text-xs text-slate-500 mt-1">marge = 0 jour</p>
              </div>
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700"><Calendar className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Date fin estimée</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {resume.date_fin_estimee
                    ? new Date(resume.date_fin_estimee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>

            {/* Bloc Gantt */}
            <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200 mb-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Gantt</h2>
                    <p className="text-sm text-slate-500">
                      {taches.length} tâche{taches.length !== 1 ? 's' : ''} · {dependances.length} dépendance{dependances.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Zoom :</span>
                  {[['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois']].map(([z, label]) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoom(z)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${zoom === z ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Légende */}
              <div className="flex flex-wrap items-center gap-5 mb-4 text-sm text-slate-600">
                <span className="flex items-center gap-2"><span style={{ display: 'inline-block', width: 16, height: 10, borderRadius: 3, background: '#3b82f6' }} />Normal</span>
                <span className="flex items-center gap-2"><span style={{ display: 'inline-block', width: 16, height: 10, borderRadius: 3, background: '#ef4444' }} />Critique</span>
                <span className="flex items-center gap-2"><span style={{ display: 'inline-block', width: 16, height: 5, borderRadius: 3, background: '#cbd5e1' }} />Marge</span>
                <span className="flex items-center gap-2">
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#f59e0b', transform: 'rotate(45deg)' }} />
                  <span style={{ marginLeft: 4 }}>Jalon</span>
                </span>
              </div>

              {taches.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
                  Aucune tâche définie.{' '}
                  <button onClick={() => router.push(`/chantiers/${id}/taches`)} className="text-indigo-600 hover:underline">
                    Créer des tâches
                  </button>
                </div>
              ) : (
                /* ── Diagramme de Gantt ── */
                <div
                  style={{
                    overflow: 'auto',
                    maxHeight: 580,
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                  }}
                >
                  <div style={{ minWidth: LEFT_WIDTH + ganttWidth }}>

                    {/* Frise temporelle (sticky top) */}
                    <div style={{
                      display: 'flex',
                      height: HEADER_HEIGHT,
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                      background: 'white',
                      borderBottom: '1px solid #e2e8f0',
                    }}>
                      {/* Coin haut-gauche sticky */}
                      <div style={{
                        minWidth: LEFT_WIDTH,
                        position: 'sticky',
                        left: 0,
                        zIndex: 21,
                        background: 'white',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 14,
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#374151',
                      }}>
                        Tâche
                      </div>
                      {/* Ticks */}
                      <div style={{ position: 'relative', flex: 1, minWidth: ganttWidth }}>
                        {ticks.map(day => (
                          <div
                            key={day}
                            style={{
                              position: 'absolute',
                              left: day * pxPerDay,
                              top: 0,
                              bottom: 0,
                              borderLeft: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              paddingLeft: 4,
                            }}
                          >
                            <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                              {formatTickDate(day, resume.date_debut_projet)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lignes de tâches */}
                    <div style={{ position: 'relative' }}>
                      {taches.map((t, i) => {
                        const rowBg = i % 2 === 0 ? 'white' : '#f8fafc';
                        const barLeft  = (t.ES || 0) * pxPerDay;
                        const barWidth = Math.max((t.duree_jours || 0) * pxPerDay, pxPerDay > 4 ? 4 : 2);
                        const margeLeft  = (t.EF || 0) * pxPerDay;
                        const margeWidth = (t.marge_jours || 0) * pxPerDay;

                        return (
                          <div
                            key={t.id_tache}
                            style={{
                              display: 'flex',
                              height: ROW_HEIGHT,
                              borderBottom: '1px solid #f1f5f9',
                              background: rowBg,
                            }}
                          >
                            {/* Nom de la tâche (sticky gauche) */}
                            <div style={{
                              minWidth: LEFT_WIDTH,
                              position: 'sticky',
                              left: 0,
                              zIndex: 10,
                              background: rowBg,
                              borderRight: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              paddingLeft: 12,
                              paddingRight: 8,
                              gap: 6,
                              overflow: 'hidden',
                            }}>
                              {t.est_critique && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                              )}
                              <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1e293b' }}>
                                {t.nom}
                              </span>
                              {(t.duree_jours || 0) > 0 && (
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                                  {t.duree_jours}j
                                </span>
                              )}
                            </div>

                            {/* Zone barres */}
                            <div style={{ position: 'relative', flex: 1, minWidth: ganttWidth }}>
                              {/* Lignes de grille verticales */}
                              {ticks.map(day => (
                                <div key={day} style={{ position: 'absolute', left: day * pxPerDay, top: 0, bottom: 0, borderLeft: '1px solid #f1f5f9' }} />
                              ))}

                              {/* Barre principale */}
                              <div style={{
                                position: 'absolute',
                                left: barLeft,
                                top: (ROW_HEIGHT - BAR_HEIGHT) / 2,
                                width: barWidth,
                                height: BAR_HEIGHT,
                                background: t.est_critique ? '#ef4444' : (t.couleur || '#3b82f6'),
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: 6,
                                overflow: 'hidden',
                                boxShadow: t.est_critique ? '0 1px 4px rgba(239,68,68,0.3)' : '0 1px 4px rgba(59,130,246,0.2)',
                              }}>
                                {barWidth > 50 && (
                                  <span style={{ fontSize: 11, color: 'white', whiteSpace: 'nowrap' }}>
                                    {t.nom}
                                  </span>
                                )}
                              </div>

                              {/* Barre de marge */}
                              {margeWidth > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  left: margeLeft,
                                  top: (ROW_HEIGHT + BAR_HEIGHT) / 2 - 3,
                                  width: margeWidth,
                                  height: 4,
                                  background: '#cbd5e1',
                                  borderRadius: 4,
                                }} />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* SVG — flèches de dépendance */}
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: LEFT_WIDTH,
                          width: ganttWidth,
                          height: taches.length * ROW_HEIGHT,
                          pointerEvents: 'none',
                          overflow: 'visible',
                          zIndex: 15,
                        }}
                      >
                        <defs>
                          <marker id="gantt-arrow" markerWidth="7" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0, 7 3, 0 6" fill="#94a3b8" />
                          </marker>
                        </defs>
                        {dependances.map((dep, idx) => {
                          const predIdx = taskIndexMap.get(dep.id_predecesseur);
                          const succIdx = taskIndexMap.get(dep.id_successeur);
                          if (predIdx === undefined || succIdx === undefined) return null;
                          const pred = taches[predIdx];
                          const succ = taches[succIdx];
                          const x1 = (pred.EF || 0) * pxPerDay;
                          const y1 = predIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                          const x2 = (succ.ES || 0) * pxPerDay;
                          const y2 = succIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                          const bend = Math.min(40, Math.abs(x2 - x1) / 2);
                          return (
                            <path
                              key={idx}
                              d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`}
                              stroke="#94a3b8"
                              strokeWidth="1.5"
                              fill="none"
                              markerEnd="url(#gantt-arrow)"
                              opacity="0.75"
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* Ligne de jalons */}
                    {hasJalons && (
                      <div style={{
                        display: 'flex',
                        height: JALON_ROW_H,
                        borderTop: '1px solid #e2e8f0',
                        background: '#fffbeb',
                      }}>
                        <div style={{
                          minWidth: LEFT_WIDTH,
                          position: 'sticky',
                          left: 0,
                          zIndex: 10,
                          background: '#fffbeb',
                          borderRight: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#92400e',
                        }}>
                          Jalons
                        </div>
                        <div style={{ position: 'relative', flex: 1, minWidth: ganttWidth }}>
                          {jalonsPositioned.map(j => {
                            const jalonColor =
                              j.statut === 'atteint'   ? '#10b981' :
                              j.statut === 'en_retard' ? '#ef4444' : '#f59e0b';
                            return (
                              <div
                                key={j.id_jalon}
                                style={{
                                  position: 'absolute',
                                  left: j._offsetDays * pxPerDay,
                                  top: 0,
                                  transform: 'translateX(-50%)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                }}
                              >
                                {/* Ligne verticale */}
                                <div style={{ width: 1, height: JALON_ROW_H, background: jalonColor, opacity: 0.4, position: 'absolute', top: 0 }} />
                                {/* Losange */}
                                <div style={{
                                  width: 14,
                                  height: 14,
                                  background: jalonColor,
                                  transform: 'rotate(45deg)',
                                  marginTop: 6,
                                  position: 'relative',
                                  zIndex: 1,
                                }} />
                                {/* Label */}
                                <div style={{
                                  marginTop: 10,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  color: '#374151',
                                  position: 'relative',
                                  zIndex: 1,
                                }}>
                                  {j.nom}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formulaire — ajouter une dépendance */}
            {taches.length >= 2 && (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-3xl bg-slate-700 p-3 text-white shadow-md">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Ajouter une dépendance</h2>
                    <p className="text-sm text-slate-500">Définissez les liens de précédence entre tâches.</p>
                  </div>
                </div>

                {depError && (
                  <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-4">{depError}</div>
                )}

                <form onSubmit={handleAddDep} className="flex flex-wrap gap-4 items-end">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Prédécesseur *</span>
                    <select
                      required
                      value={depForm.id_predecesseur}
                      onChange={e => setDepForm(p => ({ ...p, id_predecesseur: e.target.value }))}
                      className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 min-w-[180px]"
                    >
                      <option value="">— Sélectionner —</option>
                      {taches.map(t => <option key={t.id_tache} value={t.id_tache}>{t.nom}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Successeur *</span>
                    <select
                      required
                      value={depForm.id_successeur}
                      onChange={e => setDepForm(p => ({ ...p, id_successeur: e.target.value }))}
                      className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 min-w-[180px]"
                    >
                      <option value="">— Sélectionner —</option>
                      {taches.map(t => <option key={t.id_tache} value={t.id_tache}>{t.nom}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Type de lien</span>
                    <select
                      value={depForm.type_lien}
                      onChange={e => setDepForm(p => ({ ...p, type_lien: e.target.value }))}
                      className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    >
                      <option value="FS">FS — Fin → Début</option>
                      <option value="FF">FF — Fin → Fin</option>
                      <option value="SS">SS — Début → Début</option>
                      <option value="SF">SF — Début → Fin</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Délai (jours)</span>
                    <input
                      type="number"
                      min="0"
                      value={depForm.delai_jours}
                      onChange={e => setDepForm(p => ({ ...p, delai_jours: e.target.value }))}
                      className="block w-24 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={savingDep}
                    className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
                  >
                    <Link2 className="w-4 h-4" />
                    {savingDep ? 'Ajout...' : 'Ajouter'}
                  </button>
                </form>

                {/* Liste des dépendances existantes */}
                {dependances.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Dépendances existantes ({dependances.length})
                    </h3>
                    <div className="space-y-2">
                      {dependances.map((dep, i) => {
                        const pred = taches.find(t => t.id_tache === dep.id_predecesseur);
                        const succ = taches.find(t => t.id_tache === dep.id_successeur);
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm">
                            <span className="font-medium text-slate-800 truncate">{pred?.nom || `#${dep.id_predecesseur}`}</span>
                            <span className="text-slate-400 shrink-0">→</span>
                            <span className="font-medium text-slate-800 truncate">{succ?.nom || `#${dep.id_successeur}`}</span>
                            <span className="shrink-0 rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                              {dep.type_lien}
                            </span>
                            {(dep.delai_jours || 0) > 0 && (
                              <span className="shrink-0 text-slate-500">+{dep.delai_jours}j</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
