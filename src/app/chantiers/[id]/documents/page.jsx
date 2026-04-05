'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, FolderOpen, Upload, FileText, Image, FileSpreadsheet,
  File, Download, Trash2, X, CheckCircle,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'plan',         label: 'Plan',                color: 'bg-blue-100 text-blue-700' },
  { value: 'contrat',      label: 'Contrat',             color: 'bg-indigo-100 text-indigo-700' },
  { value: 'devis',        label: 'Devis',               color: 'bg-violet-100 text-violet-700' },
  { value: 'facture',      label: 'Facture',             color: 'bg-emerald-100 text-emerald-700' },
  { value: 'permis',       label: 'Permis de construire', color: 'bg-amber-100 text-amber-700' },
  { value: 'pv_reception', label: 'PV de réception',     color: 'bg-orange-100 text-orange-700' },
  { value: 'rapport',      label: 'Rapport',             color: 'bg-rose-100 text-rose-700' },
  { value: 'autre',        label: 'Autre',               color: 'bg-slate-100 text-slate-600' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function getFileIcon(typeMime, nomOriginal) {
  const ext = nomOriginal?.split('.').pop()?.toLowerCase();
  if (typeMime?.startsWith('image/') || ['jpg','jpeg','png'].includes(ext)) {
    return <Image className="w-5 h-5 text-emerald-500" />;
  }
  if (['xls','xlsx'].includes(ext) || typeMime?.includes('spreadsheet') || typeMime?.includes('excel')) {
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  }
  if (['doc','docx'].includes(ext) || typeMime?.includes('word')) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  if (ext === 'pdf' || typeMime === 'application/pdf') {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  return <File className="w-5 h-5 text-slate-400" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id     = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [documents, setDocuments]       = useState([]);
  const [comptes, setComptes]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [filtreCategorie, setFiltre]    = useState('');

  // Upload
  const [fichier, setFichier]           = useState(null);
  const [categorie, setCategorie]       = useState('');
  const [description, setDescription]  = useState('');
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setProgress]  = useState(0);
  const [uploadError, setUploadError]  = useState('');
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef(null);

  // Confirmation suppression
  const [confirmDelete, setConfirmDelete] = useState(null); // id_document à supprimer

  // ── Auth ──
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated') fetchDocuments();
  }, [status, id, filtreCategorie]);

  // ── Chargement ──
  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const qs  = filtreCategorie ? `?categorie=${filtreCategorie}` : '';
      const res = await fetch(`/api/chantiers/${id}/documents${qs}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur de chargement');
      setDocuments(json.data.documents || []);
      setComptes(json.data.comptes || []);
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  // ── Drag & Drop ──
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFichier(f);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ── Upload ──
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fichier) { setUploadError('Sélectionnez un fichier.'); return; }
    if (!categorie) { setUploadError('Choisissez une catégorie.'); return; }

    setUploading(true);
    setUploadError('');
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append('file', fichier);
      fd.append('categorie', categorie);
      if (description) fd.append('description', description);

      setProgress(40);
      const res  = await fetch(`/api/chantiers/${id}/documents`, { method: 'POST', body: fd });
      setProgress(90);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur upload');

      setProgress(100);
      setFichier(null);
      setCategorie('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setProgress(0), 800);
      fetchDocuments();
    } catch (err) {
      setUploadError(err.message || 'Erreur inattendue');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // ── Suppression ──
  const handleDelete = async (idDoc) => {
    try {
      const res  = await fetch(`/api/chantiers/${id}/documents?id_document=${idDoc}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Erreur suppression');
      setConfirmDelete(null);
      fetchDocuments();
    } catch (err) {
      setError(err.message || 'Erreur suppression');
    }
  };

  // Nombre total
  const totalDocs = comptes.reduce((s, c) => s + parseInt(c.total, 10), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* En-tête */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Documents</h1>
            <p className="mt-2 text-slate-500">
              {totalDocs} document{totalDocs !== 1 ? 's' : ''} · classés par catégorie
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/chantiers/${id}`)}
            className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-5 py-3 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au chantier
          </button>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 mb-6">{error}</div>
        )}

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFiltre('')}
            className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${
              filtreCategorie === '' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tous ({totalDocs})
          </button>
          {CATEGORIES.map(cat => {
            const nb = comptes.find(c => c.categorie === cat.value);
            if (!nb) return null;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFiltre(cat.value === filtreCategorie ? '' : cat.value)}
                className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${
                  filtreCategorie === cat.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label} ({nb.total})
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

          {/* ── Liste documents ── */}
          <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {filtreCategorie ? (CAT_MAP[filtreCategorie]?.label || filtreCategorie) : 'Tous les documents'}
              </h2>
            </div>

            {loading ? (
              <p className="text-slate-500 text-center py-8">Chargement...</p>
            ) : documents.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                Aucun document{filtreCategorie ? ' dans cette catégorie' : ''}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="pb-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Fichier</th>
                      <th className="pb-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Catégorie</th>
                      <th className="pb-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Taille</th>
                      <th className="pb-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Uploadé le</th>
                      <th className="pb-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Par</th>
                      <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {documents.map(doc => {
                      const cat = CAT_MAP[doc.categorie];
                      return (
                        <tr key={doc.id_document} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {getFileIcon(doc.type_mime, doc.nom_original)}
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 truncate max-w-[180px]" title={doc.nom_original}>
                                  {doc.nom_original}
                                </p>
                                {doc.description && (
                                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{doc.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cat?.color || 'bg-slate-100 text-slate-600'}`}>
                              {cat?.label || doc.categorie}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                            {formatSize(doc.taille_fichier)}
                          </td>
                          <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                            {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                            {doc.uploader_prenom ? `${doc.uploader_prenom} ${doc.uploader_nom}` : '—'}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.chemin_fichier}
                                download={doc.nom_original}
                                className="rounded-2xl p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(doc.id_document)}
                                className="rounded-2xl p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition"
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

          {/* ── Zone d'upload ── */}
          <div className="rounded-[2rem] bg-white p-6 shadow-xl border border-slate-200 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-3xl bg-emerald-500 p-3 text-white shadow-md">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Uploader un document</h2>
                <p className="text-sm text-slate-500">PDF, Word, Excel, Image, DWG — max 10 Mo</p>
              </div>
            </div>

            {uploadError && (
              <div className="rounded-3xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm mb-4">{uploadError}</div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Zone drag & drop */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-3xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50'
                    : fichier
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg"
                  className="hidden"
                  onChange={e => setFichier(e.target.files[0] || null)}
                />
                {fichier ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-emerald-700 truncate">{fichier.name}</p>
                      <p className="text-xs text-emerald-600">{formatSize(fichier.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFichier(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="ml-auto text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      Glissez un fichier ici ou <span className="text-indigo-600 font-semibold">cliquez pour sélectionner</span>
                    </p>
                  </>
                )}
              </div>

              {/* Catégorie */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Catégorie *</span>
                <select
                  value={categorie}
                  onChange={e => setCategorie(e.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="">— Choisir une catégorie —</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              {/* Description */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Courte description optionnelle..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>

              {/* Barre de progression */}
              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-right">{uploadProgress}%</p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !fichier || !categorie}
                className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-indigo-600 px-5 py-3.5 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Upload en cours...' : 'Uploader le document'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal confirmation suppression */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="rounded-full bg-red-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Supprimer le document</h3>
            <p className="text-slate-500 mb-6 text-sm">Cette action est irréversible. Le fichier sera supprimé définitivement.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-3xl border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-100 transition font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 rounded-3xl bg-red-500 px-4 py-3 text-white font-semibold hover:bg-red-600 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
