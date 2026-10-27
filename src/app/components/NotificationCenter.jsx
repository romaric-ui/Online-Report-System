'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';

// surFondSombre : bouton aux couleurs de l'en-tête de la landing (fond nuit)
export default function NotificationCenter({ surFondSombre = false }) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nonLuesCount, setNonLuesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' ou 'unread'

  // Charger les notifications (seulement si authentifié)
  const loadNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    try {
      setLoading(true);
      const params = filter === 'unread' ? '?nonLues=true' : '';
      const response = await fetch(`/api/user/notifications${params}`);
      
      if (!response.ok) return;
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setNonLuesCount(data.nonLuesCount || 0);
      }
    } catch (error) {
      // Silencieux en cas d'erreur réseau
    } finally {
      setLoading(false);
    }
  }, [status, filter]);

  // Charger au montage et toutes les 30 secondes (seulement si authentifié)
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [status, filter, loadNotifications]);

  // Marquer une notification comme lue
  const marquerCommeLue = async (id) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_notification: id })
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Marquer toutes comme lues
  const marquerToutesLues = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marquerToutesLues: true })
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Supprimer une notification
  const supprimerNotification = async (id) => {
    try {
      const response = await fetch(`/api/user/notifications?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Supprimer toutes les notifications lues
  const supprimerToutesLues = async () => {
    try {
      const response = await fetch('/api/user/notifications?toutesLues=true', {
        method: 'DELETE'
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'rapport':
        return '📝';
      case 'systeme':
        return '⚙️';
      default:
        return '🔔';
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={nonLuesCount > 0 ? `Notifications, ${nonLuesCount} non lue${nonLuesCount > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={isOpen}
        className={surFondSombre
          ? 'lk-focus relative w-11 h-11 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-craie-2 hover:text-craie hover:bg-white/10 transition-colors'
          : 'relative w-10 h-10 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-hover rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent'}
      >
        <Bell className="w-5 h-5" />
        {nonLuesCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 font-data text-[12px] leading-none font-medium text-app-on-accent bg-app-accent rounded-full">
            {nonLuesCount > 9 ? '9+' : nonLuesCount}
          </span>
        )}
      </button>

      {/* Panneau des notifications */}
      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panneau */}
          <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-app-surface text-app-text border border-app-border rounded-xl z-50 max-h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-app-border">
              <h3 className="text-base font-semibold">
                Notifications
                {nonLuesCount > 0 && (
                  <span className="ml-2 font-data text-xs font-normal text-app-faint">
                    {nonLuesCount} non lue{nonLuesCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer les notifications"
                className="p-1.5 rounded-lg text-app-faint hover:text-app-text hover:bg-app-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtres et actions */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-app-border bg-app-subtle">
              <div className="flex gap-1" role="group" aria-label="Filtrer les notifications">
                {[
                  { value: 'all', label: 'Toutes' },
                  { value: 'unread', label: 'Non lues' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === value
                        ? 'bg-app-surface text-app-text font-semibold border border-app-border'
                        : 'text-app-muted border border-transparent hover:text-app-text'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1">
                {nonLuesCount > 0 && (
                  <button
                    onClick={marquerToutesLues}
                    className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover"
                    title="Tout marquer comme lu"
                    aria-label="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={supprimerToutesLues}
                  className="p-1.5 rounded-md text-app-muted hover:text-app-danger hover:bg-app-danger-soft"
                  title="Supprimer les notifications lues"
                  aria-label="Supprimer les notifications lues"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8" role="status" aria-label="Chargement">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-app-border border-t-app-accent"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-app-faint">
                  <Bell className="w-10 h-10 mb-2" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-app-border">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id_notification}
                      className={`relative p-4 transition-colors hover:bg-app-hover ${
                        !notif.lu ? 'bg-app-accent-soft' : ''
                      }`}
                    >
                      {!notif.lu && (
                        <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-[3px] bg-app-accent" />
                      )}
                      <div className="flex items-start gap-3">
                        <div aria-hidden="true" className="flex-shrink-0 w-9 h-9 rounded-lg bg-app-subtle border border-app-border flex items-center justify-center text-base">
                          {getTypeIcon(notif.type_notification)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm text-app-text ${!notif.lu ? 'font-semibold' : 'font-medium'}`}>
                            {notif.titre}
                            {!notif.lu && <span className="sr-only"> (non lue)</span>}
                          </h4>

                          <p className="mt-1 text-sm text-app-muted line-clamp-2">
                            {notif.contenu}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-data text-xs text-app-faint">
                              {formatDate(notif.date_creation)}
                            </span>

                            <div className="flex items-center gap-1">
                              {notif.lien && (
                                <a
                                  href={notif.lien}
                                  onClick={() => setIsOpen(false)}
                                  className="px-2 py-1 rounded-md text-xs font-semibold text-app-accent-text hover:bg-app-hover"
                                >
                                  Voir
                                </a>
                              )}
                              {!notif.lu && (
                                <button
                                  onClick={() => marquerCommeLue(notif.id_notification)}
                                  className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-app-hover"
                                  title="Marquer comme lu"
                                  aria-label="Marquer comme lu"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => supprimerNotification(notif.id_notification)}
                                className="p-1 rounded-md text-app-muted hover:text-app-danger hover:bg-app-danger-soft"
                                title="Supprimer"
                                aria-label="Supprimer la notification"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
