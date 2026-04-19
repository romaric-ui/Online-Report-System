"use client";
import "./globals.css";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState(null);

  // Rediriger les utilisateurs connectés vers leur dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (session.user.roleEntreprise === 1) {
        router.push('/dashboard-projet');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'login') {
      setShowAuthModal(true);
    }
    if (params.get('verified') === '1') {
      setShowAuthModal(true);
      setToast({ message: 'Compte vérifié ! Vous pouvez maintenant vous connecter.', type: 'success' });
    }
  }, []);

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

  const handleLogin = () => {
    setShowAuthModal(false);
    if (pendingAction) setPendingAction(null);
  };

  const handleLogout = () => {
    setPendingAction(null);
  };

  const getDashboardUrl = useCallback(() => {
    if (session?.user?.role === 'admin') return '/admin/dashboard';
    if (session?.user?.roleEntreprise === 1) return '/dashboard-projet';
    return '/dashboard';
  }, [session]);

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

  // Spinner pendant le chargement de la session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Ne rien afficher pendant la redirection
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
      <LandingHero
        onGetStarted={handleGetStarted}
        isAuthenticated={false}
      />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingPricing
        onGetStarted={() => setShowAuthModal(true)}
        isAuthenticated={false}
      />
      <LandingFAQ />
      <LandingCTA
        onGetStarted={handleGetStarted}
        isAuthenticated={false}
      />
      <LandingFooter />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onLogin={handleLogin}
      />

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
