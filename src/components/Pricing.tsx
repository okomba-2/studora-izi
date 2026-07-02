/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { toast } from '../utils/toast';

interface PricingProps {
  onNavigate?: (view: string) => void;
}

export default function Pricing({ onNavigate }: PricingProps = {}) {
  const handlePlanClick = (planName: string) => {
    playClickSound();
    toast.show(`Merci pour votre intérêt ! La souscription à l'offre ${planName} sera disponible très bientôt pour le lancement de la version finale.`, 'success');
  };

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-100/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Tarifs transparents</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Des formules adaptées à votre réussite
          </h2>
          <p className="text-lg text-slate-500 mt-4 font-medium">
            Commencez gratuitement avec l'offre Bêta ou libérez tout votre potentiel académique avec l'offre Premium. Sans engagement.
          </p>
        </div>

        {/* Pricing Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto items-center">
          
          {/* Card 1: Version Bêta (Gratuit) */}
          <motion.div
            id="pricing-card-beta"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white border border-slate-200/80 p-8 md:p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between h-full relative"
          >
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                  Version Bêta
                </span>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl md:text-5xl font-extrabold text-slate-950">Gratuit</span>
                </div>
                <p className="text-sm font-medium text-slate-400">Pour tester Studora et démarrer vos révisions.</p>
              </div>

              {/* Feature List */}
              <ul className="space-y-4 mb-8">
                {[
                  '1 document par mois',
                  '1 résumé structuré',
                  '1 quiz d\'évaluation',
                  'Historique de 7 jours',
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center space-x-3 text-sm font-semibold text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              id="btn-choose-beta"
              onClick={() => {
                playClickSound();
                if (onNavigate) {
                  onNavigate('register');
                } else {
                  handlePlanClick('Bêta');
                }
              }}
              className="w-full py-4 px-6 rounded-xl text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors cursor-pointer text-center"
            >
              Commencer
            </button>
          </motion.div>

          {/* Card 2: Premium (5000 FCFA/mois) */}
          <motion.div
            id="pricing-card-premium"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-white border-2 border-blue-600 p-8 md:p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left flex flex-col justify-between h-full relative overflow-hidden"
          >
            {/* Spotlight Accent Banner */}
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-bl-xl shadow-xs flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Populaire</span>
            </div>

            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                  Premium
                </span>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl md:text-5xl font-extrabold text-slate-950">5 000 FCFA</span>
                  <span className="text-sm font-bold text-slate-400 ml-2">/ mois</span>
                </div>
                <p className="text-sm font-medium text-slate-400">L'arme ultime pour exceller à vos examens et concours.</p>
              </div>

              {/* Feature List */}
              <ul className="space-y-4 mb-8">
                {[
                  '10 documents par mois',
                  '10 résumés structurés',
                  '15 quiz d\'évaluation',
                  '10 jeux de flashcards',
                  'Historique de 30 jours',
                  'Support client prioritaire',
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center space-x-3 text-sm font-semibold text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              id="btn-choose-premium"
              onClick={() => handlePlanClick('Premium')}
              className="w-full py-4 px-6 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/15 hover:shadow-xl hover:shadow-blue-600/25 transition-all cursor-pointer text-center flex items-center justify-center space-x-2 group"
            >
              <span>Passer Premium</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

        </div>

        {/* Currency reminder notice */}
        <div className="mt-12 flex items-center justify-center space-x-2 text-xs font-semibold text-slate-400">
          <AlertCircle className="w-4 h-4 text-slate-400" />
          <span>L'offre Premium est payée de manière sécurisée par Mobile Money (Orange Money, Wave, MTN, Moov) ou Carte bancaire.</span>
        </div>

      </div>
    </section>
  );
}
