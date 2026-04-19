'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Plus, MapPin, CalendarDays, Users, ClipboardList } from 'lucide-react';
import AppLayout from '../components/AppLayout';

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

export default function ChantiersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    fetchChantiers();
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const delay = setTimeout(fetchChantiers, 250);
      return () => clearTimeout(delay);
    }
  }, [search, statut]);

  const fetchChantiers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statut) params.set('statut', statut);
      const response = await fetch(`/api/chantiers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Impossible de charger les chantiers');
      }
      const json = await response.json();
      setChantiers(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (id) => {
    router.push(`/chantiers/${id}`);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Mes Chantiers</h1>
            <p className="mt-2 text-sm text-slate-600">Suivez vos chantiers en cours et accédez rapidement aux détails.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/chantiers/nouveau')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nouveau chantier
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr] mb-8">
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, référence ou client"
              className="w-full border-0 outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <label className="text-sm font-medium text-slate-700">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none"
            >
              <option value="">Tous</option>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="en_pause">En pause</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-5 text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement des chantiers...</div>
        ) : chantiers.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm border border-slate-200 text-center text-slate-600">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-lg font-semibold">Aucun chantier</p>
            <p className="mt-2 text-sm text-slate-500">Créez un nouveau chantier pour commencer.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {chantiers.map((chantier) => (
              <button
                key={chantier.id_chantier}
                type="button"
                onClick={() => handleCardClick(chantier.id_chantier)}
                className="group text-left rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{chantier.nom}</h2>
                    <p className="mt-2 text-sm text-slate-500">Réf. {chantier.reference || '—'}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[chantier.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {STATUS_LABELS[chantier.statut] || 'Inconnu'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="mt-1 text-base font-medium text-slate-800">{chantier.client_nom || 'Non renseigné'}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                    <span>Progression</span>
                    <span>{parseFloat(chantier.progression || 0).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(chantier.progression || 0)}`}
                      style={{ width: `${chantier.progression || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-500">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <span>{chantier.date_debut || 'Date non définie'}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{chantier.ville || 'Ville non définie'}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
