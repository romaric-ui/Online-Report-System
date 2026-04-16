'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, AlertTriangle, PlusCircle, ChevronDown } from 'lucide-react';

const TYPE_INCIDENT_OPTIONS = [
  { value: 'accident',             label: 'Accident' },
  { value: 'presqu_accident',      label: 'Presqu\'accident' },
  { value: 'situation_dangereuse', label: 'Situation dangereuse' },
];

const GRAVITE_OPTIONS = [
  
  { value: 'moyen',      label: 'Moyen',       cls: 'text-yellow-700 bg-yellow-50' },
  { value: 'grave',      label: 'Grave',       cls: 'text-orange-700 bg-orange-50' },
  { value: 'tres_grave', label: 'Très grave',  cls: 'text-red-700 bg-red-50' },
];

const GRAVITE_CLASSES = {
 
  moyen:      'bg-yellow-100 text-yellow-700',
  grave:      'bg-orange-100 text-orange-700',
  tres_grave: 'bg-red-100 text-red-700',
};

const GRAVITE_LABELS = { moyen: 'Moyen', grave: 'Grave', tres_grave: 'Très grave' };

const STATUT_OPTIONS = [
  { value: 'declare',    label: 'Déclaré' },
  { value: 'en_enquete', label: 'En enquête' },
  { value: 'clos',       label: 'Clos' },
];

const TYPE_LABELS = {
  accident:             'Accident',
  presqu_accident:      'Presqu\'accident',
  situation_dangereuse: 'Situation dangereuse',
};

const STATUT_CLASSES = {
  declare:    'bg-blue-100 text-blue-700',
  en_enquete: 'bg-orange-100 text-orange-700',
  clos:       'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = {
  type_incident: 'accident',
  gravite: 'benin',
  date_incident: '',
  lieu: '',
  description: '',
  victimes: '',
  temoins: '',
  causes: '',
  mesures_immediates: '',
  actions_correctives: '',
  jours_arret: 0,
};

export default function IncidentsPage({ params: paramsPromise }) {
  const params  = use(paramsPromise);
  const id      = params.id;
  const router  = useRouter();
  const { status } = useSession();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchIncidents();
  }, [status, id]);

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/chantiers/${id}/securite/incidents?limit=100`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de chargement');
      setIncidents(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.description.trim()) { setFormError('La description est requise.'); return; }
    if (!form.date_incident) { setFormError('La date est requise.'); return; }
    setSaving(true);
    try {
      const res  = await fetch(`/api/chantiers/${id}/securite/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de création');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchIncidents();
    } catch (err) {
      setFormError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const handleStatutChange = async (incidentId, newStatut) => {
    setUpdatingId(incidentId);
    try {
      const res  = await fetch(`/api/chantiers/${id}/securite/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      fetchIncidents();
    } catch (err) {
      setError(err.message || 'Erreur de mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* En-tête */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Incidents de sécurité</h1>
            <p className="mt-2 text-slate-500">Déclaration et suivi des incidents sur le chantier.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowForm(v => !v)}
              className="inline-flex items-center gap-2 rounded-3xl bg-red-500 px-5 py-3 text-white font-semibold hover:bg-red-600 transition"
            >
              <PlusCircle className="w-4 h-4" /> Déclarer un incident
            </button>
            <button
              type="button"
              onClick={() => router.push(`/chantiers/${id}/securite`)}
              className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
        )}

        {/* Formulaire de déclaration */}
        {showForm && (
          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-3xl bg-red-500 p-3 text-white shadow-md">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Déclarer un incident</h2>
                <p className="text-sm text-slate-500">Renseignez tous les détails de l'incident.</p>
              </div>
            </div>

            {formError && (
              <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-4">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Type d'incident *</span>
                  <select
                    value={form.type_incident}
                    onChange={handleChange('type_incident')}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {TYPE_INCIDENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Gravité *</span>
                  <select
                    value={form.gravite}
                    onChange={handleChange('gravite')}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  >
                    {GRAVITE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date et heure *</span>
                  <input
                    type="datetime-local"
                    value={form.date_incident}
                    onChange={handleChange('date_incident')}
                    required
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Lieu</span>
                  <input
                    type="text"
                    value={form.lieu}
                    onChange={handleChange('lieu')}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    placeholder="Zone, bâtiment, niveau..."
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Description *</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={handleChange('description')}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="Décrivez les circonstances de l'incident..."
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Victimes</span>
                  <input
                    type="text"
                    value={form.victimes}
                    onChange={handleChange('victimes')}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    placeholder="Noms, blessures..."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Témoins</span>
                  <input
                    type="text"
                    value={form.temoins}
                    onChange={handleChange('temoins')}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    placeholder="Noms des témoins..."
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Causes identifiées</span>
                <textarea
                  rows={2}
                  value={form.causes}
                  onChange={handleChange('causes')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="Causes directes et indirectes..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Mesures immédiates prises</span>
                <textarea
                  rows={2}
                  value={form.mesures_immediates}
                  onChange={handleChange('mesures_immediates')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="Premiers secours, mise en sécurité..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Actions correctives</span>
                <textarea
                  rows={2}
                  value={form.actions_correctives}
                  onChange={handleChange('actions_correctives')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  placeholder="Actions pour éviter la récidive..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Jours d'arrêt</span>
                <input
                  type="number"
                  min="0"
                  value={form.jours_arret}
                  onChange={handleChange('jours_arret')}
                  className="w-32 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-3xl bg-red-500 px-6 py-3 text-white font-semibold shadow-lg hover:bg-red-600 transition disabled:opacity-60"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Déclarer l\'incident'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des incidents */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Tous les incidents ({incidents.length})
          </h2>

          {loading ? (
            <p className="text-slate-600">Chargement...</p>
          ) : incidents.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
              Aucun incident déclaré pour ce chantier.
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(inc => (
                <div key={inc.id_incident} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GRAVITE_CLASSES[inc.gravite] || 'bg-slate-100 text-slate-600'}`}>
                          {GRAVITE_LABELS[inc.gravite] || inc.gravite}
                        </span>
                        <span className="rounded-full bg-slate-200 text-slate-700 px-3 py-1 text-xs font-semibold">
                          {TYPE_LABELS[inc.type_incident] || inc.type_incident}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(inc.date_incident).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{inc.description}</p>
                      {inc.lieu && <p className="text-sm text-slate-500 mt-1">Lieu : {inc.lieu}</p>}
                      {inc.jours_arret > 0 && (
                        <p className="text-sm text-red-600 mt-1 font-medium">{inc.jours_arret} jour(s) d'arrêt</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUT_CLASSES[inc.statut] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUT_OPTIONS.find(o => o.value === inc.statut)?.label || inc.statut}
                      </span>
                      <select
                        value={inc.statut}
                        disabled={updatingId === inc.id_incident}
                        onChange={e => handleStatutChange(inc.id_incident, e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 disabled:opacity-50"
                      >
                        {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
