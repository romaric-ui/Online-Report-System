'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage('Un code de réinitialisation vous a été envoyé par email. Vérifiez votre boîte de réception.');
        setEmail('');
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-neu-raised)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Mot de passe oublié ?</h2>
          <Link href="/" className="text-2xl transition hover:opacity-60" style={{ color: 'var(--color-text-muted)' }}>×</Link>
        </div>

        {message && (
          <div className="rounded-xl p-4 mb-5 text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)' }}>
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl p-4 mb-5 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-neu-label">Adresse email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-neu" placeholder="votre@email.com" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Envoi en cours...' : 'Envoyer le code de réinitialisation'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm transition hover:opacity-70" style={{ color: 'var(--color-primary)' }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
