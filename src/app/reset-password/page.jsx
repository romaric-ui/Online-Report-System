'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email requis'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) { setMessage('Code envoyé ! Vérifiez votre email.'); setStep(2); }
      else setError(data.error || 'Une erreur est survenue');
    } catch { setError('Erreur de connexion au serveur'); }
    finally { setLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) { setError('Le code doit contenir 6 chiffres'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/auth/verify-reset-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (data.success) { setMessage('Code valide ! Créez votre nouveau mot de passe.'); setStep(3); }
      else setError(data.error || 'Code invalide');
    } catch { setError('Erreur de connexion au serveur'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (newPassword.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, newPassword }) });
      const data = await res.json();
      if (data.success) {
        setMessage('Mot de passe réinitialisé ! Connexion automatique...');
        const result = await signIn('credentials', { email: data.email, password: newPassword, redirect: false });
        setTimeout(() => router.push(result?.ok ? '/dashboard' : '/'), 1500);
      } else setError(data.error || 'Une erreur est survenue');
    } catch { setError('Erreur de connexion au serveur'); }
    finally { setLoading(false); }
  };

  const stepLabels = ['Email', 'Code', 'Mot de passe'];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {step === 1 ? 'Réinitialiser le mot de passe' : step === 2 ? 'Vérifier le code' : 'Nouveau mot de passe'}
          </h2>
          <Link href="/" className="text-2xl transition hover:opacity-60" style={{ color: 'var(--color-text-muted)' }}>×</Link>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--bg-base)',
                      color: done || active ? 'white' : 'var(--color-text-muted)',
                      boxShadow: active ? '0 0 0 3px rgba(79,70,229,0.2)' : 'var(--shadow-neu-flat)',
                    }}>
                    {done ? '✓' : n}
                  </div>
                  <span className="text-xs mt-1" style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{label}</span>
                </div>
                {i < 2 && <div className="w-10 h-0.5 mb-4 rounded" style={{ background: step > n ? 'var(--color-success)' : 'var(--bg-base)' }} />}
              </div>
            );
          })}
        </div>

        {message && (
          <div className="rounded-xl p-4 mb-4 text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)' }}>
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl p-4 mb-4 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {/* Étape 1 */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <label className="input-neu-label">Adresse email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-neu" placeholder="votre@email.com" />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Nous vous enverrons un code à 6 chiffres</p>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="input-neu-label">Email</label>
              <input type="email" value={email} disabled className="input-neu opacity-60" />
            </div>
            <div>
              <label className="input-neu-label">Code de vérification</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6} autoFocus
                className="input-neu text-center text-2xl tracking-widest font-bold"
                placeholder="000000"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Code à 6 chiffres reçu par email</p>
            </div>
            <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary w-full">
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>
            <button type="button" onClick={() => { setStep(1); setCode(''); setMessage(''); setError(''); }}
              className="w-full text-sm text-center transition hover:opacity-70" style={{ color: 'var(--color-primary)' }}>
              ← Renvoyer un nouveau code
            </button>
          </form>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--color-success)' }}>
              ✓ Code vérifié pour <strong>{email}</strong>
            </div>
            <div>
              <label className="input-neu-label">Nouveau mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required minLength={8} className="input-neu" style={{ paddingRight: 44 }} placeholder="Minimum 8 caractères" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="input-neu-label">Confirmer le mot de passe</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required minLength={8} className="input-neu" style={{ paddingRight: 44 }} placeholder="Répétez le mot de passe" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
            <button type="button" onClick={() => { setStep(2); setNewPassword(''); setConfirmPassword(''); setMessage(''); setError(''); }}
              className="w-full text-sm text-center transition hover:opacity-70" style={{ color: 'var(--color-primary)' }}>
              ← Retour
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm transition hover:opacity-70" style={{ color: 'var(--color-primary)' }}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
