'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Send, Mail, MessageSquare, Loader2 } from 'lucide-react';

export default function MessageModal({ isOpen, onClose }) {
  const { data: session } = useSession();
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sujet.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (sujet.length > 200) {
      setError('Le sujet ne peut pas dépasser 200 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sujet: sujet.trim(),
          contenu: message.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message');
      }

      setSuccess(true);
      setSujet('');
      setMessage('');
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
      
    } catch (err) {
      setError('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSujet('');
      setMessage('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Contacter l'administrateur</h2>
              <p className="text-indigo-100 text-sm mt-1">Envoyez un message à notre équipe</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <Send className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Message envoyé !</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>L'administrateur vous répondra bientôt par email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl p-4 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Sujet */}
              <div>
                <label className="input-neu-label">Sujet <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    placeholder="Quel est le sujet de votre message ?"
                    maxLength={200}
                    disabled={loading}
                    className="input-neu disabled:opacity-50"
                    style={{ paddingLeft: 44 }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sujet.length}/200 caractères</p>
              </div>

              {/* Message */}
              <div>
                <label className="input-neu-label">Message <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande en détail..."
                  rows={8}
                  disabled={loading}
                  className="textarea-neu disabled:opacity-50"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{message.length} caractères</p>
              </div>

              {/* Info utilisateur */}
              {session?.user && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="font-semibold">Envoyé par :</span> {session.user.email}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Nous vous répondrons à cette adresse email</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={handleClose} disabled={loading} className="btn btn-soft flex-1 disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={loading || !sujet.trim() || !message.trim()} className="btn btn-primary flex-1 disabled:opacity-50">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Envoi en cours...</span></>
                  ) : (
                    <><Send className="w-4 h-4" /><span>Envoyer le message</span></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
