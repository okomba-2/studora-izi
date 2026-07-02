/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface CTAProps {
  onNavigate?: (view: string) => void;
  currentUser?: any;
}

export default function CTA({ onNavigate, currentUser }: CTAProps = {}) {
  const handleCTAClick = () => {
    playClickSound();
    if (currentUser) {
      if (onNavigate) onNavigate('dashboard');
    } else {
      if (onNavigate) onNavigate('register');
    }
  };

  return (
    <section id="cta-section" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main CTA Card */}
        <motion.div
          id="cta-gradient-box"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-8 md:px-16 text-center text-white shadow-2xl overflow-hidden"
        >
          {/* Glowing particle decorations */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            
            {/* Banner badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accès instantané • Version Bêta ouverte</span>
            </div>

            {/* Title & Subtext */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Prêt à réussir vos révisions ?
              </h2>
              <p className="text-base md:text-lg text-blue-100 font-medium leading-relaxed">
                Rejoignez Studora dès aujourd'hui et transformez vos notes de cours volumineuses en sessions de révision productives, interactives et mémorables.
              </p>
            </div>

            {/* Interactive button */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <button
                id="cta-submit-btn"
                onClick={handleCTAClick}
                className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-blue-600 px-8 py-4 rounded-xl text-base font-extrabold shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:-translate-y-0.5"
              >
                <span>{currentUser ? 'Accéder à mon Tableau de Bord' : 'Créer mon compte gratuitement'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-blue-100">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Pas de carte de crédit requise</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Installation PWA instantanée</span>
                </span>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
