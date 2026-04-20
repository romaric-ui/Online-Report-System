'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Package, Plus, AlertTriangle, CheckCircle,
  Clock, Pencil, Trash2, History, ArrowDownCircle, ArrowUpCircle,
  ShieldCheck, X,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIE_LABELS = {
  epi:                    'EPI',
  extincteur:             'Extincteur',
  signalisation:          'Signalisation',
  premier_secours:        'Premiers secours',
  protection_collective:  'Protection collective',
  autre:                  'Autre',
};

const CATEGORIE_COLORS = {
  epi:                    'bg-blue-100 text-blue-700',
  extincteur:             'bg-red-100 text-red-700',
  signalisation:          'bg-yellow-100 text-yellow-700',
  premier_secours:        'bg-green-100 text-green-700',
  protection_collective:  'bg-indigo-100 text-indigo-700',
  autre:                  'bg-slate-100 text-slate-600',
};

const ETAT_LABELS = {
  neuf:          'Neuf',
  bon:           'Bon',
  usage:         'Usagé',
  a_remplacer:   'À remplacer',
  hors_service:  'Hors service',
};

const ETAT_COLORS = {
  neuf:          'bg-emerald-100 text-emerald-700',
  bon:           'bg-blue-100 text-blue-700',
  usage:         'bg-yellow-100 text-yellow-700',
  a_remplacer:   'bg-orange-100 text-orange-700',
  hors_service:  'bg-red-100 text-red-700',
};

const RESULTAT_LABELS = {
  conforme:       'Conforme',
  non_conforme:   'Non conforme',
  a_surveiller:   'À surveiller',
};

const MOUVEMENT_LABELS = {
  entree:    'Entrée',
  sortie:    'Sortie',
  transfert: 'Transfert',
  rebut:     'Rebut',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) <= new Date();
}

function isSoonExpiry(dateStr) {
  if (!dateStr) return false;
  const limit = new Date();
  limit.setDate(limit.getDate() + 30);
  return new Date(dateStr) <= limit && new Date(dateStr) > new Date();
}

// ─── Modal générique ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StockSecuritePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id     = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [stock, setStock]       = useState([]);
  const [alertes, setAlertes]   = useState({ ruptures: 0, verificationsDs: 0, perimes: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  // Filtres
  const [filterCat, setFilterCat]   = useState('');
  const [filterEtat, setFilterEtat] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // { type: 'entree'|'sortie'|'verif'|'historique'|'edit'|'delete', article }
  const [modalData, setModalData] = useState({});
  const [modalHistory, setModalHistory] = useState({ verifs: [], mouvements: [] });

  // Formulaire ajout
  const emptyForm = {
    nom_article: '', categorie: 'epi', quantite: '', quantite_min: '0',
    unite: 'unité', emplacement: '', etat: 'bon', date_peremption: '',
    frequence_verification_jours: '90', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    loadStock();
  }, [status, id]);

  const loadStock = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCat)  params.set('categorie', filterCat);
      if (filterEtat) params.set('etat', filterEtat);
      const res  = await fetch(`/api/chantiers/${id}/securite/stock?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de chargement');
      setStock(json.data.stock || []);
      setAlertes(json.data.alertes || { ruptures: 0, verificationsDs: 0, perimes: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (status === 'authenticated') loadStock(); }, [filterCat, filterEtat]);

  // ── Ajout article ──────────────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await fetch(`/api/chantiers/${id}/securite/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setForm(emptyForm);
      await loadStock();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Mouvement (entrée / sortie) ────────────────────────────────────────────

  const handleMouvement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/securite/stock/${modal.article.id_stock}/mouvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...modalData, type_mouvement: modal.type }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setModal(null);
      setModalData({});
      await loadStock();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Vérification ──────────────────────────────────────────────────────────

  const handleVerif = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/securite/stock/${modal.article.id_stock}/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setModal(null);
      setModalData({});
      await loadStock();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Historique ────────────────────────────────────────────────────────────

  const openHistorique = async (article) => {
    setModal({ type: 'historique', article });
    const [resV, resM] = await Promise.all([
      fetch(`/api/chantiers/${id}/securite/stock/${article.id_stock}/verifications`),
      fetch(`/api/chantiers/${id}/securite/stock/${article.id_stock}/mouvements`),
    ]);
    const [jV, jM] = await Promise.all([resV.json(), resM.json()]);
    setModalHistory({
      verifs:      jV.success ? jV.data : [],
      mouvements:  jM.success ? jM.data : [],
    });
  };

  // ── Modification ─────────────────────────────────────────────────────────

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/securite/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_stock: modal.article.id_stock, ...modalData }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setModal(null);
      setModalData({});
      await loadStock();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/securite/stock?id_stock=${modal.article.id_stock}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur');
      setModal(null);
      await loadStock();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* En-tête */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Stock sécurité</h1>
            <p className="mt-1 text-slate-500">Gestion des EPI, extincteurs et équipements HSE.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/chantiers/${id}/securite`)}
            className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition self-start"
          >
            <ArrowLeft className="w-4 h-4" /> Retour sécurité
          </button>
        </div>

        {/* ── Bannières alertes ── */}
        {alertes.ruptures > 0 && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {alertes.ruptures} article{alertes.ruptures > 1 ? 's' : ''} en rupture de stock (quantité ≤ minimum)
          </div>
        )}
        {alertes.verificationsDs > 0 && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-orange-50 border border-orange-200 px-5 py-3 text-orange-700 text-sm font-medium">
            <Clock className="w-4 h-4 flex-shrink-0" />
            {alertes.verificationsDs} vérification{alertes.verificationsDs > 1 ? 's' : ''} en retard
          </div>
        )}
        {alertes.perimes > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-yellow-50 border border-yellow-200 px-5 py-3 text-yellow-700 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {alertes.perimes} article{alertes.perimes > 1 ? 's' : ''} périmé{alertes.perimes > 1 ? 's' : ''}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-5 py-3 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

          {/* ── Tableau + filtres ── */}
          <div className="space-y-4">

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3">
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="rounded-xl border border-slate-200 text-sm px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Toutes catégories</option>
                {Object.entries(CATEGORIE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                value={filterEtat}
                onChange={e => setFilterEtat(e.target.value)}
                className="rounded-xl border border-slate-200 text-sm px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Tous états</option>
                {Object.entries(ETAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="ml-auto text-sm text-slate-400 self-center">{stock.length} article{stock.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-slate-500 text-sm">Chargement...</div>
              ) : stock.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Aucun article en stock. Ajoutez-en un ci-contre.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Article</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Catégorie</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Qté</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Emplacement</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">État</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Dernière vérif.</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Prochaine vérif.</th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stock.map(a => {
                        const rupture    = a.quantite <= a.quantite_min;
                        const verifOk    = isOverdue(a.date_prochaine_verification);
                        const perime     = isOverdue(a.date_peremption);
                        const soonExpiry = isSoonExpiry(a.date_peremption);
                        return (
                          <tr key={a.id_stock} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{a.nom_article}</p>
                              {a.notes && <p className="text-xs text-slate-400 truncate max-w-[160px]">{a.notes}</p>}
                              {perime && <span className="text-xs text-red-600 font-medium">⚠ Périmé</span>}
                              {!perime && soonExpiry && <span className="text-xs text-yellow-600 font-medium">⚠ Expire bientôt</span>}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORIE_COLORS[a.categorie] || 'bg-slate-100 text-slate-600'}`}>
                                {CATEGORIE_LABELS[a.categorie] || a.categorie}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`text-sm font-bold ${rupture ? 'text-red-600' : 'text-slate-900'}`}>
                                {a.quantite}
                              </span>
                              {a.quantite_min > 0 && (
                                <span className="text-xs text-slate-400 block">min {a.quantite_min}</span>
                              )}
                              <span className="text-xs text-slate-400">{a.unite}</span>
                            </td>
                            <td className="px-3 py-3 text-sm text-slate-500 hidden md:table-cell">{a.emplacement || '—'}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ETAT_COLORS[a.etat] || 'bg-slate-100 text-slate-600'}`}>
                                {ETAT_LABELS[a.etat] || a.etat}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-500 hidden lg:table-cell">{fmtDate(a.date_derniere_verification)}</td>
                            <td className="px-3 py-3 hidden lg:table-cell">
                              <span className={`text-xs font-medium ${verifOk ? 'text-red-600' : 'text-slate-500'}`}>
                                {fmtDate(a.date_prochaine_verification)}
                                {verifOk && ' ⚠'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setModal({ type: 'entree', article: a }); setModalData({ quantite: '', motif: '' }); }}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                  title="Entrée stock"
                                >
                                  <ArrowDownCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setModal({ type: 'sortie', article: a }); setModalData({ quantite: '', motif: '', destination: '' }); }}
                                  className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
                                  title="Sortie stock"
                                >
                                  <ArrowUpCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setModal({ type: 'verif', article: a }); setModalData({ resultat: 'conforme', observations: '', actions_correctives: '' }); }}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                  title="Enregistrer une vérification"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openHistorique(a)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                  title="Historique"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setModal({ type: 'edit', article: a }); setModalData({ nom_article: a.nom_article, categorie: a.categorie, quantite_min: a.quantite_min, unite: a.unite, emplacement: a.emplacement || '', etat: a.etat, date_peremption: a.date_peremption?.slice(0,10) || '', frequence_verification_jours: a.frequence_verification_jours, notes: a.notes || '' }); }}
                                  className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                                  title="Modifier"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModal({ type: 'delete', article: a })}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Formulaire ajout ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-600">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Ajouter un article</h2>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nom de l'article *</label>
                <input
                  type="text" required
                  value={form.nom_article}
                  onChange={e => setForm(f => ({ ...f, nom_article: e.target.value }))}
                  placeholder="Ex : Casque de chantier"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie *</label>
                  <select
                    required
                    value={form.categorie}
                    onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {Object.entries(CATEGORIE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">État</label>
                  <select
                    value={form.etat}
                    onChange={e => setForm(f => ({ ...f, etat: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {Object.entries(ETAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantité *</label>
                  <input
                    type="number" min="0" required
                    value={form.quantite}
                    onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Qté min</label>
                  <input
                    type="number" min="0"
                    value={form.quantite_min}
                    onChange={e => setForm(f => ({ ...f, quantite_min: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unité</label>
                  <input
                    type="text"
                    value={form.unite}
                    onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emplacement / zone de stockage</label>
                <input
                  type="text"
                  value={form.emplacement}
                  onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}
                  placeholder="Ex : Armoire vestiaire A"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date de péremption</label>
                  <input
                    type="date"
                    value={form.date_peremption}
                    onChange={e => setForm(f => ({ ...f, date_peremption: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vérif. (jours)</label>
                  <input
                    type="number" min="1"
                    value={form.frequence_verification_jours}
                    onChange={e => setForm(f => ({ ...f, frequence_verification_jours: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-60"
              >
                {saving ? 'Enregistrement…' : 'Ajouter l\'article'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Entrée / Sortie */}
      {(modal?.type === 'entree' || modal?.type === 'sortie') && (
        <Modal
          title={modal.type === 'entree' ? `Entrée stock — ${modal.article.nom_article}` : `Sortie stock — ${modal.article.nom_article}`}
          onClose={() => { setModal(null); setModalData({}); }}
        >
          <form onSubmit={handleMouvement} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantité *</label>
              <input
                type="number" min="1" required
                value={modalData.quantite || ''}
                onChange={e => setModalData(d => ({ ...d, quantite: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Motif</label>
              <input
                type="text"
                value={modalData.motif || ''}
                onChange={e => setModalData(d => ({ ...d, motif: e.target.value }))}
                placeholder="Ex : Réapprovisionnement fournisseur"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {modal.type === 'sortie' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                <input
                  type="text"
                  value={modalData.destination || ''}
                  onChange={e => setModalData(d => ({ ...d, destination: e.target.value }))}
                  placeholder="Ex : Zone chantier Nord"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Valider'}
            </button>
          </form>
        </Modal>
      )}

      {/* Vérification */}
      {modal?.type === 'verif' && (
        <Modal title={`Vérification — ${modal.article.nom_article}`} onClose={() => { setModal(null); setModalData({}); }}>
          <form onSubmit={handleVerif} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Résultat *</label>
              <select
                required
                value={modalData.resultat || 'conforme'}
                onChange={e => setModalData(d => ({ ...d, resultat: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {Object.entries(RESULTAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Observations</label>
              <textarea
                rows={3}
                value={modalData.observations || ''}
                onChange={e => setModalData(d => ({ ...d, observations: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Actions correctives</label>
              <textarea
                rows={2}
                value={modalData.actions_correctives || ''}
                onChange={e => setModalData(d => ({ ...d, actions_correctives: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer la vérification'}
            </button>
          </form>
        </Modal>
      )}

      {/* Historique */}
      {modal?.type === 'historique' && (
        <Modal title={`Historique — ${modal.article.nom_article}`} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Vérifications ({modalHistory.verifs.length})</h4>
              {modalHistory.verifs.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune vérification enregistrée.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {modalHistory.verifs.map(v => (
                    <div key={v.id_verification} className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800">{fmtDate(v.date_verification)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.resultat === 'conforme' ? 'bg-emerald-100 text-emerald-700' : v.resultat === 'non_conforme' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {RESULTAT_LABELS[v.resultat]}
                        </span>
                      </div>
                      {v.observations && <p className="text-xs text-slate-500 mt-1">{v.observations}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">par {v.verificateur_nom}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Mouvements ({modalHistory.mouvements.length})</h4>
              {modalHistory.mouvements.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun mouvement enregistré.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {modalHistory.mouvements.map(m => (
                    <div key={m.id_mouvement} className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm flex justify-between items-center">
                      <div>
                        <span className={`font-medium ${m.type_mouvement === 'entree' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {m.type_mouvement === 'entree' ? '+' : '-'}{m.quantite}
                        </span>
                        <span className="text-slate-500 ml-1">{MOUVEMENT_LABELS[m.type_mouvement]}</span>
                        {m.motif && <p className="text-xs text-slate-400">{m.motif}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{fmtDate(m.date_mouvement)}</p>
                        <p className="text-xs text-slate-400">{m.effectue_par_nom}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modification */}
      {modal?.type === 'edit' && (
        <Modal title={`Modifier — ${modal.article.nom_article}`} onClose={() => { setModal(null); setModalData({}); }}>
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom de l'article</label>
              <input
                type="text"
                value={modalData.nom_article || ''}
                onChange={e => setModalData(d => ({ ...d, nom_article: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
                <select value={modalData.categorie || ''} onChange={e => setModalData(d => ({ ...d, categorie: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {Object.entries(CATEGORIE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">État</label>
                <select value={modalData.etat || ''} onChange={e => setModalData(d => ({ ...d, etat: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {Object.entries(ETAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Qté minimum</label>
                <input type="number" min="0" value={modalData.quantite_min ?? ''} onChange={e => setModalData(d => ({ ...d, quantite_min: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Unité</label>
                <input type="text" value={modalData.unite || ''} onChange={e => setModalData(d => ({ ...d, unite: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Emplacement</label>
              <input type="text" value={modalData.emplacement || ''} onChange={e => setModalData(d => ({ ...d, emplacement: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date péremption</label>
                <input type="date" value={modalData.date_peremption || ''} onChange={e => setModalData(d => ({ ...d, date_peremption: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fréquence vérif. (j)</label>
                <input type="number" min="1" value={modalData.frequence_verification_jours || ''} onChange={e => setModalData(d => ({ ...d, frequence_verification_jours: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea rows={2} value={modalData.notes || ''} onChange={e => setModalData(d => ({ ...d, notes: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </form>
        </Modal>
      )}

      {/* Suppression */}
      {modal?.type === 'delete' && (
        <Modal title="Confirmer la suppression" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-600 mb-6">
            Supprimer <span className="font-semibold text-slate-900">"{modal.article.nom_article}"</span> ?
            Cette action est irréversible et supprime tout l'historique associé.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
              Annuler
            </button>
            <button type="button" onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60">
              {saving ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
