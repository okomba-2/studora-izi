/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import DashboardDemo from './components/DashboardDemo';
import Leaderboard from './components/Leaderboard';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';

// Authentication & onboarding pages
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import OnboardingView from './components/OnboardingView';
import StudentDashboard from './components/StudentDashboard';

import { authService, UserProfile } from './lib/supabase';
import { playClickSound, playSuccessSound } from './utils/audio';
import { toast } from './utils/toast';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // 1. Hash Routing Sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/login') {
        setCurrentView('login');
      } else if (hash === '#/register') {
        setCurrentView('register');
      } else if (hash === '#/onboarding') {
        setCurrentView('onboarding');
      } else if (hash === '#/dashboard') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
      // Scroll to top on route change
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. Load User Profile on Auth Change
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await authService.getProfile(user.id);
          setUserProfile(profile);
        } catch (err) {
          console.error('Erreur de chargement du profil:', err);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Navigation helper to update the hash
  const navigateTo = (view: string) => {
    if (view === 'landing') {
      window.location.hash = '';
    } else {
      window.location.hash = `#/${view}`;
    }
  };

  // 4. Guards check on sensitive dashboard/onboarding routes
  useEffect(() => {
    if (isLoadingAuth) return;

    if ((currentView === 'onboarding' || currentView === 'dashboard') && !currentUser) {
      toast.show('Veuillez vous connecter pour accéder à cet espace.', 'info');
      navigateTo('login');
    }

    if (currentView === 'dashboard' && userProfile && !userProfile.role) {
      toast.show('Veuillez terminer la configuration de votre profil.', 'info');
      navigateTo('onboarding');
    }
  }, [currentView, currentUser, userProfile, isLoadingAuth]);

  // 5. Handlers
  const handleLoginSuccess = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const profile = await authService.getProfile(user.id);
      setUserProfile(profile);
      
      if (profile && profile.role) {
        toast.show('Bienvenue de retour sur Studora !', 'success');
        navigateTo('dashboard');
      } else {
        toast.show('Remplissons d’abord votre profil d’études !', 'success');
        navigateTo('onboarding');
      }
    }
  };

  const handleRegisterSuccess = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const profile = await authService.getProfile(user.id);
      setUserProfile(profile);
      navigateTo('onboarding');
    }
  };

  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    navigateTo('dashboard');
  };

  const handleLogout = async () => {
    playClickSound();
    try {
      await authService.signOut();
      setCurrentUser(null);
      setUserProfile(null);
      playSuccessSound();
      toast.show('Déconnexion réussie. À bientôt !', 'success');
      navigateTo('landing');
    } catch (err: any) {
      toast.show(err.message || 'Une erreur est survenue lors de la déconnexion.', 'warning');
    }
  };

  // 6. Conditional View Rendering
  const renderCurrentView = () => {
    if (isLoadingAuth) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Chargement de Studora...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'login':
        return (
          <LoginView
            onNavigate={navigateTo}
            onLoginSuccess={handleLoginSuccess}
          />
        );

      case 'register':
        return (
          <RegisterView
            onNavigate={navigateTo}
            onRegisterSuccess={handleRegisterSuccess}
          />
        );

      case 'onboarding':
        return (
          <OnboardingView
            onNavigate={navigateTo}
            onOnboardingComplete={handleOnboardingComplete}
          />
        );

      case 'dashboard':
        if (userProfile) {
          return (
            <StudentDashboard
              userProfile={userProfile}
              onLogout={handleLogout}
              onNavigate={navigateTo}
            />
          );
        }
        return null;

      case 'landing':
      default:
        return (
          <>
            {/* Landing page layout sections */}
            <Hero onNavigate={navigateTo} currentUser={currentUser} />
            <Stats />
            <HowItWorks />
            <Features />
            <DashboardDemo userProfile={userProfile} />
            <Leaderboard />
            <Pricing onNavigate={navigateTo} />
            <FAQ />
            <CTA onNavigate={navigateTo} currentUser={currentUser} />
            <Footer />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-x-hidden relative">
      {/* Dynamic light gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.04),transparent_50%)] pointer-events-none" />

      {/* Render sticky Navbar except inside login, register, or onboarding states for clean minimalist UI */}
      {currentView !== 'login' && currentView !== 'register' && currentView !== 'onboarding' && currentView !== 'dashboard' && (
        <Navbar
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={navigateTo}
          onLogout={handleLogout}
        />
      )}

      {/* Primary routing content */}
      {renderCurrentView()}

      {/* Global Toast Alerts system */}
      <ToastContainer />
    </div>
  );
}
