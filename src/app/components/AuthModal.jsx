// Composant de connexion/inscription
'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import GoogleSignInButton from './GoogleSignInButton';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isLoginMode) {
        // Inscription
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            telephone: formData.telephone,
            password: formData.password
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de l\'inscription');
        }

        // Rediriger vers la page de vérification OTP
        if (data.requiresVerification) {
          const name = `${formData.prenom} ${formData.nom}`;
          window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(name)}`;
          return;
        }

        // Si pas de vérification requise, connexion automatique avec NextAuth
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (result?.ok) {
          onClose();
          window.location.reload(); // Rafraîchir pour charger la session
        } else {
          throw new Error('Erreur lors de la connexion automatique');
        }
      } else {
        // Connexion avec NextAuth
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (!result?.ok) {
          if (result?.error === 'ACCOUNT_BLOCKED') {
            throw new Error('ACCOUNT_BLOCKED');
          }
          throw new Error(result?.error || 'Email ou mot de passe incorrect');
        }

        onClose();
        
        // Seul l'admin est redirigé automatiquement
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData?.user?.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/dashboard-projet';
        }
      }
    } catch (error) {
      if (error.message === 'ACCOUNT_BLOCKED') {
        setError('Votre compte a été bloqué. Veuillez contacter le service client.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isLoginMode ? 'Connexion' : 'Inscription'}
          </h2>
          <button onClick={onClose} className="text-2xl transition hover:opacity-60" style={{ color: 'var(--color-text-muted)' }}>×</button>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-4 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="input-neu-label">Prénom</label>
                <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required={!isLoginMode} className="input-neu" placeholder="Votre prénom" />
              </div>
              <div>
                <label className="input-neu-label">Nom</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} required={!isLoginMode} className="input-neu" placeholder="Votre nom" />
              </div>
              <div>
                <label className="input-neu-label">Téléphone (optionnel)</label>
                <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="input-neu" placeholder="+33 6 12 34 56 78" />
              </div>
            </>
          )}

          <div>
            <label className="input-neu-label">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-neu" placeholder="votre@email.com" />
          </div>

          <div>
            <label className="input-neu-label">Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength="6" className="input-neu" style={{ paddingRight: 44 }} placeholder="Mot de passe (min. 6 caractères)" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {isLoginMode && (
              <div className="mt-2 text-right">
                <a href="/forgot-password" className="text-sm transition hover:opacity-70" style={{ color: 'var(--color-primary)' }}
                  onClick={(e) => { e.preventDefault(); onClose(); window.location.href = '/forgot-password'; }}>
                  Mot de passe oublié ?
                </a>
              </div>
            )}
          </div>

          {!isLoginMode && (
            <div>
              <label className="input-neu-label">Confirmer le mot de passe</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required={!isLoginMode} minLength="6" className="input-neu" style={{ paddingRight: 44 }} placeholder="Confirmer le mot de passe" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Chargement...' : (isLoginMode ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>

        <div className="mt-6 mb-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>ou</div>

        <GoogleSignInButton />

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setShowPassword(false);
              setShowConfirmPassword(false);
              setFormData({ nom: '', prenom: '', email: '', telephone: '', password: '', confirmPassword: '' });
            }}
            className="text-sm transition hover:opacity-70"
            style={{ color: 'var(--color-primary)' }}
          >
            {isLoginMode ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>

        <div className="mt-4 text-center text-sm">
          <a href="/inscription" className="transition hover:opacity-70" style={{ color: 'var(--color-primary)' }}>
            Créer un compte entreprise
          </a>
        </div>
      </div>
    </div>
  );
}