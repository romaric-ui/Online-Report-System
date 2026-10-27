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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-overlay animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-modal-titre"
        className="bg-app-surface text-app-text rounded-2xl border border-app-border w-full max-w-2xl max-h-[92dvh] overflow-y-auto animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-app-accent-soft flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-app-accent-text" />
            </div>
            <div>
              <p className="font-data text-xs uppercase tracking-[0.12em] text-app-faint">Support</p>
              <h2 id="message-modal-titre" className="text-xl font-semibold tracking-[-0.02em] leading-tight">Contacter l&apos;administrateur</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            aria-label="Fermer"
            className="p-2 rounded-lg text-app-faint hover:text-app-text hover:bg-app-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-12" role="status">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-app-success-soft">
                <Send className="w-8 h-8 text-app-success" />
              </div>
              <h3 className="text-2xl font-semibold tracking-[-0.02em] mb-2">Message envoyé&nbsp;!</h3>
              <p className="text-app-muted">L&apos;administrateur vous répondra bientôt par email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div role="alert" className="rounded-lg p-4 text-sm font-medium bg-app-danger-soft text-app-danger">
                  {error}
                </div>
              )}

              {/* Sujet */}
              <div>
                <label htmlFor="message-sujet" className="input-neu-label">Sujet <span className="text-app-danger">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-faint" />
                  <input
                    id="message-sujet"
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
                <p className="font-data text-xs mt-1.5 text-app-faint">{sujet.length}/200 caractères</p>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message-contenu" className="input-neu-label">Message <span className="text-app-danger">*</span></label>
                <textarea
                  id="message-contenu"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande en détail..."
                  rows={8}
                  disabled={loading}
                  className="textarea-neu disabled:opacity-50"
                />
                <p className="font-data text-xs mt-1.5 text-app-faint">{message.length} caractères</p>
              </div>

              {/* Info utilisateur */}
              {session?.user && (
                <div className="rounded-lg p-4 bg-app-subtle border border-app-border">
                  <p className="text-sm text-app-muted">
                    <span className="font-semibold text-app-text">Envoyé par&nbsp;:</span> <span className="font-data">{session.user.email}</span>
                  </p>
                  <p className="text-xs mt-1 text-app-faint">Nous vous répondrons à cette adresse email.</p>
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
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn, .animate-slideUp { animation: none; }
        }
      `}</style>
    </div>
  );
}
