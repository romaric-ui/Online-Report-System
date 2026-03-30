'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Users, Shield, Settings, LogOut, MessageSquare, Filter, Search, Mail, Calendar, CheckCircle, Clock, AlertCircle, Eye, Check, X, ChevronDown, Bell, Trash2 } from 'lucide-react';

export default function AdminMessagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  // Vérification authentification
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Charger messages
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchMessages();
      fetchNotifications();
    }
  }, [status, session]);

  const fetchMessages = async () => {
    try {
      const url = filterStatus !== 'all' 
        ? `/api/admin/messages?statut=${filterStatus}`
        : '/api/admin/messages';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur lors du chargement des messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erreur notifications:', error);
    }
  };

  const handleStatusChange = async (id_message, newStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_message, statut: newStatus })
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      await fetchMessages();
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyContent.trim() || !replyMessage) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/admin/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_message: replyMessage.id_message,
          reponse: replyContent,
          userEmail: replyMessage.email,
          userId: replyMessage.id_utilisateur,
          userName: `${replyMessage.prenom} ${replyMessage.nom}`,
          originalSubject: replyMessage.sujet
        })
      });
      
      if (response.ok) {
        setReplyMessage(null);
        setReplyContent('');
        await handleStatusChange(replyMessage.id_message, 'traite');
        alert('Réponse envoyée avec succès');
      } else {
        alert('Erreur lors de l\'envoi de la réponse');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi de la réponse');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id_message) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/messages?id_message=${id_message}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Message supprimé avec succès');
        await fetchMessages();
      } else {
        alert('Erreur lors de la suppression du message');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du message');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrage et recherche
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      (msg.sujet || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.contenu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Stats
  const stats = {
    total: messages.length,
    non_lu: messages.filter(m => m.statut === 'non_lu').length,
    lu: messages.filter(m => m.statut === 'lu').length,
    traite: messages.filter(m => m.statut === 'traite').length
  };

  const getStatusBadge = (statut) => {
    switch(statut) {
      case 'non_lu':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Non lu</span>
        </span>;
      case 'lu':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center space-x-1">
          <Eye className="w-3 h-3" />
          <span>Lu</span>
        </span>;
      case 'traite':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Traité</span>
        </span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl z-50">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Admin</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">En ligne</span>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 backdrop-blur-sm border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold">A</span>
              </div>
              <div>
                <p className="font-semibold text-white">Administrateur</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Utilisateurs</span>
            </button>

            <button
              onClick={() => router.push('/admin/messages')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Messages</span>
              </div>
              {stats.non_lu > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {stats.non_lu}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push('/admin/create-admin')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Créer un admin</span>
            </button>
          </nav>

          {/* Logout */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-600/20 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  Gestion des Messages
                </h2>
                <p className="text-slate-600 mt-1">Messages des utilisateurs</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <Bell className="w-6 h-6 text-slate-600" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p>Aucune notification</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {notifications.map((notif, idx) => (
                            <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                              <p className="text-sm text-slate-900">{notif.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notif.date}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Retour Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Messages</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-4 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Non lus</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.non_lu}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Lus</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.lu}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Traités</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.traite}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-slate-600" />
                <div className="flex space-x-2">
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'non_lu', label: 'Non lus' },
                    { value: 'lu', label: 'Lus' },
                    { value: 'traite', label: 'Traités' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setFilterStatus(filter.value);
                        setLoading(true);
                        setTimeout(fetchMessages, 100);
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        filterStatus === filter.value
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full lg:w-80"
                />
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium text-lg">Aucun message trouvé</p>
                <p className="text-slate-400 mt-2">Les messages des utilisateurs apparaîtront ici</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div 
                  key={message.id_message}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(message.prenom || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {message.prenom} {message.nom}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-slate-500">
                              <Mail className="w-4 h-4" />
                              <span>{message.email}</span>
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{message.sujet}</h3>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(message.statut)}
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(message.date_creation)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className={`text-slate-700 ${expandedMessage === message.id_message ? '' : 'line-clamp-3'}`}>
                        {message.contenu}
                      </p>
                      {message.contenu.length > 150 && (
                        <button
                          onClick={() => setExpandedMessage(
                            expandedMessage === message.id_message ? null : message.id_message
                          )}
                          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-2 flex items-center space-x-1"
                        >
                          <span>{expandedMessage === message.id_message ? 'Voir moins' : 'Voir plus'}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedMessage === message.id_message ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {message.date_lecture && (
                      <div className="text-xs text-slate-500 mb-4 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Lu le {formatDate(message.date_lecture)}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {message.statut === 'non_lu' && (
                        <button
                          onClick={() => handleStatusChange(message.id_message, 'lu')}
                          disabled={actionLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Marquer comme lu</span>
                        </button>
                      )}
                      
                      {message.statut !== 'traite' && (
                        <button
                          onClick={() => {
                            setReplyMessage(message);
                            setReplyContent('');
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Répondre</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(message.id_message)}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </button>
                      
                      {message.statut === 'lu' && (
                        <button
                          onClick={() => handleStatusChange(message.id_message, 'traite')}
                          disabled={actionLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Marquer comme traité</span>
                        </button>
                      )}

                      {message.statut === 'traite' && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Message traité</span>
                        </div>
                      )}

                      {message.statut !== 'non_lu' && message.statut !== 'traite' && (
                        <button
                          onClick={() => handleStatusChange(message.id_message, 'non_lu')}
                          disabled={actionLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Marquer comme non lu</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de réponse */}
      {replyMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Répondre à {replyMessage.prenom} {replyMessage.nom}</h3>
                <p className="text-sm text-gray-600">{replyMessage.email}</p>
                <p className="text-sm text-gray-500 mt-1">Re: {replyMessage.sujet}</p>
              </div>
              <button
                onClick={() => setReplyMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600 font-semibold mb-2">Message original:</p>
              <p className="text-gray-700 whitespace-pre-wrap">{replyMessage.contenu}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre réponse
              </label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Écrivez votre réponse ici..."
                disabled={sending}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReplyMessage(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={sending}
              >
                Annuler
              </button>
              <button
                onClick={sendReply}
                disabled={!replyContent.trim() || sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sending ? '⏳ Envoi...' : '📧 Envoyer la réponse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
