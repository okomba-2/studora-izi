/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight, GraduationCap } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { toast } from '../utils/toast';

interface NavbarProps {
  currentUser: any;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, currentView, onNavigate, onLogout }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect scroll to make navbar opaque
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (id: string) => {
    playClickSound();
    setIsMobileMenuOpen(false);
    
    // If we're not on the landing page, navigate to landing first, then scroll
    if (currentView !== 'landing') {
      onNavigate('landing');
      // Wait for navigation and DOM mount to scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of navbar
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const menuItems = [
    { label: 'Accueil', target: 'hero' },
    { label: 'Statistiques', target: 'stats' },
    { label: 'Comment ça marche', target: 'how-it-works' },
    { label: 'Fonctionnalités', target: 'features' },
    { label: 'Classement', target: 'leaderboard' },
    { label: 'Tarifs', target: 'pricing' },
    { label: 'FAQ', target: 'faq' },
  ];

  return (
    <>
      <motion.nav
        id="navbar-container"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-xs'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <button
                id="navbar-logo-btn"
                onClick={() => handleLinkClick('hero')}
                className="flex items-center space-x-2.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
                  <GraduationCap className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                  Studora
                </span>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item) => (
                <button
                  key={item.target}
                  id={`nav-link-${item.target}`}
                  onClick={() => handleLinkClick(item.target)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {currentUser ? (
                <>
                  <button
                    id="nav-btn-dashboard"
                    onClick={() => {
                      playClickSound();
                      onNavigate('dashboard');
                    }}
                    className="px-4 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
                  >
                    Tableau de Bord
                  </button>
                  <button
                    id="nav-btn-logout"
                    onClick={() => {
                      playClickSound();
                      onLogout();
                    }}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors duration-200 cursor-pointer"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="nav-btn-login"
                    onClick={() => {
                      playClickSound();
                      onNavigate('login');
                    }}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                  >
                    Connexion
                  </button>
                  <button
                    id="nav-btn-cta"
                    onClick={() => {
                      playClickSound();
                      onNavigate('register');
                    }}
                    className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-600/15 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 group cursor-pointer hover:-translate-y-0.5"
                  >
                    <span>S'inscrire gratuitement</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                id="mobile-menu-toggle"
                onClick={() => {
                  playClickSound();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 focus:outline-none transition-all duration-200"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Ouvrir le menu</span>
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state. */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-navigation-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden border-t border-slate-200/50 bg-white overflow-hidden shadow-xl"
            >
              <div className="px-4 pt-4 pb-8 space-y-1 sm:px-6 max-h-[calc(100vh-80px)] overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.target}
                    id={`mobile-nav-link-${item.target}`}
                    onClick={() => handleLinkClick(item.target)}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all duration-200"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3 px-4">
                  {currentUser ? (
                    <>
                      <button
                        id="mobile-nav-btn-dashboard"
                        onClick={() => {
                          playClickSound();
                          setIsMobileMenuOpen(false);
                          onNavigate('dashboard');
                        }}
                        className="w-full text-center py-3 text-base font-bold text-blue-600 hover:text-blue-700 transition-all duration-200"
                      >
                        Tableau de Bord
                      </button>
                      <button
                        id="mobile-nav-btn-logout"
                        onClick={() => {
                          playClickSound();
                          setIsMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-center py-3 text-base font-semibold text-slate-500 hover:text-rose-600 transition-all duration-200"
                      >
                        Se déconnecter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        id="mobile-nav-btn-login"
                        onClick={() => {
                          playClickSound();
                          setIsMobileMenuOpen(false);
                          onNavigate('login');
                        }}
                        className="w-full text-center py-3 text-base font-semibold text-slate-700 hover:text-blue-600 transition-all duration-200"
                      >
                        Connexion
                      </button>
                      <button
                        id="mobile-nav-btn-cta"
                        onClick={() => {
                          playClickSound();
                          setIsMobileMenuOpen(false);
                          onNavigate('register');
                        }}
                        className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-base font-semibold shadow-md shadow-blue-600/15 transition-all duration-200 cursor-pointer"
                      >
                        <span>S'inscrire gratuitement</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
