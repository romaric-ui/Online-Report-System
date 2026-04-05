"use client";
import "./globals.css";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";
import LandingHero from "./components/LandingHero";
import LandingFeatures from "./components/LandingFeatures";
import LandingPricing from "./components/LandingPricing";
import LandingFAQ from "./components/LandingFAQ";
import LandingCTA from "./components/LandingCTA";
import LandingFooter from "./components/LandingFooter";
import LandingTestimonials from "./components/LandingTestimonials";

export default function Home() {
  const { data: session, status } = useSession();

  // États d'authentification
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState(null);

  // Vérifier si on doit ouvrir le modal de connexion (pour admin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'login') {
      setShowAuthModal(true);
    }
  }, []);

  // Synchroniser l'état user avec NextAuth session
  useEffect(() => {
    if (session?.user) {
      const userData = {
        id: session.user.id || session.user.email,
        email: session.user.email,
        nom: session.user.name || session.user.nom,
        prenom: session.user.prenom || '',
        isGoogle: session.user.isGoogle || true,
        isAuthenticated: true
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } else if (status === 'unauthenticated') {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, [session, status]);

  // Fonction utilitaire pour afficher les toasts
  const showToast = useCallback((toastData) => {
    setToast(toastData);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fonctions d'authentification
  const handleLogin = () => {
    setShowAuthModal(false);
    if (pendingAction) {
      setPendingAction(null);
    }
  };

  const handleLogout = () => {
    setPendingAction(null);
  };

  // Retourne l'URL du dashboard selon le rôle
  const getDashboardUrl = useCallback(() => {
    return session?.user?.role === 'admin' ? '/dashboard-projet' : '/dashboard';
  }, [session]);

  // Helper pour ouvrir le modal ou rediriger vers le dashboard
  const handleGetStarted = useCallback(() => {
    if (status === 'authenticated' && session?.user) {
      window.location.href = getDashboardUrl();
    } else if (status === 'loading') {
      setTimeout(() => {
        if (session?.user) {
          window.location.href = getDashboardUrl();
        } else {
          setShowAuthModal(true);
        }
      }, 500);
    } else {
      setShowAuthModal(true);
    }
  }, [status, session, getDashboardUrl]);

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
      <LandingHero 
        onGetStarted={handleGetStarted}
        isAuthenticated={status === 'authenticated'}
      />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingPricing
        onGetStarted={() => {
          if (status === 'authenticated' && session?.user) {
            window.location.href = getDashboardUrl();
          } else {
            setShowAuthModal(true);
          }
        }}
        isAuthenticated={status === 'authenticated'}
      />
      <LandingFAQ />
      <LandingCTA 
        onGetStarted={handleGetStarted}
        isAuthenticated={status === 'authenticated'}
      />
      <LandingFooter />
      
      {/* Modal d'authentification */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onLogin={handleLogin}
      />
      
      {/* Notification Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
