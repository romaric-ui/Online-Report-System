'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Users, Shield, FileText, Settings, BarChart3, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Mail, Calendar, LogOut, Home, Edit2, Trash2, Ban, CheckCircle, Eye, Bell, MessageSquare, Languages, Phone, UserPlus } from 'lucide-react';

// Dictionnaire de traductions
const translations = {
  fr: {
    admin: 'Admin',
    online: 'En ligne',
    administrator: 'Administrateur',
    superAdmin: 'Super Admin',
    navigation: 'Navigation',
    users: 'Utilisateurs',
    reports: 'Rapports',
    messages: 'Messages',
    settings: 'Paramètres',
    dashboard: 'Tableau de bord',
    logout: 'Déconnexion',
    loading: 'Chargement des utilisateurs...',
    error: 'Erreur',
    totalUsers: 'Total Utilisateurs',
    googleAccounts: 'Comptes Google',
    localAccounts: 'Comptes Locaux',
    administrators: 'Administrateurs',
    searchPlaceholder: 'Rechercher par nom ou email...',
    allTypes: 'Tous les types',
    google: 'Google',
    local: 'Local',
    allRoles: 'Tous les rôles',
    user: 'Utilisateur',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    type: 'Type',
    role: 'Rôle',
    status: 'Statut',
    joinedOn: 'Inscrit le',
    actions: 'Actions',
    view: 'Voir',
    edit: 'Modifier',
    delete: 'Supprimer',
    block: 'Bloquer',
    active: 'Actif',
    blocked: 'Bloqué',
    changeRole: 'Changer le rôle',
    showing: 'Affichage',
    of: 'sur',
    users_lower: 'utilisateurs',
    previous: 'Précédent',
    next: 'Suivant',
    confirmAction: 'Confirmer l\'action',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
    confirmBlock: 'Êtes-vous sûr de vouloir bloquer cet utilisateur ?',
    confirmRoleChange: 'Êtes-vous sûr de vouloir changer le rôle de cet utilisateur ?',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    processing: 'Traitement...',
    notifications: 'Notifications',
    noNotifications: 'Aucune notification',
    newUser: 'Nouvel utilisateur',
    newReport: 'Nouveau rapport',
    newMessage: 'Nouveau message'
  },
  en: {
    admin: 'Admin',
    online: 'Online',
    administrator: 'Administrator',
    superAdmin: 'Super Admin',
    navigation: 'Navigation',
    users: 'Users',
    reports: 'Reports',
    messages: 'Messages',
    settings: 'Settings',
    dashboard: 'Dashboard',
    logout: 'Logout',
    loading: 'Loading users...',
    error: 'Error',
    totalUsers: 'Total Users',
    googleAccounts: 'Google Accounts',
    localAccounts: 'Local Accounts',
    administrators: 'Administrators',
    searchPlaceholder: 'Search by name or email...',
    allTypes: 'All types',
    google: 'Google',
    local: 'Local',
    allRoles: 'All roles',
    user: 'User',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    type: 'Type',
    role: 'Role',
    status: 'Status',
    joinedOn: 'Joined on',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    block: 'Block',
    active: 'Active',
    blocked: 'Blocked',
    changeRole: 'Change role',
    showing: 'Showing',
    of: 'of',
    users_lower: 'users',
    previous: 'Previous',
    next: 'Next',
    confirmAction: 'Confirm Action',
    confirmDelete: 'Are you sure you want to delete this user?',
    confirmBlock: 'Are you sure you want to block this user?',
    confirmRoleChange: 'Are you sure you want to change this user\'s role?',
    cancel: 'Cancel',
    confirm: 'Confirm',
    processing: 'Processing...',
    notifications: 'Notifications',
    noNotifications: 'No notifications',
    newUser: 'New user',
    newReport: 'New report',
    newMessage: 'New message'
  }
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [language, setLanguage] = useState('fr');

  const t = translations[language];

  // Vérification de l'authentification et du rôle admin
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

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchUsers();
      fetchNotifications();
      fetchUnreadMessages();
    }
  }, [status, session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Erreur notifications:', error);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch('/api/admin/messages?statut=non_lu');
      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.data?.messages?.length || 0);
      }
    } catch (error) {
      console.error('Erreur messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage et recherche
  const filteredUsers = users.filter(user => {
    const userName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) || 
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isGoogleUser = !!user.google_id;
    const matchesProvider = filterProvider === 'all' || 
                           (filterProvider === 'google' && isGoogleUser) ||
                           (filterProvider === 'local' && !isGoogleUser);
    const matchesRole = filterRole === 'all' || (user.role || 'user') === filterRole;
    return matchesSearch && matchesProvider && matchesRole;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleUserAction = async (action, user) => {
    setSelectedUser(user);
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id_utilisateur}`, {
        method: modalAction === 'delete' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalAction,
          status: modalAction === 'block' ? 'blocked' : 'active'
        })
      });

      if (response.ok) {
        await fetchUsers();
        setShowModal(false);
        setSelectedUser(null);
      } else {
        alert('Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl">
          <p className="text-red-600 font-medium">{t.error}: {error}</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const googleUsers = users.filter(u => u.google_id).length;
  const localUsers = users.filter(u => !u.google_id).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{t.admin}</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">{t.online}</span>
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
                <p className="font-semibold text-white">{t.administrator}</p>
                <p className="text-xs text-slate-400">{t.superAdmin}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">{t.users}</span>
            </button>

            <button
              onClick={() => router.push('/admin/messages')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">{t.messages}</span>
              </div>
              {unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={() => router.push('/admin/create-admin')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
            >
              <UserPlus className="w-5 h-5" />
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
              <span className="font-medium">{t.logout}</span>
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
                  Gestion des Utilisateurs
                </h2>
                <p className="text-slate-600 mt-1">Gérez tous les comptes utilisateurs</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <button
                  onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <Languages className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{language === 'fr' ? 'FR' : 'EN'}</span>
                </button>

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
                        <h3 className="font-bold text-slate-900">{t.notifications}</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p>{t.noNotifications}</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notifications.map((notif, index) => (
                            <div key={index} className="p-4 hover:bg-slate-50 transition-all">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  notif.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                  {notif.type === 'user' ? <Users className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-900">{notif.title}</p>
                                  <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                                  <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-2 rounded-xl border border-indigo-200">
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold text-indigo-600">{totalUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">+12%</span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-1">{t.totalUsers}</p>
              <p className="text-4xl font-bold text-slate-900">{totalUsers}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-2xl shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{totalUsers > 0 ? Math.round((googleUsers/totalUsers)*100) : 0}%</span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-1">{t.googleAccounts}</p>
              <p className="text-4xl font-bold text-slate-900">{googleUsers}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{totalUsers > 0 ? Math.round((localUsers/totalUsers)*100) : 0}%</span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-1">{t.localAccounts}</p>
              <p className="text-4xl font-bold text-slate-900">{localUsers}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Admin</span>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-1">{t.administrators}</p>
              <p className="text-4xl font-bold text-slate-900">{adminUsers}</p>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Filters */}
            <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <select
                    value={filterProvider}
                    onChange={(e) => setFilterProvider(e.target.value)}
                    className="px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="all">{t.allTypes}</option>
                    <option value="google">{t.google}</option>
                    <option value="local">{t.local}</option>
                  </select>

                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="all">{t.allRoles}</option>
                    <option value="admin">{t.admin}</option>
                    <option value="user">{t.user}</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{filteredUsers.length} utilisateur(s) trouvé(s)</span>
                <span>Page {currentPage} sur {totalPages || 1}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.name}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.email}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.phone}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.type}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.role}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.status}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{language === 'fr' ? 'Création' : 'Created'}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{language === 'fr' ? 'Dernière connexion' : 'Last Login'}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">#{user.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg mr-3">
                            {(user.prenom || user.nom || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{user.prenom} {user.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{user.telephone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.google_id ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md">
                            <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md">
                            <Mail className="w-3 h-3 mr-1.5" />
                            Local
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(user.role || 'user') === 'admin' ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
                            <Shield className="w-3 h-3 mr-1.5" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                            <Users className="w-3 h-3 mr-1.5" />
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === 'blocked' ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md">
                            <Ban className="w-3 h-3 mr-1.5" />
                            {t.blocked}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                            {t.active}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {user.date_creation ? new Date(user.date_creation).toLocaleDateString('fr-FR') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.derniere_connexion ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-slate-700">{new Date(user.derniere_connexion).toLocaleDateString('fr-FR')}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Jamais</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUserAction('view', user)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {user.status !== 'blocked' ? (
                            <button
                              onClick={() => handleUserAction('block', user)}
                              className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all"
                              title="Bloquer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction('unblock', user)}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                              title="Débloquer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleUserAction('delete', user)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {t.showing} {indexOfFirstItem + 1} {t.of} {Math.min(indexOfLastItem, filteredUsers.length)} {t.of} {filteredUsers.length} {t.users_lower}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                              currentPage === pageNumber
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-2 text-slate-400">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                {modalAction === 'delete' && (language === 'fr' ? 'Supprimer l\'utilisateur' : 'Delete User')}
                {modalAction === 'block' && (language === 'fr' ? 'Bloquer l\'utilisateur' : 'Block User')}
                {modalAction === 'unblock' && (language === 'fr' ? 'Débloquer l\'utilisateur' : 'Unblock User')}
                {modalAction === 'view' && (language === 'fr' ? 'Détails de l\'utilisateur' : 'User Details')}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {modalAction === 'view' ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {(selectedUser.prenom || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">{selectedUser.prenom} {selectedUser.nom}</h4>
                      <p className="text-slate-600">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">{language === 'fr' ? 'Type de compte' : 'Account Type'}</p>
                      <p className="font-semibold">{selectedUser.google_id ? '🔴 Google' : '📧 Local'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">{language === 'fr' ? 'Rôle' : 'Role'}</p>
                      <p className="font-semibold">{(selectedUser.role || 'user') === 'admin' ? '👑 Admin' : '👤 User'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">{language === 'fr' ? 'Création' : 'Created'}</p>
                      <p className="font-semibold">{selectedUser.date_creation ? new Date(selectedUser.date_creation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">{language === 'fr' ? 'Dernière connexion' : 'Last Login'}</p>
                      <p className="font-semibold">{selectedUser.derniere_connexion ? new Date(selectedUser.derniere_connexion).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : (language === 'fr' ? 'Jamais' : 'Never')}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {language === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-slate-700">
                    <span className="font-semibold">{selectedUser.prenom} {selectedUser.nom}</span>
                    <br />
                    <span className="text-sm text-slate-600">{selectedUser.email}</span>
                  </p>
                </div>

                <p className="text-slate-700 mb-6">
                  {modalAction === 'delete' && (language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.' : 'Are you sure you want to delete this user? This action is irreversible.')}
                  {modalAction === 'block' && (language === 'fr' ? 'Cet utilisateur ne pourra plus se connecter.' : 'This user will no longer be able to log in.')}
                  {modalAction === 'unblock' && (language === 'fr' ? 'Cet utilisateur pourra à nouveau se connecter.' : 'This user will be able to log in again.')}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={confirmAction}
                    disabled={actionLoading}
                    className={`flex-1 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 ${
                      modalAction === 'delete' 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg' 
                        : modalAction === 'block'
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:shadow-lg'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg'
                    }`}
                  >
                    {actionLoading ? t.processing : t.confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}