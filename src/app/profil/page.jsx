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

  const inputClass = 'input-neu';
  const labelClass = 'input-neu-label';

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

        {/* ── Section infos personnelles ── */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Mon profil</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Modifier mes informations personnelles</p>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
              <Check className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Informations personnelles</h2>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
              <div className="relative shrink-0">
                {/* Cercle photo */}
                <div
                  className="w-24 h-24 rounded-full overflow-hidden cursor-pointer"
                  style={{ boxShadow: 'var(--shadow-neu-raised)' }}
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
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition disabled:opacity-60"
                  style={{ background: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}
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
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {form.prenom} {form.nom}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{session?.user?.email}</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-2 text-xs font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Changer la photo
                </button>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>JPG, PNG, WEBP — max 5 Mo</p>
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
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Mon entreprise</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nom de l'entreprise</label>
                  <input name="entreprise_nom" value={form.entreprise_nom} onChange={handleChange} className={inputClass} placeholder="Nom de votre entreprise" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Adresse</label>
                  <textarea name="entreprise_adresse" value={form.entreprise_adresse} onChange={handleChange} rows={2} className="textarea-neu" placeholder="Adresse complète" />
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
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Upload className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Logo de l'entreprise</h2>
              </div>
              <div className="flex items-center gap-6">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo entreprise" className="w-20 h-20 rounded-xl object-contain p-1" style={{ boxShadow: 'var(--shadow-neu-flat)', background: 'var(--bg-elevated)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ boxShadow: 'var(--shadow-neu-pressed)', background: 'var(--bg-base)', color: 'var(--color-text-muted)' }}>
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <label className="btn btn-soft text-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Choisir un logo
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>PNG, JPG — max 2 Mo</p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* ── Section changement de mot de passe (formulaire séparé) ── */}
        {session?.user?.isGoogleUser ? (
          <div className="rounded-2xl p-6 flex items-center gap-3" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 shrink-0" />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Vous êtes connecté via <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Google</span>. Votre mot de passe est géré par Google.
            </p>
          </div>
        ) : (
        <form onSubmit={handlePasswordSubmit}>
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Modifier mon mot de passe</h2>
              </div>
              <button type="submit" disabled={savingPwd} className="btn btn-primary">
                <Check className="w-4 h-4" />
                {savingPwd ? 'Modification...' : 'Modifier'}
              </button>
            </div>

            {pwdError && (
              <div className="mb-4 rounded-xl p-4 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {pwdError}
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <label className={labelClass}>Mot de passe actuel</label>
                <div className="relative">
                  <input value={pwd.ancien} onChange={(e) => setPwd(p => ({ ...p, ancien: e.target.value }))} type={showPwd.ancien ? 'text' : 'password'} className="input-neu" style={{ paddingRight: 44 }} placeholder="Votre mot de passe actuel" autoComplete="current-password" />
                  <button type="button" onClick={() => togglePwd('ancien')} className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                    {showPwd.ancien ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Nouveau mot de passe</label>
                <div className="relative">
                  <input value={pwd.nouveau} onChange={(e) => setPwd(p => ({ ...p, nouveau: e.target.value }))} type={showPwd.nouveau ? 'text' : 'password'} className="input-neu" style={{ paddingRight: 44 }} placeholder="Minimum 8 caractères" autoComplete="new-password" />
                  <button type="button" onClick={() => togglePwd('nouveau')} className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
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
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
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
                    className="input-neu"
                    style={{ paddingRight: 44 }}
                    placeholder="Répétez le nouveau mot de passe"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => togglePwd('confirmer')} className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                    {showPwd.confirmer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwd.confirmer.length > 0 && pwd.confirmer !== pwd.nouveau && <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>Les mots de passe ne correspondent pas</p>}
                {pwd.confirmer.length > 0 && pwd.confirmer === pwd.nouveau && <p className="mt-1 text-xs" style={{ color: 'var(--color-success)' }}>Les mots de passe correspondent ✓</p>}
              </div>
            </div>
          </div>
        </form>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)', boxShadow: 'var(--shadow-neu-raised)' }}>
          {toast.message}
        </div>
      )}
    </AppLayout>
  );
}
