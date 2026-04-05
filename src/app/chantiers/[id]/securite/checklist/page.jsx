'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';

const QUESTIONS_PAR_TYPE = {
  quotidienne: [
    { question: 'EPI portés par tous ?',          categorie: 'EPI' },
    { question: 'Zone de travail sécurisée ?',     categorie: 'Zone' },
    { question: 'Signalisation en place ?',        categorie: 'Zone' },
    { question: 'Extincteurs accessibles ?',       categorie: 'Incendie' },
    { question: 'Trousse de secours complète ?',   categorie: 'Secours' },
    { question: 'Échafaudages vérifiés ?',         categorie: 'Équipement' },
    { question: 'Machines en bon état ?',          categorie: 'Équipement' },
    { question: 'Briefing sécurité effectué ?',    categorie: 'Management' },
  ],
  ouverture: [
    { question: 'Plan de sécurité affiché ?',              categorie: 'Documentation' },
    { question: 'Périmètre de chantier clôturé ?',         categorie: 'Zone' },
    { question: 'Accès secours dégagé ?',                  categorie: 'Secours' },
    { question: 'Installations sanitaires en place ?',     categorie: 'Hygiène' },
    { question: 'Registre des accidents disponible ?',     categorie: 'Documentation' },
    { question: 'Coordonnées urgences affichées ?',        categorie: 'Secours' },
  ],
  specifique: [
    { question: 'Permis de travail signé ?',               categorie: 'Documentation' },
    { question: 'Zone de travail balisée ?',               categorie: 'Zone' },
    { question: 'Habilitations vérifiées ?',               categorie: 'Compétences' },
    { question: 'Risques identifiés et communiqués ?',     categorie: 'Management' },
  ],
  audit: [
    { question: 'Plan de prévention à jour ?',             categorie: 'Documentation' },
    { question: 'Registre sécurité tenu ?',                categorie: 'Documentation' },
    { question: 'Formations à jour pour tous ?',           categorie: 'Compétences' },
    { question: 'Équipements inspectés périodiquement ?',  categorie: 'Équipement' },
    { question: 'Procédures d\'urgence connues ?',         categorie: 'Secours' },
    { question: 'Actions correctives passées soldées ?',   categorie: 'Suivi' },
  ],
};

const REPONSE_OPTIONS = [
  { value: 'conforme',        label: 'Conforme',        cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'non_conforme',    label: 'Non conforme',    cls: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'non_applicable',  label: 'N/A',             cls: 'bg-slate-100 text-slate-600 border-slate-300' },
];

export default function ChecklistPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [typeChecklist, setTypeChecklist]   = useState('quotidienne');
  const [responses, setResponses]           = useState({});
  const [commentaires, setCommentaires]     = useState({});
  const [actionsCorrectives, setActionsCorrectives] = useState({});
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');

  const questions = QUESTIONS_PAR_TYPE[typeChecklist] || [];

  const handleTypeChange = (e) => {
    setTypeChecklist(e.target.value);
    setResponses({});
    setCommentaires({});
    setActionsCorrectives({});
  };

  const score = useMemo(() => {
    const applicable = questions.filter((_, i) => responses[i] !== 'non_applicable' && responses[i] !== undefined);
    const conformes  = applicable.filter((_, i) => {
      const idx = questions.indexOf(_);
      return responses[idx] === 'conforme';
    });
    if (applicable.length === 0) return null;
    return Math.round((conformes.length / applicable.length) * 100);
  }, [responses, questions]);

  // Calcul corrigé du score temps réel
  const realtimeScore = useMemo(() => {
    let applicable = 0;
    let conformes  = 0;
    questions.forEach((_, i) => {
      const r = responses[i];
      if (r && r !== 'non_applicable') {
        applicable++;
        if (r === 'conforme') conformes++;
      }
    });
    if (applicable === 0) return null;
    return Math.round((conformes / applicable) * 100);
  }, [responses, questions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== 'authenticated') { router.push('/'); return; }
    setSaving(true);
    setError('');

    try {
      const items = questions.map(q => ({ question: q.question, categorie: q.categorie }));

      // 1. Créer la checklist
      const resCreate = await fetch(`/api/chantiers/${id}/securite/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_checklist: typeChecklist, items }),
      });
      const jCreate = await resCreate.json();
      if (!resCreate.ok || !jCreate.success) throw new Error(jCreate.error?.message || 'Erreur création');
      const checklistId = jCreate.data.id_checklist;

      // 2. Récupérer les IDs des items
      const resFetch = await fetch(`/api/chantiers/${id}/securite/checklists/${checklistId}`);
      const jFetch   = await resFetch.json();
      if (!resFetch.ok || !jFetch.success) throw new Error(jFetch.error?.message || 'Erreur lecture');
      const createdItems = jFetch.data.items || [];

      // 3. Soumettre les réponses
      const itemsWithResponses = createdItems.map((item, i) => ({
        id_item:           item.id_item,
        reponse:           responses[i] || 'non_applicable',
        commentaire:       commentaires[i] || '',
        action_corrective: actionsCorrectives[i] || '',
      }));

      const resPut = await fetch(`/api/chantiers/${id}/securite/checklists/${checklistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsWithResponses }),
      });
      const jPut = await resPut.json();
      if (!resPut.ok || !jPut.success) throw new Error(jPut.error?.message || 'Erreur soumission');

      router.push(`/chantiers/${id}/securite`);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Nouvelle checklist</h1>
            <p className="mt-2 text-slate-500">Remplissez les contrôles de sécurité.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/chantiers/${id}/securite`)}
            className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du type */}
          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Type de checklist</h2>
                <p className="text-sm text-slate-500">Les questions s'adaptent au type sélectionné.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.keys(QUESTIONS_PAR_TYPE).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange({ target: { value: type } })}
                  className={`rounded-3xl px-5 py-2.5 text-sm font-semibold transition ${
                    typeChecklist === type
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Score temps réel */}
          <div className="rounded-[2rem] bg-white px-8 py-5 shadow-xl border border-slate-200 flex items-center justify-between">
            <span className="font-medium text-slate-700">Score en temps réel</span>
            {realtimeScore !== null ? (
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                realtimeScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                realtimeScore >= 50 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {realtimeScore}%
              </span>
            ) : (
              <span className="text-slate-400 text-sm">Répondez aux questions</span>
            )}
          </div>

          {/* Questions */}
          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Questions ({questions.length})</h2>

            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{q.question}</p>
                    {q.categorie && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 mt-1 inline-block">
                        {q.categorie}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {REPONSE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setResponses(prev => ({ ...prev, [i]: opt.value }))}
                        className={`rounded-2xl border px-3 py-1.5 text-xs font-semibold transition ${
                          responses[i] === opt.value
                            ? opt.cls + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {responses[i] && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">Commentaire</span>
                      <textarea
                        rows={2}
                        value={commentaires[i] || ''}
                        onChange={e => setCommentaires(prev => ({ ...prev, [i]: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        placeholder="Observations..."
                      />
                    </label>
                    {responses[i] === 'non_conforme' && (
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-red-600">Action corrective</span>
                        <textarea
                          rows={2}
                          value={actionsCorrectives[i] || ''}
                          onChange={e => setActionsCorrectives(prev => ({ ...prev, [i]: e.target.value }))}
                          className="w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm outline-none focus:border-red-400"
                          placeholder="Action à mettre en place..."
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-6 py-4 text-white font-semibold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
          >
            <CheckCircle className="w-5 h-5" />
            {saving ? 'Soumission en cours...' : 'Soumettre la checklist'}
          </button>
        </form>
      </div>
    </div>
  );
}
