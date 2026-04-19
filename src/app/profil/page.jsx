'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Upload, Building2, User, Lock, Eye, EyeOff, Camera } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function ProfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    entreprise_nom: '',
    entreprise_adresse: '',
    entreprise_email_contact: '',
    entreprise_pays: '',
    entreprise_telephone: '',
  });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const avatarInputRef = useRef(null);

  const [pwd, setPwd] = useState({ ancien: '', nouveau: '', confirmer: '' });
  const [showPwd, setShowPwd] = useState({ ancien: false, nouveau: false, confirmer: false });
  const [pwdError, setPwdError] = useState('');

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const isAdmin = session?.user?.roleEntreprise === 1;

  // Initiales calculées depuis le formulaire (mis à jour en temps réel)
  const initials = [form.prenom[0], form.nom[0]].filter(Boolean).join('').toUpperCase() || 'U';

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    fetchProfil();
  }, [status]);

  const fetchProfil = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profil');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur');
      const d = json.data;
      setForm({
        prenom: d.prenom || '',
        nom: d.nom || '',
        telephone: d.telephone || '',
        entreprise_nom: d.entreprise_nom || '',
        entreprise_adresse: d.entreprise_adresse || '',
        entreprise_email_contact: d.entreprise_email_contact || '',
        entreprise_pays: d.entreprise_pays || '',
        entreprise_telephone: d.entreprise_telephone || '',
      });
      if (d.photo_url) setAvatarUrl(d.photo_url);
      if (d.entreprise_logo_url) setLogoPreview(d.entreprise_logo_url);
    } catch {
      showToast('Erreur lors du chargement du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Upload avatar immédiat dès la sélection du fichier
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/uploads/avatar', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur upload');
      setAvatarUrl(json.photo_url);
      localStorage.setItem('userAvatarUrl', json.photo_url);
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: json.photo_url }));
      showToast('Photo de profil mise à jour');
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'upload', 'error');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur');
      showToast('Profil mis à jour avec succès');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (!pwd.ancien || !pwd.nouveau || !pwd.confirmer) { setPwdError('Tous les champs sont requis.'); return; }
    if (pwd.nouveau.length < 8) { setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    if (pwd.nouveau !== pwd.confirmer) { setPwdError('Le nouveau mot de passe et la confirmation ne correspondent pas.'); return; }

    setSavingPwd(true);
    try {
      const res = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changerMotDePasse: true, ancien_mot_de_passe: pwd.ancien, nouveau_mot_de_passe: pwd.nouveau }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur');
      showToast('Mot de passe modifié avec succès');
      setPwd({ ancien: '', nouveau: '', confirmer: '' });
    } catch (err) {
      setPwdError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPwd(false);
    }
  };

  const togglePwd = (field) => setShowPwd(prev => ({ ...prev, [field]: !prev[field] }));

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:bg-white transition';
  const labelClass = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Section infos personnelles ── */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
              <p className="text-sm text-gray-500 mt-0.5">Modifier mes informations personnelles</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Informations personnelles</h2>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
              <div className="relative shrink-0">
                {/* Cercle photo */}
                <div
                  className="w-24 h-24 rounded-full overflow-hidden cursor-pointer ring-4 ring-indigo-100"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Photo de profil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                  {/* Overlay au survol */}
                  {!uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Bouton caméra — coin bas droite */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white shadow-md transition disabled:opacity-60"
                  title="Changer la photo"
                >
                  {uploadingAvatar
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-3.5 h-3.5" />
                  }
                </button>

                {/* Input caché */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {form.prenom} {form.nom}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{session?.user?.email}</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-2 text-xs text-indigo-600 hover:underline font-medium"
                >
                  Changer la photo
                </button>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — max 5 Mo</p>
              </div>
            </div>

            {/* Champs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input name="prenom" value={form.prenom} onChange={handleChange} required className={inputClass} placeholder="Votre prénom" />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input name="nom" value={form.nom} onChange={handleChange} required className={inputClass} placeholder="Votre nom" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Téléphone mobile</label>
                <input name="telephone" value={form.telephone} onChange={handleChange} className={inputClass} placeholder="+229 00 00 00 00" type="tel" />
              </div>
            </div>
          </div>

          {/* Section entreprise */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-semibold text-gray-900">Mon entreprise</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nom de l'entreprise</label>
                  <input name="entreprise_nom" value={form.entreprise_nom} onChange={handleChange} className={inputClass} placeholder="Nom de votre entreprise" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Adresse</label>
                  <textarea name="entreprise_adresse" value={form.entreprise_adresse} onChange={handleChange} rows={2} className={inputClass} placeholder="Adresse complète" />
                </div>
                <div>
                  <label className={labelClass}>Email de contact</label>
                  <input name="entreprise_email_contact" value={form.entreprise_email_contact} onChange={handleChange} className={inputClass} placeholder="contact@entreprise.com" type="email" />
                </div>
                <div>
                  <label className={labelClass}>Pays</label>
                  <input name="entreprise_pays" value={form.entreprise_pays} onChange={handleChange} className={inputClass} placeholder="Pays" />
                </div>
                <div>
                  <label className={labelClass}>Téléphone bureau</label>
                  <input name="entreprise_telephone" value={form.entreprise_telephone} onChange={handleChange} className={inputClass} placeholder="+229 00 00 00 00" type="tel" />
                </div>
              </div>
            </div>
          )}

          {/* Section logo */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-semibold text-gray-900">Logo de l'entreprise</h2>
              </div>
              <div className="flex items-center gap-6">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo entreprise" className="w-20 h-20 rounded-xl object-contain border border-gray-200 bg-gray-50 p-1" />
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    Choisir un logo
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">PNG, JPG — max 2 Mo</p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* ── Section changement de mot de passe (formulaire séparé) ── */}
        {session?.user?.isGoogleUser ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-3">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 shrink-0" />
            <p className="text-sm text-gray-500">
              Vous êtes connecté via <span className="font-semibold text-gray-700">Google</span>. Votre mot de passe est géré par Google.
            </p>
          </div>
        ) : (
        <form onSubmit={handlePasswordSubmit}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-semibold text-gray-900">Modifier mon mot de passe</h2>
              </div>
              <button
                type="submit"
                disabled={savingPwd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                {savingPwd ? 'Modification...' : 'Modifier'}
              </button>
            </div>

            {pwdError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {pwdError}
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <label className={labelClass}>Mot de passe actuel</label>
                <div className="relative">
                  <input value={pwd.ancien} onChange={(e) => setPwd(p => ({ ...p, ancien: e.target.value }))} type={showPwd.ancien ? 'text' : 'password'} className={inputClass + ' pr-11'} placeholder="Votre mot de passe actuel" autoComplete="current-password" />
                  <button type="button" onClick={() => togglePwd('ancien')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd.ancien ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Nouveau mot de passe</label>
                <div className="relative">
                  <input value={pwd.nouveau} onChange={(e) => setPwd(p => ({ ...p, nouveau: e.target.value }))} type={showPwd.nouveau ? 'text' : 'password'} className={inputClass + ' pr-11'} placeholder="Minimum 8 caractères" autoComplete="new-password" />
                  <button type="button" onClick={() => togglePwd('nouveau')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd.nouveau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwd.nouveau.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${pwd.nouveau.length >= i * 3 ? pwd.nouveau.length >= 12 ? 'bg-emerald-500' : pwd.nouveau.length >= 8 ? 'bg-yellow-400' : 'bg-red-400' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {pwd.nouveau.length < 8 ? 'Trop court' : pwd.nouveau.length < 12 ? 'Acceptable' : 'Fort'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <input
                    value={pwd.confirmer}
                    onChange={(e) => setPwd(p => ({ ...p, confirmer: e.target.value }))}
                    type={showPwd.confirmer ? 'text' : 'password'}
                    className={`${inputClass} pr-11 ${pwd.confirmer.length > 0 ? pwd.confirmer === pwd.nouveau ? 'border-emerald-400' : 'border-red-400' : ''}`}
                    placeholder="Répétez le nouveau mot de passe"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => togglePwd('confirmer')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd.confirmer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwd.confirmer.length > 0 && pwd.confirmer !== pwd.nouveau && <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>}
                {pwd.confirmer.length > 0 && pwd.confirmer === pwd.nouveau && <p className="mt-1 text-xs text-emerald-600">Les mots de passe correspondent ✓</p>}
              </div>
            </div>
          </div>
        </form>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.message}
        </div>
      )}
    </AppLayout>
  );
}
