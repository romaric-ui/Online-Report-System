'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, AlertTriangle, ClipboardList, Calendar, PlusCircle } from 'lucide-react';

const TYPE_CHECKLIST_LABELS = {
  quotidienne: 'Quotidienne',
  ouverture:   'Ouverture',
  specifique:  'Spécifique',
  audit:       'Audit',
};

const STATUT_CHECKLIST_CLASSES = {
  en_cours:      'bg-blue-100 text-blue-700',
  complete:      'bg-emerald-100 text-emerald-700',
  non_conforme:  'bg-red-100 text-red-700',
};

const TYPE_INCIDENT_LABELS = {
  accident:             'Accident',
  presqu_accident:      'Presqu\'accident',
  situation_dangereuse: 'Situation dangereuse',
};

const GRAVITE_CLASSES = {
  benin:      'bg-emerald-100 text-emerald-700',
  moyen:      'bg-yellow-100 text-yellow-700',
  grave:      'bg-orange-100 text-orange-700',
  tres_grave: 'bg-red-100 text-red-700',
};

const GRAVITE_LABELS = {
  benin:      'Bénin',
  moyen:      'Moyen',
  grave:      'Grave',
  tres_grave: 'Très grave',
};

const STATUT_INCIDENT_LABELS = {
  declare:    'Déclaré',
  en_enquete: 'En enquête',
  clos:       'Clos',
};

function scoreBadgeClass(score) {
  if (score === null || score === undefined) return 'bg-slate-100 text-slate-600';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 50) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export default function SecuriteDashboardPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [checklists, setChecklists] = useState([]);
  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') loadData();
  }, [status, id]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resC, resI] = await Promise.all([
        fetch(`/api/chantiers/${id}/securite/checklists?limit=100`),
        fetch(`/api/chantiers/${id}/securite/incidents?limit=100`),
      ]);
      const [jC, jI] = await Promise.all([resC.json(), resI.json()]);
      if (!resC.ok || !jC.success) throw new Error(jC.error?.message || 'Erreur checklists');
      if (!resI.ok || !jI.success) throw new Error(jI.error?.message || 'Erreur incidents');
      setChecklists(jC.data || []);
      setIncidents(jI.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const withScore = checklists.filter(c => c.score !== null && c.score !== undefined);
    const avgScore  = withScore.length > 0
      ? withScore.reduce((s, c) => s + parseFloat(c.score), 0) / withScore.length
      : null;

    const incidentsOuverts = incidents.filter(i => ['declare', 'en_enquete'].includes(i.statut)).length;

    const sorted = [...incidents].sort((a, b) => new Date(b.date_incident) - new Date(a.date_incident));
    const last   = sorted[0];
    const joursSansAccident = last
      ? Math.floor((Date.now() - new Date(last.date_incident)) / 86400000)
      : null;

    const now = new Date();
    const checklistsMois = checklists.filter(c => {
      const d = new Date(c.date_checklist);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return { avgScore, incidentsOuverts, joursSansAccident, checklistsMois };
  }, [checklists, incidents]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* En-tête */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Sécurité HSE</h1>
            <p className="mt-2 text-slate-500">Checklists de conformité et suivi des incidents.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/chantiers/${id}`)}
            className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement...</div>
        ) : (
          <>
            {/* Cards stats */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700"><ShieldCheck className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Score moyen</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.avgScore !== null ? `${stats.avgScore.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-red-100 p-2.5 text-red-700"><AlertTriangle className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Incidents ouverts</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.incidentsOuverts}</p>
              </div>
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-700"><Calendar className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Jours sans accident</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.joursSansAccident !== null ? stats.joursSansAccident : '—'}
                </p>
              </div>
              <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-2xl bg-indigo-100 p-2.5 text-indigo-700"><ClipboardList className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-slate-500">Checklists ce mois</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.checklistsMois}</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {/* Checklists récentes */}
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Checklists récentes</h2>
                      <p className="text-sm text-slate-500">{checklists.length} au total</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/chantiers/${id}/securite/checklist`)}
                    className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-4 py-2.5 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                  >
                    <PlusCircle className="w-4 h-4" /> Nouvelle
                  </button>
                </div>

                {checklists.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-600">Aucune checklist créée.</div>
                ) : (
                  <div className="space-y-3">
                    {checklists.slice(0, 5).map(c => (
                      <div key={c.id_checklist} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {TYPE_CHECKLIST_LABELS[c.type_checklist] || c.type_checklist}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(c.date_checklist).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.score !== null && c.score !== undefined && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scoreBadgeClass(c.score)}`}>
                              {parseFloat(c.score).toFixed(0)}%
                            </span>
                          )}
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_CHECKLIST_CLASSES[c.statut] || 'bg-slate-100 text-slate-600'}`}>
                            {c.statut === 'en_cours' ? 'En cours' : c.statut === 'complete' ? 'Complète' : 'Non conforme'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incidents récents */}
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-red-500 p-3 text-white shadow-md">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Incidents récents</h2>
                      <p className="text-sm text-slate-500">{incidents.length} au total</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/chantiers/${id}/securite/incidents`)}
                    className="inline-flex items-center gap-2 rounded-3xl bg-red-500 px-4 py-2.5 text-white text-sm font-semibold hover:bg-red-600 transition"
                  >
                    <PlusCircle className="w-4 h-4" /> Déclarer
                  </button>
                </div>

                {incidents.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-600">Aucun incident déclaré.</div>
                ) : (
                  <div className="space-y-3">
                    {incidents.slice(0, 5).map(inc => (
                      <div key={inc.id_incident} className="flex items-start justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <div className="min-w-0 mr-4">
                          <p className="font-medium text-slate-800 text-sm truncate">
                            {inc.description?.substring(0, 60)}{inc.description?.length > 60 ? '…' : ''}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(inc.date_incident).toLocaleDateString('fr-FR')} · {TYPE_INCIDENT_LABELS[inc.type_incident] || inc.type_incident}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${GRAVITE_CLASSES[inc.gravite] || 'bg-slate-100 text-slate-600'}`}>
                            {GRAVITE_LABELS[inc.gravite] || inc.gravite}
                          </span>
                          <span className="rounded-full bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                            {STATUT_INCIDENT_LABELS[inc.statut] || inc.statut}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
