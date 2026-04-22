'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, CheckCircle, ArrowLeft } from 'lucide-react';
import Modal from '../../../components/Modal';

const STATUS_LABELS = {
  a_faire:    'À faire',
  en_cours:   'En cours',
  en_attente: 'En attente',
  termine:    'Terminé',
};

const PRIORITY_LABELS = {
  basse:   'Basse',
  normale: 'Normale',
  haute:   'Haute',
  urgente: 'Urgente',
};

const STATUS_CLASSES = {
  a_faire:    'bg-slate-100 text-slate-700 border-slate-200',
  en_cours:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_attente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  termine:    'bg-slate-200 text-slate-700 border-slate-300',
};

const PRIORITY_CLASSES = {
  basse:   'bg-slate-100 text-slate-700',
  normale: 'bg-blue-100 text-blue-700',
  haute:   'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

const inputCls = 'w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 text-sm';

export default function ChantierTachesPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nom: '', description: '', date_debut: '', date_fin_prevue: '',
    priorite: 'normale', statut: 'a_faire',
  });
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchTasks();
  }, [status, id, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set('statut', statusFilter);
      const res = await fetch(`/api/chantiers/${id}/taches?${p.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger les tâches');
      setTasks(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const setField = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) { setError('Le nom de la tâche est requis.'); return; }
    if (form.date_debut && form.date_fin_prevue && form.date_fin_prevue < form.date_debut) {
      setError('La date de fin doit être supérieure ou égale à la date de début.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de la création de la tâche');
      setForm({ nom: '', description: '', date_debut: '', date_fin_prevue: '', priorite: 'normale', statut: 'a_faire' });
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (taskId, field, value) => {
    setUpdating((p) => ({ ...p, [taskId]: true }));
    try {
      const res = await fetch(`/api/chantiers/${id}/taches`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_tache: taskId, [field]: value }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de la mise à jour');
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Erreur de mise à jour');
    } finally {
      setUpdating((p) => ({ ...p, [taskId]: false }));
    }
  };

  const filteredTasks = useMemo(() => {
    if (!statusFilter) return tasks;
    return tasks.filter((t) => t.statut === statusFilter);
  }, [tasks, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">

        {/* ── En-tête ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Tâches</h1>
            <p className="mt-1 text-sm text-slate-500">Gérez les tâches du chantier et mettez à jour l'avancement.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition text-sm"
            >
              <Plus className="w-4 h-4" /> Nouvelle tâche
            </button>
            <button
              type="button"
              onClick={() => router.push(`/chantiers/${id}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>
        </div>

        {/* ── Filtre statut ── */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
          <span className="text-sm font-medium text-slate-600 shrink-0">Statut :</span>
          <div className="flex gap-2">
            {[['', 'Toutes'], ...Object.entries(STATUS_LABELS)].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition border ${
                  statusFilter === key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-5 text-sm">{error}</div>}

        {/* ── Liste tâches ── */}
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-600 text-sm border border-slate-200 shadow-sm">Chargement des tâches...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-600 border border-slate-200 shadow-sm">
            <p className="font-semibold mb-1">Aucune tâche</p>
            <p className="text-sm text-slate-500">Créez une tâche via le bouton "Nouvelle tâche".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id_tache} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">

                {/* ── Ligne titre + badges ── */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">{task.nom}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Fin prévue : {task.date_fin_prevue || 'Non définie'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[task.statut]}`}>
                      {STATUS_LABELS[task.statut] || task.statut}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_CLASSES[task.priorite]}`}>
                      {PRIORITY_LABELS[task.priorite] || 'Normale'}
                    </span>
                  </div>
                </div>

                {/* ── Barre progression ── */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-1.5">
                    <span>Avancement</span>
                    <span className="font-medium">{task.pourcentage ?? 0}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${task.pourcentage ?? 0}%` }} />
                  </div>
                </div>

                {/* ── Contrôles ── */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Modifier statut</span>
                    <select
                      value={task.statut}
                      onChange={(e) => handleUpdate(task.id_tache, 'statut', e.target.value)}
                      className={inputCls}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Pourcentage</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="100"
                        defaultValue={task.pourcentage ?? 0}
                        onBlur={(e) => handleUpdate(task.id_tache, 'pourcentage', Number(e.target.value))}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        disabled={updating[task.id_tache]}
                        className="shrink-0 rounded-3xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal nouvelle tâche ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle tâche" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Nom *</span>
            <input type="text" value={form.nom} onChange={setField('nom')} className={inputCls} required />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea value={form.description} onChange={setField('description')} rows={3} className={inputCls} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Date de début</span>
              <input type="date" value={form.date_debut} onChange={setField('date_debut')} className={inputCls} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Date fin prévue</span>
              <input type="date" value={form.date_fin_prevue} onChange={setField('date_fin_prevue')} className={inputCls} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Priorité</span>
              <select value={form.priorite} onChange={setField('priorite')} className={inputCls}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Statut</span>
              <select value={form.statut} onChange={setField('statut')} className={inputCls}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto rounded-3xl border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-50 transition text-sm font-medium">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60 text-sm">
              <CheckCircle className="w-4 h-4" />{saving ? 'Création...' : 'Ajouter la tâche'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
