'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, CheckCircle, Circle, Edit3, ArrowLeft } from 'lucide-react';

const STATUS_LABELS = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  en_attente: 'En attente',
  termine: 'Terminé',
};

const PRIORITY_LABELS = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

const STATUS_CLASSES = {
  a_faire: 'bg-slate-100 text-slate-700 border-slate-200',
  en_cours: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_attente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  termine: 'bg-slate-200 text-slate-700 border-slate-300',
};

const PRIORITY_CLASSES = {
  basse: 'bg-slate-100 text-slate-700',
  normale: 'bg-blue-100 text-blue-700',
  haute: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

export default function ChantierTachesPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    nom: '',
    description: '',
    date_debut: '',
    date_fin_prevue: '',
    priorite: 'normale',
    statut: 'a_faire',
  });
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status, id, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('statut', statusFilter);
      const res = await fetch(`/api/chantiers/${id}/taches?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Impossible de charger les tâches');
      }
      setTasks(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.nom.trim()) {
      setError('Le nom de la tâche est requis.');
      return;
    }
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
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Erreur lors de la création de la tâche');
      }
      setForm({ nom: '', description: '', date_debut: '', date_fin_prevue: '', priorite: 'normale', statut: 'a_faire' });
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (taskId, field, value) => {
    setUpdating((prev) => ({ ...prev, [taskId]: true }));
    try {
      const payload = { id_tache: taskId, [field]: value };
      const res = await fetch(`/api/chantiers/${id}/taches`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Erreur lors de la mise à jour');
      }
      fetchTasks();
    } catch (err) {
      setError(err.message || 'Erreur de mise à jour');
    } finally {
      setUpdating((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const filteredTasks = useMemo(() => {
    if (!statusFilter) return tasks;
    return tasks.filter((task) => task.statut === statusFilter);
  }, [tasks, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Tâches</h1>
            <p className="mt-2 text-slate-500">Gérez les tâches du chantier et mettez à jour l’avancement.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.65fr_0.35fr] mb-8">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Liste des tâches</h2>
                <p className="text-sm text-slate-500">Filtrez et mettez à jour rapidement les tâches.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Statut</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
                  <option value="">Toutes</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
            ) : null}

            {loading ? (
              <p className="text-slate-600">Chargement des tâches...</p>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">Aucune tâche trouvée.</div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div key={task.id_tache} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{task.nom}</h3>
                        <p className="mt-2 text-sm text-slate-500">Fin prévue : {task.date_fin_prevue || 'Non définie'}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[task.statut]}`}>
                          {STATUS_LABELS[task.statut] || task.statut}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_CLASSES[task.priorite]}`}>
                          {PRIORITY_LABELS[task.priorite] || 'Normale'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                          <span>Avancement</span>
                          <span>{task.pourcentage ?? 0}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${task.pourcentage ?? 0}%` }} />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Modifier statut</span>
                          <select
                            value={task.statut}
                            onChange={(e) => handleUpdate(task.id_tache, 'statut', e.target.value)}
                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                          >
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Pourcentage</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={task.pourcentage ?? 0}
                              onBlur={(e) => handleUpdate(task.id_tache, 'pourcentage', Number(e.target.value))}
                              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                            />
                            <button type="button" disabled={updating[task.id_tache]} className="inline-flex items-center rounded-3xl bg-indigo-600 px-4 py-3 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Nouvelle tâche</h2>
                <p className="text-sm text-slate-500">Ajoutez une tâche à votre chantier.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nom *</span>
                <input type="text" value={form.nom} onChange={handleFormChange('nom')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea value={form.description} onChange={handleFormChange('description')} rows={4} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
              </label>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date de début</span>
                  <input type="date" value={form.date_debut} onChange={handleFormChange('date_debut')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date fin prévue</span>
                  <input type="date" value={form.date_fin_prevue} onChange={handleFormChange('date_fin_prevue')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500" />
                </label>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Priorité</span>
                  <select value={form.priorite} onChange={handleFormChange('priorite')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Statut</span>
                  <select value={form.statut} onChange={handleFormChange('statut')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60">
                <CheckCircle className="w-4 h-4" /> {saving ? 'Création...' : 'Ajouter la tâche'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
