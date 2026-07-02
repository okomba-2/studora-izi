/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Users, HelpCircle, Heart } from 'lucide-react';

interface StatItemProps {
  id: string;
  endValue: number;
  suffix: string;
  label: string;
  sublabel: string;
  icon: ReactNode;
}

function StatCounter({ endValue, suffix, label, sublabel, icon, id }: StatItemProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000; // ms
          const stepTime = 30; // ms
          const totalSteps = Math.ceil(duration / stepTime);
          const stepValue = endValue / totalSteps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= totalSteps) {
              setCount(endValue);
              clearInterval(timer);
            } else {
              start += stepValue;
              setCount(Math.floor(start));
            }
          }, stepTime);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [endValue, hasAnimated]);

  return (
    <motion.div
      ref={elementRef}
      id={`stat-card-${id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-slate-200/50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row items-center md:items-start text-center md:text-left space-y-4 md:space-y-0 md:space-x-6 relative overflow-hidden"
    >
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-40 pointer-events-none" />

      <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 relative z-10 shrink-0">
        {icon}
      </div>

      <div className="relative z-10">
        <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-1 font-mono">
          {count}
          <span className="text-blue-600">{suffix}</span>
        </h3>
        <p className="text-base font-bold text-slate-800">{label}</p>
        <p className="text-sm font-semibold text-slate-400 mt-1">{sublabel}</p>
      </div>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section id="stats" className="py-20 bg-slate-50 relative border-y border-slate-200/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCounter
            id="beta-students"
            endValue={100}
            suffix="+"
            label="Étudiants bêta activés"
            sublabel="Réviseurs réguliers sur la plateforme"
            icon={<Users className="w-6 h-6" />}
          />
          <StatCounter
            id="completed-quizzes"
            endValue={1000}
            suffix="+"
            label="Quiz d'évaluation réalisés"
            sublabel="Générés et complétés avec succès"
            icon={<HelpCircle className="w-6 h-6" />}
          />
          <StatCounter
            id="user-satisfaction"
            endValue={95}
            suffix="%"
            label="Taux de satisfaction"
            sublabel="Mesuré après 1 mois d'utilisation"
            icon={<Heart className="w-6 h-6" />}
          />
        </div>

      </div>
    </section>
  );
}
