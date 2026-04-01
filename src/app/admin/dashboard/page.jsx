'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Users, Home, Settings, Bell, Search, ChevronRight, 
  Shield, FileText, CheckCircle, Clock, XCircle,
  TrendingUp, Activity, BarChart3,
  Calendar, Download, Filter, Plus, Eye,
  Edit2, LogOut, UserPlus, MessageSquare, Ban
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, growth: 0 },
    reports: { total: 0, pending: 0, validated: 0, rejected: 0 },
    activity: []
  });
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      // Afficher un message pour se connecter
      setShowLoginPrompt(true);
      setLoading(false);
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setShowLoginPrompt(false);
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [status, session]);

  const [apiError, setApiError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const response = await fetch('/api/admin/dashboard');
      
      if (response.status === 401) {
        router.push('/?login=required');
        return;
      }
      
      if (response.status === 403) {
        router.push('/');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (!data.success) {
          setApiError(data.message || 'Erreur lors du chargement des données du dashboard');
          return;
        }
        setStats(data.data);
      } else {
        console.error('Erreur API:', response.status);
        setApiError('Erreur API: ' + response.status);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setApiError('Erreur de chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Espace Administrateur</h1>
            <p className="text-gray-600">Veuillez vous connecter pour accéder au tableau de bord</p>
          </div>
          
          <button
            onClick={() => router.push('/?admin=login')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-50 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">SGTEC</h1>
              <p className="text-slate-400 text-xs font-medium">Administration</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-700/50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 hover:from-slate-700 hover:to-slate-600 transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                A
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Administrateur</p>
                <p className="text-slate-400 text-xs">admin@sgtec.com</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2 py-0.5 bg-emerald-500/20 rounded-full">
                    <span className="text-emerald-400 text-xs font-semibold">En ligne</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <a
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>
          
          <a
            href="/admin/users"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group"
          >
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Utilisateurs</span>
            <span className="ml-auto px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">
              {stats.users.total}
            </span>
          </a>

          <a
            href="/admin/reports"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group"
          >
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Rapports</span>
            <span className="ml-auto px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-lg">
              {stats.reports.pending}
            </span>
          </a>

          <a
            href="/admin/messages"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group"
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Messages</span>
          </a>

          <a
            href="/admin/create-admin"
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group"
          >
            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Créer un admin</span>
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu Principal */}
      <main className="ml-72 min-h-screen">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-blue-900 bg-clip-text text-transparent">
                  Tableau de Bord
                </h1>
                <p className="text-slate-600 mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-3 w-80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/50 backdrop-blur"
                  />
                </div>

                <button className="relative p-3 hover:bg-slate-100 rounded-xl transition-all">
                  <Bell className="w-6 h-6 text-slate-600" />
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>

                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-700">Système Opérationnel</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {apiError && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
              <strong className="font-semibold">Erreur :</strong> {apiError}
            </div>
          )}
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">+{stats.users.growth}%</span>
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">
                Total Utilisateurs
              </h3>
              <p className="text-4xl font-bold text-slate-900 mb-2">
                {stats.users.total}
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">+{stats.users.new}</span> nouveaux ce mois
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                  Urgent
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">
                En Attente
              </h3>
              <p className="text-4xl font-bold text-slate-900 mb-2">
                {stats.reports.pending}
              </p>
              <p className="text-sm text-slate-600">
                Rapports à valider
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">+18%</span>
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">
                Validés
              </h3>
              <p className="text-4xl font-bold text-slate-900 mb-2">
                {stats.reports.validated}
              </p>
              <p className="text-sm text-slate-600">
                Rapports approuvés
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                  <Eye className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">
                Total Rapports
              </h3>
              <p className="text-4xl font-bold text-slate-900 mb-2">
                {stats.reports.total}
              </p>
              <p className="text-sm text-slate-600">
                Tous les rapports créés
              </p>
            </div>
          </div>

          {/* Activité Récente */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Activité Récente</h2>
                <p className="text-slate-600 text-sm mt-1">Dernières actions sur la plateforme</p>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                <Filter className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {stats.activity.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Aucune activité récente</p>
              ) : (
                stats.activity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group">
                    <div className="p-2 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {activity.nom} {activity.prenom}
                      </p>
                      <p className="text-xs text-slate-600">
                        Rapport: {activity.nom_chantier}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(activity.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      activity.statut === 'valide' ? 'bg-green-100 text-green-700' :
                      activity.statut === 'rejete' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {activity.statut || 'En attente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions Rapides */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Actions Rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <button 
                onClick={() => router.push('/admin/users')}
                className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all group"
              >
                <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Gérer Utilisateurs</h3>
                <p className="text-sm text-slate-600">Voir, modifier, supprimer</p>
              </button>

              <button 
                onClick={() => router.push('/admin/reports')}
                className="p-6 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-2xl border-2 border-orange-200 hover:border-orange-400 transition-all group"
              >
                <FileText className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Valider Rapports</h3>
                <p className="text-sm text-slate-600">{stats.reports.pending} en attente</p>
              </button>

              <button 
                onClick={() => alert('Export des données — Fonctionnalité bientôt disponible')}
                className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 transition-all group"
              >
                <Download className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Export Données</h3>
                <p className="text-sm text-slate-600">Bientôt disponible</p>
              </button>

              <button 
                onClick={() => alert('Paramètres système — Fonctionnalité bientôt disponible')}
                className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all group"
              >
                <Settings className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Paramètres</h3>
                <p className="text-sm text-slate-600">Bientôt disponible</p>
              </button>

              <button 
                onClick={() => router.push('/admin/users?filter=block')}
                className="p-6 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 rounded-2xl border-2 border-red-200 hover:border-red-400 transition-all group"
              >
                <Ban className="w-8 h-8 text-red-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Bloquer Compte</h3>
                <p className="text-sm text-slate-600">Gérer les blocages</p>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
