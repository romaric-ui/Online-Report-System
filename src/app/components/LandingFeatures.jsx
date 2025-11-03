"use client";
import { 
  FileText, 
  Users, 
  Lock, 
  Zap, 
  Download, 
  Bell,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export default function LandingFeatures() {
  const features = [
    {
      icon: FileText,
      title: "Rapports intelligents",
      description: "Créez et gérez vos rapports de chantier en quelques clics avec notre interface intuitive.",
      color: "from-blue-500 to-cyan-500",
      delay: "0ms"
    },
    {
      icon: Users,
      title: "Collaboration en temps réel",
      description: "Partagez instantanément vos rapports avec votre équipe et vos clients.",
      color: "from-purple-500 to-pink-500",
      delay: "100ms"
    },
    {
      icon: Lock,
      title: "Sécurité maximale",
      description: "Vos données sont cryptées et sauvegardées automatiquement dans le cloud.",
      color: "from-green-500 to-emerald-500",
      delay: "200ms"
    },
    {
      icon: Zap,
      title: "Performance optimale",
      description: "Interface ultra-rapide qui fonctionne même hors ligne.",
      color: "from-yellow-500 to-orange-500",
      delay: "300ms"
    },
    {
      icon: Download,
      title: "Export PDF professionnel",
      description: "Générez des PDF personnalisés avec votre logo en un seul clic.",
      color: "from-red-500 to-pink-500",
      delay: "400ms"
    },
    {
      icon: Bell,
      title: "Notifications intelligentes",
      description: "Recevez des alertes en temps réel sur l'avancement de vos projets.",
      color: "from-indigo-500 to-blue-500",
      delay: "500ms"
    }
  ];

  const stats = [
    { value: "10k+", label: "Rapports créés", icon: FileText },
    { value: "500+", label: "Entreprises", icon: Users },
    { value: "99.9%", label: "Disponibilité", icon: TrendingUp },
    { value: "24/7", label: "Support", icon: Clock }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-4">
            <Shield className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Fonctionnalités</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une plateforme complète pour gérer vos rapports de construction de A à Z
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <Icon className="w-8 h-8 text-white/80 mx-auto mb-3" />
                  <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </p>
                  <p className="text-blue-100 font-medium">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Pourquoi choisir notre plateforme ?
            </h3>
            <p className="text-lg text-gray-600">
              Rejoignez des centaines d'entreprises qui font confiance à notre solution pour gérer leurs rapports de chantier.
            </p>
            <div className="space-y-4">
              {[
                "Interface intuitive et facile à prendre en main",
                "Synchronisation automatique sur tous vos appareils",
                "Support technique réactif et disponible",
                "Mises à jour régulières avec nouvelles fonctionnalités",
                "Sécurité renforcée et données protégées"
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700 text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative animate-fade-in-up animation-delay-300">
            {/* Decorative illustration */}
            <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-100">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform delay-75">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform delay-150">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-4/5 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded w-2/5"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}