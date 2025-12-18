'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nonLuesCount, setNonLuesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' ou 'unread'

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? '?nonLues=true' : '';
      const response = await fetch(`/api/user/notifications${params}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setNonLuesCount(data.nonLuesCount);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

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

  const getTypeColor = (type) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-800';
      case 'rapport':
        return 'bg-green-100 text-green-800';
      case 'systeme':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
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
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {nonLuesCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
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
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {nonLuesCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({nonLuesCount} non lue{nonLuesCount > 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtres et actions */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Non lues
                </button>
              </div>

              <div className="flex gap-2">
                {nonLuesCount > 0 && (
                  <button
                    onClick={marquerToutesLues}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={supprimerToutesLues}
                  className="text-xs text-red-600 hover:text-red-800"
                  title="Supprimer les notifications lues"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Bell className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id_notification}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notif.lu ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getTypeColor(notif.type_notification)} flex items-center justify-center text-lg`}>
                          {getTypeIcon(notif.type_notification)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium text-gray-900 ${!notif.lu ? 'font-semibold' : ''}`}>
                              {notif.titre}
                            </h4>
                            {!notif.lu && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {notif.contenu}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatDate(notif.date_creation)}
                            </span>

                            <div className="flex gap-2">
                              {notif.lien && (
                                <a
                                  href={notif.lien}
                                  onClick={() => setIsOpen(false)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Voir
                                </a>
                              )}
                              {!notif.lu && (
                                <button
                                  onClick={() => marquerCommeLue(notif.id_notification)}
                                  className="text-xs text-gray-600 hover:text-gray-900"
                                  title="Marquer comme lu"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => supprimerNotification(notif.id_notification)}
                                className="text-xs text-red-600 hover:text-red-800"
                                title="Supprimer"
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
