'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const countries = [
  'Bénin', 'Togo', "Côte d'Ivoire", 'Sénégal', 'Burkina Faso',
  'Niger', 'Mali', 'Guinée', 'Ghana', 'Nigeria', 'Cameroun', 'Gabon', 'Congo',
];

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    entrepriseNom: '',
    entreprisePays: 'Bénin',
    entrepriseTelephone: '',
    entrepriseEmailContact: '',
    adminNom: '',
    adminPrenom: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStepOne = () => {
    if (!formData.entrepriseNom.trim()) { setError("Le nom de l'entreprise est requis."); return false; }
    return true;
  };

  const validateStepTwo = () => {
    if (!formData.adminNom.trim()) { setError("Le nom de l'administrateur est requis."); return false; }
    if (!formData.adminPrenom.trim()) { setError("Le prénom de l'administrateur est requis."); return false; }
    if (!formData.adminEmail.trim()) { setError("L'email de l'administrateur est requis."); return false; }
    if (!formData.adminPassword) { setError('Le mot de passe est requis.'); return false; }
    if (formData.adminPassword.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return false; }
    if (formData.adminPassword !== formData.adminPasswordConfirm) { setError('Les mots de passe ne correspondent pas.'); return false; }
    return true;
  };

  const handleNext = () => { setError(''); if (validateStepOne()) setStep(2); };
  const handleBack = () => { setError(''); setStep(1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateStepTwo()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entreprise: { nom: formData.entrepriseNom, pays: formData.entreprisePays, telephone: formData.entrepriseTelephone, email_contact: formData.entrepriseEmailContact },
          admin: { nom: formData.adminNom, prenom: formData.adminPrenom, email: formData.adminEmail, mot_de_passe: formData.adminPassword },
        }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error?.message || "Une erreur est survenue lors de l'inscription."); return; }

      const userId = data.admin?.id_utilisateur;
      const email = formData.adminEmail;
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      });
      if (!otpRes.ok) { setError('Compte créé mais erreur lors de l\'envoi du code de vérification.'); return; }
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&userId=${userId}`);
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-3xl rounded-3xl overflow-hidden" style={{ boxShadow: 'var(--shadow-neu-raised)' }}>
        <div className="md:flex">
          {/* Left panel */}
          <div className="w-full md:w-1/2 p-10 text-white" style={{ background: 'linear-gradient(145deg, #4F46E5, #6366F1)' }}>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-3">Créer un compte entreprise</h1>
              <p className="text-sm leading-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Inscrivez votre entreprise et créez un compte administrateur pour gérer vos chantiers, rapports et équipes.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p className="text-sm uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.7)' }}>Étape {step} sur 2</p>
                <h2 className="mt-2 text-xl font-semibold">{step === 1 ? 'Informations entreprise' : 'Compte administrateur'}</h2>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Suivez les étapes pour créer votre entreprise et son administrateur.</p>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="w-full md:w-1/2 p-8 sm:p-10" style={{ background: 'var(--bg-surface)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl p-4 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {step === 1 ? (
                <>
                  <div>
                    <label className="input-neu-label">Nom de l'entreprise <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input name="entrepriseNom" value={formData.entrepriseNom} onChange={handleChange} required className="input-neu" placeholder="Nom de l'entreprise" />
                  </div>
                  <div>
                    <label className="input-neu-label">Pays</label>
                    <select name="entreprisePays" value={formData.entreprisePays} onChange={handleChange} className="select-neu">
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-neu-label">Téléphone</label>
                    <input type="tel" name="entrepriseTelephone" value={formData.entrepriseTelephone} onChange={handleChange} className="input-neu" placeholder="+229 90 00 00 00" />
                  </div>
                  <div>
                    <label className="input-neu-label">Email de contact</label>
                    <input type="email" name="entrepriseEmailContact" value={formData.entrepriseEmailContact} onChange={handleChange} className="input-neu" placeholder="contact@entreprise.com" />
                  </div>
                  <button type="button" onClick={handleNext} className="btn btn-primary w-full">
                    Suivant →
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="input-neu-label">Nom <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input name="adminNom" value={formData.adminNom} onChange={handleChange} required className="input-neu" placeholder="Nom" />
                  </div>
                  <div>
                    <label className="input-neu-label">Prénom <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input name="adminPrenom" value={formData.adminPrenom} onChange={handleChange} required className="input-neu" placeholder="Prénom" />
                  </div>
                  <div>
                    <label className="input-neu-label">Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="input-neu" placeholder="admin@entreprise.com" />
                  </div>
                  <div>
                    <label className="input-neu-label">Mot de passe <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} required minLength={8} className="input-neu" placeholder="Minimum 8 caractères" />
                  </div>
                  <div>
                    <label className="input-neu-label">Confirmer le mot de passe <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input type="password" name="adminPasswordConfirm" value={formData.adminPasswordConfirm} onChange={handleChange} required minLength={8} className="input-neu" placeholder="Confirmer le mot de passe" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={handleBack} className="btn btn-soft flex-1">
                      ← Précédent
                    </button>
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                      {loading ? 'Création...' : 'Créer mon compte'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
