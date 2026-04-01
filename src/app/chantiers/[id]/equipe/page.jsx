'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, UserPlus, UserMinus, Users } from 'lucide-react';

export default function ChantierEquipePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [equipe, setEquipe] = useState([]);
  const [ouvriersDisponibles, setOuvriersDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState({});

  const [form, setForm] = useState({
    id_ouvrier: '',
    date_debut: new Date().toISOString().slice(0, 10),
    role_chantier: '',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetchEquipe();
      fetchOuvriers();
    }
  }, [status, id]);

  const fetchEquipe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/equipe`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Impossible de charger l'équipe");
      setEquipe(json.data || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchOuvriers = async () => {
    try {
      const res = await fetch('/api/ouvriers?limit=200&statut=actif');
      const json = await res.json();
      if (res.ok && json.success) setOuvriersDisponibles(json.data || []);
    } catch {
      // non-bloquant
    }
  };

  const handleFormChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAffecter = async (e) => {
    e.preventDefault();
    if (!form.id_ouvrier) { setError("Sélectionnez un ouvrier."); return; }
    if (!form.date_debut) { setError("La date de début est requise."); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/equipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Erreur lors de l'affectation");
      setForm({ id_ouvrier: '', date_debut: new Date().toISOString().slice(0, 10), role_chantier: '' });
      fetchEquipe();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const handleRetirer = async (idAffectation) => {
    if (!confirm("Retirer cet ouvrier du chantier ?")) return;
    setRemoving((prev) => ({ ...prev, [idAffectation]: true }));
    try {
      const res = await fetch(`/api/chantiers/${id}/equipe?id_affectation=${idAffectation}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur lors de la suppression');
      fetchEquipe();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setRemoving((prev) => ({ ...prev, [idAffectation]: false }));
    }
  };

  const affectesIds = new Set(equipe.map((o) => o.id_ouvrier));
  const disponibles = ouvriersDisponibles.filter((o) => !affectesIds.has(o.id_ouvrier));

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Équipe du chantier</h1>
            <p className="mt-2 text-slate-500">Gérez les ouvriers affectés à ce chantier.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

        {/* Formulaire d'affectation */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Affecter un ouvrier</h2>
              <p className="text-sm text-slate-500">Ajoutez un ouvrier actif à ce chantier.</p>
            </div>
          </div>
          <form onSubmit={handleAffecter} className="grid gap-5 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Ouvrier *</span>
              <select
                value={form.id_ouvrier}
                onChange={handleFormChange('id_ouvrier')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                required
              >
                <option value="">— Sélectionner —</option>
                {disponibles.map((o) => (
                  <option key={o.id_ouvrier} value={o.id_ouvrier}>
                    {o.prenom} {o.nom}{o.poste ? ` — ${o.poste}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Date début *</span>
              <input
                type="date"
                value={form.date_debut}
                onChange={handleFormChange('date_debut')}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Rôle sur ce chantier</span>
              <input
                value={form.role_chantier}
                onChange={handleFormChange('role_chantier')}
                placeholder="Ex : Chef de chantier, Manœuvre..."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
              />
            </label>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />{saving ? 'Affectation...' : 'Affecter'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des ouvriers affectés */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Ouvriers affectés</h2>
              <p className="text-sm text-slate-500">{equipe.length} ouvrier{equipe.length !== 1 ? 's' : ''} sur ce chantier</p>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-600">Chargement de l'équipe...</p>
          ) : equipe.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="font-medium">Aucun ouvrier affecté à ce chantier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {equipe.map((ouvrier) => (
                <div key={ouvrier.id_affectation} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                      {ouvrier.prenom?.charAt(0)}{ouvrier.nom?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{ouvrier.prenom} {ouvrier.nom}</p>
                      <p className="text-sm text-slate-500">
                        {ouvrier.role_chantier || ouvrier.poste || '—'}
                        {' · '}Depuis le {ouvrier.date_debut?.slice(0, 10) || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRetirer(ouvrier.id_affectation)}
                    disabled={removing[ouvrier.id_affectation]}
                    className="inline-flex items-center gap-2 rounded-3xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <UserMinus className="w-4 h-4" />
                    {removing[ouvrier.id_affectation] ? 'Retrait...' : 'Retirer'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
