/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  BrainCircuit,
  FileCheck,
  Award,
  BookOpen,
  Volume2,
  Smartphone,
  Sparkles,
  TrendingUp,
  Layers,
  Download
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  tag?: string;
  index: number;
  key?: string;
}

function FeatureCard({ id, title, description, icon, tag, index }: FeatureCardProps) {
  return (
    <motion.div
      id={`feature-card-${id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => playClickSound()}
      className="bg-white border border-slate-200/50 p-6 md:p-8 rounded-2xl shadow-xs hover:shadow-lg hover:border-blue-200 transition-all duration-300 text-left flex flex-col justify-between group cursor-pointer relative"
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            {icon}
          </div>
          {tag && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100 uppercase tracking-wide">
              {tag}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
          {title}
        </h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
        <span>En savoir plus</span>
        <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const featuresList = [
    {
      id: 'doc-ai',
      title: 'Analyse intelligente de documents',
      description: 'Extrayez automatiquement les notions clés de vos PDF, fichiers Word, EPUB ou notes de cours.',
      icon: <BrainCircuit className="w-6 h-6" />,
      tag: 'Magique',
    },
    {
      id: 'auto-summary',
      title: 'Résumé automatique structuré',
      description: 'Gagnez des heures de lecture en obtenant des synthèses claires, concises et parfaitement découpées.',
      icon: <Sparkles className="w-6 h-6" />,
      tag: 'Productivité',
    },
    {
      id: 'interactive-quizzes',
      title: 'Quiz interactifs à la demande',
      description: 'Évaluez vos connaissances immédiatement après l’import avec des questionnaires personnalisés.',
      icon: <FileCheck className="w-6 h-6" />,
      tag: 'Validation',
    },
    {
      id: 'smart-flashcards',
      title: 'Flashcards mémorielles',
      description: 'Profitez du système de répétition espacée (SRS) pour mémoriser durablement vos concepts clés.',
      icon: <Layers className="w-6 h-6" />,
      tag: 'Mémoire',
    },
    {
      id: 'doc-history',
      title: 'Historique complet',
      description: 'Retrouvez tous vos cours, synthèses et quiz précédents en un clic dans votre coffre-fort numérique.',
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: 'progress-tracker',
      title: 'Suivi de progression',
      description: 'Visualisez vos scores moyens, votre temps de révision et vos axes d’amélioration au fil des jours.',
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      id: 'leaderboard',
      title: 'Classement amical',
      description: 'Mesurez-vous aux autres étudiants de votre niveau, gagnez des points d’XP et restez motivé.',
      icon: <Award className="w-6 h-6" />,
    },
    {
      id: 'interactive-sounds',
      title: 'Sons interactifs immersifs',
      description: 'Chaque bonne réponse ou réussite de jalon s’accompagne d’effets sonores valorisants et motivants.',
      icon: <Volume2 className="w-6 h-6" />,
      tag: 'Premium',
    },
    {
      id: 'mobile-optimized',
      title: 'Optimisé pour mobile',
      description: 'Révisez n’importe où, dans les transports ou en pause, grâce à une interface mobile ultra-rapide.',
      icon: <Smartphone className="w-6 h-6" />,
    },
    {
      id: 'pwa-installable',
      title: 'Installation PWA',
      description: 'Installez Studora sur l’écran d’accueil de votre téléphone ou PC comme une application native.',
      icon: <Download className="w-6 h-6" />,
      tag: 'PWA',
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50 relative border-y border-slate-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <span>Un arsenal complet</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Conçu pour vous mener au succès
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-500 mt-4 font-medium"
          >
            Découvrez une suite d'outils puissants mais simples, calibrés pour optimiser votre productivité et consolider votre mémoire.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feat, index) => (
            <FeatureCard
              key={feat.id}
              id={feat.id}
              title={feat.title}
              description={feat.description}
              icon={feat.icon}
              tag={feat.tag}
              index={index}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
