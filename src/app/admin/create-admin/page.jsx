'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Shield, UserPlus, Mail, Lock, User, Eye, EyeOff,
  CheckCircle, AlertCircle, ArrowLeft, Trash2,
  Users, FileText, MessageSquare, BarChart3, LogOut,
  ChevronRight, Calendar
} from 'lucide-react';

export default function CreateAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Vérification admin
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

  // Charger la liste des admins
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchAdmins();
    }
  }, [status, session]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/create-admin');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Erreur chargement admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation front
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const roleLabel = formData.role === 'admin' ? 'administrateur' : 'utilisateur';
      setSuccess(`Compte ${roleLabel} créé avec succès pour ${data.admin.prenom} ${data.admin.nom}`);
      setFormData({ nom: '', prenom: '', email: '', password: '', confirmPassword: '', role: 'admin' });
      fetchAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-50 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">SGTEC</h1>
              <p className="text-slate-400 text-xs font-medium">Administration</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <a href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group">
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </a>
          <a href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group">
            <Users className="w-5 h-5" />
            <span>Utilisateurs</span>
          </a>
          <a href="/admin/reports" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group">
            <FileText className="w-5 h-5" />
            <span>Rapports</span>
          </a>
          <a href="/admin/messages" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all group">
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </a>
          <a href="/admin/create-admin" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg font-medium">
            <UserPlus className="w-5 h-5" />
            <span>Créer un admin</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu Principal */}
      <main className="ml-72 min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-blue-900 bg-clip-text text-transparent">
                  Gestion des Administrateurs
                </h1>
                <p className="text-slate-600 mt-1">Créer et gérer les comptes administrateurs</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-2 rounded-xl border border-indigo-200">
                  <p className="text-xs text-slate-500">Admins</p>
                  <p className="text-2xl font-bold text-indigo-600">{admins.length}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Formulaire de création */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Créer un compte</h2>
              </div>
              <p className="text-indigo-200 text-sm mt-1">Choisissez le rôle du compte à créer</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Messages */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Prénom"
                      required
                    />
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Nom de famille"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="admin@exemple.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="Min. 8 caractères"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200'
                      }`}
                      placeholder="Répétez le mot de passe"
                      required
                    />
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Sélecteur de rôle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Rôle du compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.role === 'admin' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={handleChange}
                      className="accent-indigo-600"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Administrateur</p>
                      <p className="text-xs text-slate-500">Accès complet au système</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.role === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={handleChange}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">Utilisateur</p>
                      <p className="text-xs text-slate-500">Gestion de ses propres rapports</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info sécurité */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Sécurité</p>
                    <ul className="space-y-1 text-amber-700">
                      <li>• Le compte admin ne pourra se connecter que par email/mot de passe (pas via Google)</li>
                      <li>• Le mot de passe sera hashé avec bcrypt (12 rounds)</li>
                      <li>• Communiquez les identifiants de manière sécurisée</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {formData.role === 'admin' ? 'Créer le compte administrateur' : 'Créer le compte utilisateur'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Liste des admins existants */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Comptes administrateurs existants
              </h2>
              <p className="text-sm text-slate-500 mt-1">{admins.length} compte(s) admin</p>
            </div>

            {loadingAdmins ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-slate-500 text-sm">Chargement...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Aucun compte administrateur trouvé
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <div key={admin.id} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow">
                        {admin.prenom?.charAt(0)}{admin.nom?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{admin.prenom} {admin.nom}</p>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          admin.statut === 'actif' || !admin.statut
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            admin.statut === 'actif' || !admin.statut ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {admin.statut === 'actif' || !admin.statut ? 'Actif' : 'Bloqué'}
                        </span>
                        {admin.date_creation && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(admin.date_creation).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
