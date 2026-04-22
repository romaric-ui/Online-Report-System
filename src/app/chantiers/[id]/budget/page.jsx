'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Wallet, TrendingDown, PiggyBank, Plus, Tag, Clock, Check, X } from 'lucide-react';

const CATEGORIE_LABELS = {
  materiaux: 'Matériaux',
  main_oeuvre: "Main d'œuvre",
  location: 'Location',
  sous_traitance: 'Sous-traitance',
  transport: 'Transport',
  autre: 'Autre',
};

const CATEGORIE_CLASSES = {
  materiaux: 'bg-blue-100 text-blue-700 border-blue-200',
  main_oeuvre: 'bg-purple-100 text-purple-700 border-purple-200',
  location: 'bg-orange-100 text-orange-700 border-orange-200',
  sous_traitance: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  transport: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  autre: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUT_CLASSES = {
  en_attente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  validee: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejetee: 'bg-red-100 text-red-700 border-red-200',
};

const STATUT_LABELS = {
  en_attente: 'En attente',
  validee: 'Validée',
  rejetee: 'Rejetée',
};

function formatMontant(montant, devise = 'XOF') {
  return `${parseFloat(montant).toLocaleString('fr-FR')} ${devise}`;
}

function getBarreColor(pct) {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-orange-500';
  return 'bg-emerald-500';
}

function getBarreColorText(pct) {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-orange-600';
  return 'text-emerald-600';
}

export default function ChantierBudgetPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [synthese, setSynthese] = useState(null);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categorieFiltree, setCategorieFiltree] = useState('');

  // Formulaire budget
  const [budgetForm, setBudgetForm] = useState({ budget_total: '', devise: 'XOF' });
  const [savingBudget, setSavingBudget] = useState(false);

  // Formulaire dépense
  const [depenseForm, setDepenseForm] = useState({
    libelle: '',
    montant: '',
    date_depense: new Date().toISOString().slice(0, 10),
    categorie: 'materiaux',
    fournisseur: '',
    notes: '',
  });
  const [savingDepense, setSavingDepense] = useState(false);
  const [depenseError, setDepenseError] = useState('');
  const [validatingId, setValidatingId] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetchSynthese();
      fetchDepenses();
    }
  }, [status, id]);

  useEffect(() => {
    if (status === 'authenticated') fetchDepenses();
  }, [categorieFiltree]);

  const fetchSynthese = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chantiers/${id}/budget`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Impossible de charger le budget');
      setSynthese(json.data);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepenses = async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (categorieFiltree) params.set('categorie', categorieFiltree);
      const res = await fetch(`/api/chantiers/${id}/depenses?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) setDepenses(json.data || []);
    } catch {
      // non-bloquant
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.budget_total) return;
    setSavingBudget(true);
    setError('');
    try {
      const method = synthese ? 'PUT' : 'POST';
      const res = await fetch(`/api/chantiers/${id}/budget`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setBudgetForm({ budget_total: '', devise: 'XOF' });
      fetchSynthese();
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setSavingBudget(false);
    }
  };

  const handleDepenseSubmit = async (e) => {
    e.preventDefault();
    setDepenseError('');
    setSavingDepense(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/depenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depenseForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setDepenseForm({
        libelle: '',
        montant: '',
        date_depense: new Date().toISOString().slice(0, 10),
        categorie: 'materiaux',
        fournisseur: '',
        notes: '',
      });
      fetchDepenses();
      fetchSynthese();
    } catch (err) {
      setDepenseError(err.message || 'Erreur inattendue');
    } finally {
      setSavingDepense(false);
    }
  };

  const handleValiderDepense = async (idDepense, statut) => {
    setValidatingId(idDepense);
    try {
      const res = await fetch(`/api/chantiers/${id}/depenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_depense: idDepense, statut }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      fetchDepenses();
      fetchSynthese();
    } catch {
      // non-bloquant
    } finally {
      setValidatingId(null);
    }
  };

  const pct = synthese?.pourcentage_consomme ?? 0;
  const devise = synthese?.devise ?? 'XOF';

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Budget & Dépenses</h1>
            <p className="mt-2 text-slate-500">Suivez les dépenses et l'avancement budgétaire du chantier.</p>
          </div>
          <button type="button" onClick={() => router.push(`/chantiers/${id}`)} className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {error && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 text-center text-slate-600">Chargement...</div>
        ) : (
          <>
            {/* Pas de budget défini */}
            {!synthese ? (
              <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Définir le budget</h2>
                    <p className="text-sm text-slate-500">Aucun budget n'a encore été défini pour ce chantier.</p>
                  </div>
                </div>
                <form onSubmit={handleBudgetSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg">
                  <label className="flex-1 space-y-2">
                    <span className="text-sm font-medium text-slate-700">Budget total *</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetForm.budget_total}
                      onChange={(e) => setBudgetForm((p) => ({ ...p, budget_total: e.target.value }))}
                      placeholder="Ex : 5000000"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Devise</span>
                    <select value={budgetForm.devise} onChange={(e) => setBudgetForm((p) => ({ ...p, devise: e.target.value }))} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500">
                      <option value="XOF">XOF</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button type="submit" disabled={savingBudget} className="rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                      {savingBudget ? 'Enregistrement...' : 'Définir'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Cards de synthèse */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
                  <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700"><Wallet className="w-5 h-5" /></div>
                      <span className="text-sm font-medium text-slate-500">Budget total</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatMontant(synthese.budget_total, devise)}</p>
                  </div>
                  <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-2xl bg-orange-100 p-2.5 text-orange-700"><TrendingDown className="w-5 h-5" /></div>
                      <span className="text-sm font-medium text-slate-500">Dépensé (validé)</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatMontant(synthese.total_depense_validee, devise)}</p>
                    <p className={`text-sm font-semibold mt-1 ${getBarreColorText(pct)}`}>{pct}% du budget</p>
                  </div>
                  <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-yellow-200 bg-yellow-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-2xl bg-yellow-100 p-2.5 text-yellow-700"><Clock className="w-5 h-5" /></div>
                      <span className="text-sm font-medium text-yellow-700">En attente</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-800">{formatMontant(synthese.total_depense_en_attente, devise)}</p>
                    {synthese.total_depense_en_attente > 0 && (
                      <p className="text-xs font-medium text-yellow-600 mt-1">À valider ou rejeter</p>
                    )}
                  </div>
                  <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-700"><PiggyBank className="w-5 h-5" /></div>
                      <span className="text-sm font-medium text-slate-500">Reste disponible</span>
                    </div>
                    <p className={`text-2xl font-bold ${synthese.reste < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {formatMontant(synthese.reste, devise)}
                    </p>
                  </div>
                </div>

                {/* Barre de progression budgétaire */}
                <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200 mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">Consommation budgétaire</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${getBarreColorText(pct)}`}>{pct}%</span>
                      <button
                        type="button"
                        onClick={() => { setBudgetForm({ budget_total: synthese.budget_total, devise: synthese.devise }); }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Modifier le budget
                      </button>
                    </div>
                  </div>
                  <div className="h-5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getBarreColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {synthese.reste < 0 && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      ⚠ Dépassement de budget : {formatMontant(Math.abs(synthese.reste), devise)}
                    </p>
                  )}

                  {/* Formulaire de modification budget */}
                  {budgetForm.budget_total !== '' && (
                    <form onSubmit={handleBudgetSubmit} className="mt-4 flex flex-col sm:flex-row gap-4 max-w-lg">
                      <label className="flex-1 space-y-1">
                        <span className="text-xs font-medium text-slate-600">Nouveau budget total</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={budgetForm.budget_total}
                          onChange={(e) => setBudgetForm((p) => ({ ...p, budget_total: e.target.value }))}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-indigo-500 text-sm"
                          required
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button type="submit" disabled={savingBudget} className="rounded-3xl bg-indigo-600 px-5 py-2.5 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                          {savingBudget ? '...' : 'Enregistrer'}
                        </button>
                        <button type="button" onClick={() => setBudgetForm({ budget_total: '', devise: 'XOF' })} className="rounded-3xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition">
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}

            {/* Ajouter une dépense */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Ajouter une dépense</h2>
                  <p className="text-sm text-slate-500">Enregistrez une dépense liée à ce chantier.</p>
                </div>
              </div>
              {depenseError && <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-4">{depenseError}</div>}
              <form onSubmit={handleDepenseSubmit} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="space-y-2 lg:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Libellé *</span>
                    <input
                      value={depenseForm.libelle}
                      onChange={(e) => setDepenseForm((p) => ({ ...p, libelle: e.target.value }))}
                      placeholder="Ex : Achat ciment 50 sacs"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Montant *</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={depenseForm.montant}
                      onChange={(e) => setDepenseForm((p) => ({ ...p, montant: e.target.value }))}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                      required
                    />
                  </label>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Date *</span>
                    <input
                      type="date"
                      value={depenseForm.date_depense}
                      onChange={(e) => setDepenseForm((p) => ({ ...p, date_depense: e.target.value }))}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Catégorie *</span>
                    <select
                      value={depenseForm.categorie}
                      onChange={(e) => setDepenseForm((p) => ({ ...p, categorie: e.target.value }))}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    >
                      {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Fournisseur</span>
                    <input
                      value={depenseForm.fournisseur}
                      onChange={(e) => setDepenseForm((p) => ({ ...p, fournisseur: e.target.value }))}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Notes</span>
                  <input
                    value={depenseForm.notes}
                    onChange={(e) => setDepenseForm((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                  />
                </label>
                <div className="flex justify-end">
                  <button type="submit" disabled={savingDepense} className="inline-flex items-center gap-2 rounded-3xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60">
                    <Plus className="w-4 h-4" />{savingDepense ? 'Ajout...' : 'Ajouter la dépense'}
                  </button>
                </div>
              </form>
            </div>

            {/* Liste des dépenses */}
            <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-slate-100 p-3 text-slate-700">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Dépenses</h2>
                    <p className="text-sm text-slate-500">{depenses.length} dépense{depenses.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-600">Catégorie</label>
                  <select
                    value={categorieFiltree}
                    onChange={(e) => setCategorieFiltree(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none text-sm"
                  >
                    <option value="">Toutes</option>
                    {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {depenses.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-600">Aucune dépense enregistrée.</div>
              ) : (
                <div className="space-y-3">
                  {depenses.map((d) => (
                    <div key={d.id_depense} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-slate-900 truncate">{d.libelle}</p>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CATEGORIE_CLASSES[d.categorie] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {CATEGORIE_LABELS[d.categorie] || d.categorie}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUT_CLASSES[d.statut] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {STATUT_LABELS[d.statut] || d.statut}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {d.date_depense?.slice(0, 10)}
                          {d.fournisseur ? ` · ${d.fournisseur}` : ''}
                          {d.notes ? ` · ${d.notes}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-lg font-bold text-slate-900">{formatMontant(d.montant, devise)}</p>
                        {d.statut === 'en_attente' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={validatingId === d.id_depense}
                              onClick={() => handleValiderDepense(d.id_depense, 'validee')}
                              className="inline-flex items-center gap-1 rounded-2xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Valider
                            </button>
                            <button
                              type="button"
                              disabled={validatingId === d.id_depense}
                              onClick={() => handleValiderDepense(d.id_depense, 'rejetee')}
                              className="inline-flex items-center gap-1 rounded-2xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Rejeter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
