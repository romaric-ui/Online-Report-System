'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const countries = [
  'Bénin',
  'Togo',
  'Côte d\'Ivoire',
  'Sénégal',
  'Burkina Faso',
  'Niger',
  'Mali',
  'Guinée',
  'Ghana',
  'Nigeria',
  'Cameroun',
  'Gabon',
  'Congo'
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
    adminPasswordConfirm: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStepOne = () => {
    if (!formData.entrepriseNom.trim()) {
      setError('Le nom de l\'entreprise est requis.');
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (!formData.adminNom.trim()) {
      setError('Le nom de l\'administrateur est requis.');
      return false;
    }
    if (!formData.adminPrenom.trim()) {
      setError('Le prénom de l\'administrateur est requis.');
      return false;
    }
    if (!formData.adminEmail.trim()) {
      setError('L\'email de l\'administrateur est requis.');
      return false;
    }
    if (!formData.adminPassword) {
      setError('Le mot de passe est requis.');
      return false;
    }
    if (formData.adminPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return false;
    }
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStepOne()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateStepTwo()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entreprise: {
            nom: formData.entrepriseNom,
            pays: formData.entreprisePays,
            telephone: formData.entrepriseTelephone,
            email_contact: formData.entrepriseEmailContact
          },
          admin: {
            nom: formData.adminNom,
            prenom: formData.adminPrenom,
            email: formData.adminEmail,
            mot_de_passe: formData.adminPassword
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Une erreur est survenue lors de l\'inscription.');
        return;
      }

      // Envoyer le code OTP par email avant de rediriger
      const userId = data.admin?.id_utilisateur;
      const email = formData.adminEmail;

      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      });

      if (!otpRes.ok) {
        setError('Compte créé mais erreur lors de l\'envoi du code de vérification. Contactez le support.');
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(email)}&userId=${userId}`);
    } catch (err) {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="md:flex">
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-3">Créer un compte entreprise</h1>
              <p className="text-sm text-blue-100 leading-6">
                Inscrivez votre entreprise et créez un compte administrateur pour gérer vos chantiers, rapports et équipes.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-100/80">Étape {step} sur 2</p>
                <h2 className="mt-2 text-xl font-semibold">{step === 1 ? 'Informations entreprise' : 'Compte administrateur'}</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-blue-100/90">Suivez les étapes pour créer votre entreprise et un administrateur.</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'entreprise <span className="text-red-500">*</span></label>
                    <input
                      name="entrepriseNom"
                      value={formData.entrepriseNom}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom de l'entreprise"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
                    <select
                      name="entreprisePays"
                      value={formData.entreprisePays}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {countries.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="entrepriseTelephone"
                      value={formData.entrepriseTelephone}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+229 90 00 00 00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email de contact</label>
                    <input
                      type="email"
                      name="entrepriseEmailContact"
                      value={formData.entrepriseEmailContact}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contact@entreprise.com"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      Suivant
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'administrateur <span className="text-red-500">*</span></label>
                    <input
                      name="adminNom"
                      value={formData.adminNom}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prénom de l'administrateur <span className="text-red-500">*</span></label>
                    <input
                      name="adminPrenom"
                      value={formData.adminPrenom}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email de l'administrateur <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@entreprise.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mot de passe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      name="adminPasswordConfirm"
                      value={formData.adminPasswordConfirm}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-100 transition"
                    >
                      Précédent
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
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
