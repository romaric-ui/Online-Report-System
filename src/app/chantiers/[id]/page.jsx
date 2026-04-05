'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Grid, ClipboardList, CalendarDays, MapPin, Wallet, SlidersHorizontal, CheckCircle, Activity, Compass, Camera, FileText, Users, Wrench, BarChart3 } from 'lucide-react';

const STATUS_LABELS = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  en_pause: 'En pause',
  termine: 'Terminé',
  annule: 'Annulé',
};

const STATUS_CLASSES = {
  planifie: 'bg-blue-100 text-blue-700 border-blue-200',
  en_cours: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_pause: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  termine: 'bg-slate-100 text-slate-700 border-slate-200',
  annule: 'bg-red-100 text-red-700 border-red-200',
};

function getProgressColor(value) {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 40) return 'bg-blue-500';
  if (value >= 15) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function ChantierDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();
  const [chantier, setChantier] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadChantier();
      loadTasks();
    }
  }, [status, id]);

  const loadChantier = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Impossible de charger le chantier');
      }
      setChantier(json.data);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/chantiers/${id}/taches?statut=en_cours`);
      const json = await res.json();
      setTasks(json.data || []);
    } catch (err) {
      console.error(err);
      setTasks([]);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 text-slate-600 mb-6">
          <button type="button" onClick={() => router.push('/chantiers')} className="inline-flex items-center gap-2 text-sm font-medium hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
          {loading ? (
            <div className="text-center text-slate-600">Chargement du chantier...</div>
          ) : error ? (
            <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">{error}</div>
          ) : chantier ? (
            <>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-3xl bg-indigo-600 p-4 text-white shadow-lg">
                      <Grid className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-slate-900">{chantier.nom}</h1>
                      <p className="mt-2 text-sm text-slate-500">Réf. {chantier.reference || '—'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_CLASSES[chantier.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {STATUS_LABELS[chantier.statut] || 'Inconnu'}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/journal`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Journal
                  </button>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/photos`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Photos
                  </button>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/taches`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Tâches
                  </button>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/equipe`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <Users className="w-4 h-4" /> Équipe
                  </button>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/materiel`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Matériel
                  </button>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/budget`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Budget
                  </button>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/planning`)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Planning
                  </button>
                  <button type="button" onClick={() => alert('Édition à venir') } className="rounded-3xl border border-slate-200 bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition inline-flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> Modifier
                  </button>
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] bg-slate-50 p-6 border border-slate-200">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">Client</span>
                    </div>
                    <p className="text-slate-800 text-lg">{chantier.client_nom || 'Non renseigné'}</p>
                    <p className="text-slate-500">{chantier.client_email || 'Email non renseigné'}</p>
                    <p className="text-slate-500">{chantier.client_telephone || 'Téléphone non renseigné'}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin className="w-5 h-5" />
                      <span className="font-semibold">Adresse</span>
                    </div>
                    <p className="text-slate-800">{chantier.adresse || 'Adresse non renseignée'}</p>
                    <p className="text-slate-500">{chantier.ville || 'Ville non renseignée'}</p>
                    <p className="text-slate-500">{chantier.pays || 'Pays non renseigné'}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                      <CalendarDays className="w-4 h-4" />
                      <span className="text-sm">Dates</span>
                    </div>
                    <p className="text-slate-900 font-semibold">Début : {chantier.date_debut || '—'}</p>
                    <p className="text-slate-900 font-semibold">Fin prévue : {chantier.date_fin_prevue || '—'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                      <Wallet className="w-4 h-4" />
                      <span className="text-sm">Budget prévu</span>
                    </div>
                    <p className="text-slate-900 font-semibold">{chantier.budget_prevu ? `${chantier.budget_prevu} €` : 'Non renseigné'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 text-slate-500 mb-3">
                      <Compass className="w-4 h-4" />
                      <span className="text-sm">Progression</span>
                    </div>
                    <p className="text-slate-900 font-semibold">{parseFloat(chantier.progression || 0).toFixed(1)}%</p>
                    <div className="mt-3 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${getProgressColor(chantier.progression || 0)}`} style={{ width: `${chantier.progression || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-3">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Tâches totales</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{chantier.tache_count ?? 0}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-3">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Photos</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{chantier.photo_count ?? 0}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-3">
                    <Activity className="w-5 h-5" />
                    <span className="text-sm">Dernier journal</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{chantier.dernier_journal_date || 'Aucun'}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Progression</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{parseFloat(chantier.progression || 0).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] bg-slate-50 p-6 border border-slate-200">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Tâches en cours</h2>
                    <p className="text-sm text-slate-500">Les 5 dernières tâches actives.</p>
                  </div>
                  <button type="button" onClick={() => router.push(`/chantiers/${id}/taches`)} className="rounded-3xl bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition">
                    Voir toutes
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <div className="rounded-3xl bg-white p-6 text-slate-600 text-center">Aucune tâche en cours pour l'instant.</div>
                ) : (
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id_tache} className="rounded-3xl bg-white p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <p className="text-lg font-semibold text-slate-900">{task.nom}</p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{task.statut?.replace('_', ' ') || '—'}</span>
                        </div>
                        <div className="text-sm text-slate-500">Priorité : {task.priorite || 'normale'}</div>
                        <div className="mt-3 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${getProgressColor(task.pourcentage || 0)}`} style={{ width: `${task.pourcentage || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
