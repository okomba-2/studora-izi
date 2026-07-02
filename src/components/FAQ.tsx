/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  key?: string;
}

function FAQAccordionItem({ id, question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div id={`faq-item-${id}`} className="border-b border-slate-200/70 py-4">
      <button
        id={`faq-btn-${id}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer group"
        aria-expanded={isOpen}
      >
        <span className="text-base md:text-lg leading-snug">{question}</span>
        <div className={`p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 transition-all duration-300 ${isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-sm md:text-base font-medium text-slate-500 leading-relaxed pb-4 pr-6">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>('docs');

  const faqItems = [
    {
      id: 'docs',
      question: 'Quels documents sont acceptés ?',
      answer: 'Studora prend en charge une large variété de formats : fichiers PDF (.pdf), documents Word (.docx), livres électroniques EPUB (.epub), mais aussi des cours au format image ou des photographies lisibles de vos notes de cours manuscrites claires.',
    },
    {
      id: 'how-it-works',
      question: 'Comment fonctionne Studora ?',
      answer: 'Une fois votre cours importé, notre moteur d’analyse sémantique extrait les idées clés, les formules importantes et la structure de votre leçon. À partir de là, il génère de manière ordonnée un résumé synthétique, des questionnaires d\'évaluation (QCM) ainsi que des flashcards de mémorisation active.',
    },
    {
      id: 'phone',
      question: 'Puis-je utiliser Studora sur téléphone ?',
      answer: 'Absolument ! Studora est entièrement optimisé pour les smartphones et les tablettes. De plus, il est conçu avec la technologie PWA (Progressive Web App). Vous pouvez ainsi l\'installer directement sur l’écran d’accueil de votre téléphone en un clic pour l\'utiliser comme une application classique.',
    },
    {
      id: 'subscription',
      question: "Comment fonctionne l'abonnement ?",
      answer: 'La formule Bêta est 100% gratuite et vous donne accès aux fonctionnalités essentielles. Notre formule Premium à 5000 FCFA/mois augmente vos capacités mensuelles d\'import, multiplie le nombre de quiz générés et débloque le support client prioritaire. L\'abonnement est sans engagement et annulable à tout moment.',
    },
    {
      id: 'security',
      question: 'Mes documents sont-ils sécurisés ?',
      answer: 'La confidentialité est notre priorité. Tous les documents que vous importez sur Studora restent strictement privés et confidentiels. Ils ne sont ni partagés, ni vendus, ni utilisés pour entraîner d’autres moteurs publics. Vous pouvez supprimer vos fichiers de nos bases à n’importe quel moment.',
    },
  ];

  const handleToggle = (id: string) => {
    playClickSound();
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
    }
  };

  return (
    <section id="faq" className="py-24 bg-slate-50 relative border-y border-slate-200/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Foire aux questions</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Des réponses à vos questions
          </h2>
          <p className="text-lg text-slate-500 mt-4 font-medium">
            Toutes les réponses pour comprendre le fonctionnement de Studora et démarrer sereinement vos séances d'apprentissage.
          </p>
        </div>

        {/* Accordions Card */}
        <motion.div
          id="faq-accordions-container"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-slate-200/50 rounded-2xl p-6 md:p-10 shadow-lg"
        >
          {faqItems.map((item) => (
            <FAQAccordionItem
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
              isOpen={openId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
