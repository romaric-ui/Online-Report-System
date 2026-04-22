'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Grid, CalendarDays, MapPin, Wallet, SlidersHorizontal,
  CheckCircle, Activity, Compass, Camera, FileText, Users, Wrench,
  BarChart3, ShieldCheck, FolderOpen, MessageCircle, Clock,
  LayoutDashboard, BookOpen, CheckSquare,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';

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

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

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
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') { loadChantier(); loadTasks(); }
  }, [status, id]);

  const loadChantier = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger le chantier');
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

  const tabs = [
    { label: 'Vue d\'ensemble', icon: LayoutDashboard, href: `/chantiers/${id}`, active: true },
    { label: 'Journal', icon: BookOpen, href: `/chantiers/${id}/journal` },
    { label: 'Photos', icon: Camera, href: `/chantiers/${id}/photos` },
    { label: 'Tâches', icon: CheckSquare, href: `/chantiers/${id}/taches` },
    { label: 'Équipe', icon: Users, href: `/chantiers/${id}/equipe` },
    { label: 'Pointage', icon: Clock, href: `/chantiers/${id}/pointage` },
    { label: 'Matériel', icon: Wrench, href: `/chantiers/${id}/materiel` },
    { label: 'Budget', icon: Wallet, href: `/chantiers/${id}/budget` },
    { label: 'Planning', icon: BarChart3, href: `/chantiers/${id}/planning` },
    { label: 'Sécurité', icon: ShieldCheck, href: `/chantiers/${id}/securite` },
    { label: 'Documents', icon: FolderOpen, href: `/chantiers/${id}/documents` },
    { label: 'Discussion', icon: MessageCircle, href: `/chantiers/${id}/chat` },
  ];

  return (
    <AppLayout>
      {/* Tabs horizontaux */}
      <div className="bg-white border-b border-gray-200 sticky top-0 md:top-0 z-20">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-4">
            {tabs.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab.active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-600">Chargement du chantier...</div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">{error}</div>
        ) : chantier ? (
          <>
            {/* En-tête */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-xl bg-indigo-600 p-3 text-white shadow-md">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{chantier.nom}</h1>
                    <p className="text-sm text-slate-500">Réf. {chantier.reference || '—'}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_CLASSES[chantier.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {STATUS_LABELS[chantier.statut] || 'Inconnu'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => alert('Édition à venir')}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow"
              >
                <SlidersHorizontal className="w-4 h-4" /> Modifier
              </button>
            </div>

            {/* Infos client + adresse */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm mb-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">Client</span>
                  </div>
                  <p className="text-slate-800 font-medium">{chantier.client_nom || 'Non renseigné'}</p>
                  <p className="text-slate-500 text-sm">{chantier.client_email || 'Email non renseigné'}</p>
                  <p className="text-slate-500 text-sm">{chantier.client_telephone || 'Téléphone non renseigné'}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold text-sm">Adresse</span>
                  </div>
                  <p className="text-slate-800 font-medium">{chantier.adresse || 'Non renseignée'}</p>
                  <p className="text-slate-500 text-sm">{chantier.ville || '—'}</p>
                  <p className="text-slate-500 text-sm">{chantier.pays || '—'}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs font-medium">Dates</span>
                  </div>
                  <p className="text-slate-900 text-sm font-semibold">Début : {fmtDate(chantier.date_debut)}</p>
                  <p className="text-slate-900 text-sm font-semibold">Fin prévue : {fmtDate(chantier.date_fin_prevue)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs font-medium">Budget prévu</span>
                  </div>
                  <p className="text-slate-900 text-sm font-semibold">
                    {chantier.budget_prevu ? `${chantier.budget_prevu} €` : 'Non renseigné'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Compass className="w-4 h-4" />
                    <span className="text-xs font-medium">Progression</span>
                  </div>
                  <p className="text-slate-900 text-sm font-semibold">{parseFloat(chantier.progression || 0).toFixed(1)}%</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full ${getProgressColor(chantier.progression || 0)}`} style={{ width: `${chantier.progression || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4 mb-5 sm:mb-6">
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2"><FileText className="w-4 h-4" /><span className="text-xs font-medium">Tâches totales</span></div>
                <p className="text-3xl font-bold text-slate-900">{chantier.tache_count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2"><Camera className="w-4 h-4" /><span className="text-xs font-medium">Photos</span></div>
                <p className="text-3xl font-bold text-slate-900">{chantier.photo_count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2"><Activity className="w-4 h-4" /><span className="text-xs font-medium">Dernier journal</span></div>
                <p className="text-xl font-bold text-slate-900">{chantier.dernier_journal_date || 'Aucun'}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs font-medium">Progression</span></div>
                <p className="text-3xl font-bold text-slate-900">{parseFloat(chantier.progression || 0).toFixed(1)}%</p>
              </div>
            </div>

            {/* Tâches en cours */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Tâches en cours</h2>
                  <p className="text-sm text-slate-500">Les 5 dernières tâches actives.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/chantiers/${id}/taches`)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  Voir toutes
                </button>
              </div>
              {tasks.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-slate-600 text-center text-sm">Aucune tâche en cours.</div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id_tache} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-sm font-semibold text-slate-900">{task.nom}</p>
                        <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {task.statut?.replace('_', ' ') || '—'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Priorité : {task.priorite || 'normale'}</div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
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
    </AppLayout>
  );
}
