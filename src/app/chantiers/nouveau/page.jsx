'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PlusCircle, ArrowLeft, Building2, MapPin, CalendarDays, DollarSign } from 'lucide-react';

const PAYS = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', 'Espagne', 'Italie'];

export default function NouveauChantierPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    nom: '',
    reference: '',
    description: '',
    client_nom: '',
    client_telephone: '',
    client_email: '',
    adresse: '',
    ville: '',
    pays: 'France',
    date_debut: '',
    date_fin_prevue: '',
    budget_prevu: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values.nom.trim()) {
      setError('Le nom du chantier est requis.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/chantiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la création du chantier');
      }
      router.push(`/chantiers/${result.data.id_chantier}`);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <button
          type="button"
          onClick={() => router.push('/chantiers')}
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="rounded-[2rem] bg-white p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="rounded-3xl bg-indigo-600 p-4 text-white shadow-md">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Nouveau chantier</h1>
              <p className="mt-2 text-sm text-slate-500">Renseignez les informations du chantier pour le créer.</p>
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Nom du chantier *</span>
                <input
                  value={values.nom}
                  onChange={handleChange('nom')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Référence</span>
                <input
                  value={values.reference}
                  onChange={handleChange('reference')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={values.description}
                onChange={handleChange('description')}
                rows={4}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
              />
            </label>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Client</span>
                <input
                  value={values.client_nom}
                  onChange={handleChange('client_nom')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Téléphone client</span>
                <input
                  type="tel"
                  value={values.client_telephone}
                  onChange={handleChange('client_telephone')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Email client</span>
                <input
                  type="email"
                  value={values.client_email}
                  onChange={handleChange('client_email')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Adresse</span>
                <input
                  value={values.adresse}
                  onChange={handleChange('adresse')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Ville</span>
                <input
                  value={values.ville}
                  onChange={handleChange('ville')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Pays</span>
                <select
                  value={values.pays}
                  onChange={handleChange('pays')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                >
                  {PAYS.map((pays) => (
                    <option key={pays} value={pays}>{pays}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Budget prévu</span>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={values.budget_prevu}
                    onChange={handleChange('budget_prevu')}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-12 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date de début</span>
                <input
                  type="date"
                  value={values.date_debut}
                  onChange={handleChange('date_debut')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date fin prévue</span>
                <input
                  type="date"
                  value={values.date_fin_prevue}
                  onChange={handleChange('date_fin_prevue')}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => router.push('/chantiers')}
                className="rounded-3xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-100 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-8 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading ? 'Création...' : 'Créer le chantier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
