/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { UploadCloud, Zap, Trophy, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Importer',
      description: 'Déposez simplement votre document',
      subtext: 'Formats acceptés : PDF, Word, EPUB, cours scannés ou notes manuscrites claires.',
      icon: <UploadCloud className="w-8 h-8 text-blue-600 animate-bounce" />,
      color: 'bg-blue-50 border-blue-100',
    },
    {
      id: 2,
      title: 'Analyser',
      description: 'Génération automatique complète',
      subtext: 'Notre moteur extrait les concepts clés pour créer un résumé clair, des quiz d\'évaluation et des flashcards.',
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      color: 'bg-amber-50/50 border-amber-100',
    },
    {
      id: 3,
      title: 'Réviser',
      description: 'Progressez chaque jour',
      subtext: 'Retenez vos cours à long terme avec le système de répétition espacée, suivez vos scores et grimpez au classement.',
      icon: <Trophy className="w-8 h-8 text-emerald-500" />,
      color: 'bg-emerald-50/50 border-emerald-100',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <span>Méthodologie simple</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Comment ça marche ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-500 mt-4 font-medium"
          >
            Trois étapes simples et fluides pour transformer n'importe quel cours en une session d'apprentissage active et efficace.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              id={`how-step-card-${step.id}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-slate-200/60 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
            >
              <div className="space-y-6">
                {/* Step Number Badge */}
                <div className="flex items-center justify-between">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  <span className="text-5xl font-extrabold text-slate-100 select-none font-mono">
                    0{step.id}
                  </span>
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                    {step.title}
                  </h3>
                  <p className="text-base font-semibold text-slate-700 leading-snug">
                    {step.description}
                  </p>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed pt-1">
                    {step.subtext}
                  </p>
                </div>
              </div>

              {/* Decorative side connector for desktop */}
              {index < 2 && (
                <div className="hidden lg:flex absolute top-1/2 -right-6 translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-2xs">
                    <ArrowRight className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
