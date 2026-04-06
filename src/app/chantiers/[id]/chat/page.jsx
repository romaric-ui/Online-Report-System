'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

function fmtHeure(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateLabel(d) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

export default function ChatPage({ params: paramsPromise }) {
  const params   = use(paramsPromise);
  const id       = params.id;
  const router   = useRouter();
  const { data: session, status } = useSession();

  const [messages, setMessages]   = useState([]);
  const [chantierNom, setChantierNom] = useState('');
  const [contenu, setContenu]     = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const latestIdRef = useRef(0);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const res  = await fetch(`/api/chantiers/${id}/chat?limit=100`);
      const json = await res.json();
      if (!res.ok || !json.success) return;

      const fetched = json.data.messages;
      if (initial) {
        setChantierNom(json.data.chantier_nom || '');
        setMessages(fetched);
        latestIdRef.current = fetched.at(-1)?.id_message || 0;
      } else {
        // N'ajouter que les nouveaux messages
        const nouveaux = fetched.filter(m => m.id_message > latestIdRef.current);
        if (nouveaux.length > 0) {
          setMessages(prev => [...prev, ...nouveaux]);
          latestIdRef.current = nouveaux.at(-1).id_message;
        }
      }
    } catch {
      // polling silencieux — ne pas afficher d'erreur
    } finally {
      if (initial) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/'); return; }
    fetchMessages(true);
  }, [status, fetchMessages]);

  // Scroll au chargement initial et à chaque nouveau message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling toutes les 5 secondes
  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [status, fetchMessages]);

  const handleSend = async () => {
    const texte = contenu.trim();
    if (!texte || sending) return;

    setSending(true);
    setContenu('');
    try {
      const res  = await fetch(`/api/chantiers/${id}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contenu: texte }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Erreur envoi');
        setContenu(texte); // restaurer le texte en cas d'erreur
        return;
      }
      const msg = json.data;
      setMessages(prev => [...prev, msg]);
      latestIdRef.current = msg.id_message;
    } catch {
      setError('Erreur réseau');
      setContenu(texte);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const myId = parseInt(session?.user?.id, 10);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-6">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/chantiers/${id}`)}
              className="rounded-3xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="rounded-3xl bg-indigo-600 p-3 text-white shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Discussion{chantierNom ? ` — ${chantierNom}` : ''}
              </h1>
              <p className="text-xs text-slate-400">Chat interne du chantier</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm mb-4">
            {error}
            <button type="button" onClick={() => setError('')} className="ml-3 underline text-xs">Fermer</button>
          </div>
        )}

        {/* Zone messages */}
        <div className="rounded-[2rem] bg-white shadow-xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: '520px' }}>

          {/* Liste des messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chargement...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <MessageCircle className="w-8 h-8 opacity-30" />
                <p>Aucun message pour l&apos;instant.</p>
                <p className="text-xs">Soyez le premier à écrire !</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.id_utilisateur === myId;
                const showDate = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);

                return (
                  <div key={msg.id_message}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-xs text-slate-400 font-medium capitalize">
                          {fmtDateLabel(msg.created_at)}
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>
                    )}
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-1`}>
                      {/* Auteur (affiché si message précédent d'un autre auteur ou premier du groupe) */}
                      {(i === 0 || messages[i - 1].id_utilisateur !== msg.id_utilisateur || showDate) && !isMine && (
                        <span className="text-xs text-slate-500 font-semibold mb-0.5 ml-1">
                          {msg.prenom} {msg.nom}
                        </span>
                      )}
                      <div className={`group flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          }`}
                        >
                          {msg.contenu}
                        </div>
                        <span className="text-[10px] text-slate-400 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {fmtHeure(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-3 bg-slate-50">
            <input
              ref={inputRef}
              type="text"
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
              disabled={sending}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!contenu.trim() || sending}
              className="rounded-2xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
