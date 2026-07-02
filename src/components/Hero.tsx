/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Play, Upload, CheckCircle2, Sparkles, Trophy, BookOpen, GraduationCap } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HeroProps {
  onNavigate?: (view: string) => void;
  currentUser?: any;
}

export default function Hero({ onNavigate, currentUser }: HeroProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position hooks for real-time 3D parallax tilt effect on the mockup card
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Smooth springs for a luxury feel
  const springConfig = { damping: 25, stiffness: 120, mass: 0.8 };
  const rotateX = useSpring(coords.y * -15, springConfig);
  const rotateY = useSpring(coords.x * 15, springConfig);
  const scale = useSpring(isHovered ? 1.03 : 1.0, springConfig);

  useEffect(() => {
    rotateX.set(coords.y * -15);
    rotateY.set(coords.x * 15);
  }, [coords, rotateX, rotateY]);

  const handleScrollToId = (id: string) => {
    playClickSound();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-slate-50 overflow-hidden min-h-screen flex items-center"
    >
      {/* Absolute Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-400/25 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[450px] h-[450px] bg-blue-300/15 rounded-full blur-3xl animate-pulse-slow-reverse pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 flex flex-col space-y-8 text-left">
            
            {/* Soft Premium Banner Tag */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center space-x-2 self-start px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Réinventer la réussite scolaire</span>
            </motion.div>

            {/* Giant Display Titles */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.1]"
              >
                Révisez plus vite.
                <span className="block text-blue-600 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Comprenez mieux.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-xl"
              >
                Importez vos documents, obtenez un résumé clair, entraînez-vous avec des quiz intelligents et progressez chaque jour.
              </motion.p>
            </div>

            {/* Premium CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <button
                id="hero-cta-primary"
                onClick={() => {
                  playClickSound();
                  if (currentUser) {
                    if (onNavigate) onNavigate('dashboard');
                  } else {
                    if (onNavigate) onNavigate('register');
                  }
                }}
                className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-base font-semibold shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{currentUser ? 'Mon Tableau de Bord' : 'Commencer gratuitement'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              <button
                id="hero-cta-secondary"
                onClick={() => handleScrollToId('demo-dashboard-section')}
                className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 px-7 py-4 rounded-xl text-base font-semibold shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-300">
                  <Play className="w-3 h-3 text-slate-600 group-hover:text-blue-600 fill-slate-600 group-hover:fill-blue-600 transition-colors duration-300" />
                </div>
                <span>Voir une démonstration</span>
              </button>
            </motion.div>

            {/* Core Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-6 border-t border-slate-200/60 flex flex-wrap gap-x-6 gap-y-3"
            >
              <div className="flex items-center space-x-2 text-slate-600 text-sm font-medium">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600 text-sm font-medium">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600" />
                <span>Version bêta gratuite</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600 text-sm font-medium">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600" />
                <span>Compatible PWA</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Floating 3D Mockup Container */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <motion.div
              style={{
                rotateX,
                rotateY,
                scale,
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={() => setIsHovered(true)}
              className="w-full max-w-[540px] aspect-[1.25/1] relative cursor-grab active:cursor-grabbing transition-shadow duration-300"
            >
              {/* Luxury Real shadow layer underneath */}
              <div className="absolute inset-4 rounded-2xl bg-slate-900/10 blur-2xl transform translate-y-8 scale-[0.95] pointer-events-none transition-all duration-300" />

              {/* Main Mockup Outer Box */}
              <div className="absolute inset-0 bg-white border border-slate-200/75 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Mockup Top Window bar */}
                <div className="h-10 bg-slate-50 border-b border-slate-200/65 px-4 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="w-48 h-5 rounded-md bg-slate-200/60 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    dashboard.studora.fr
                  </div>
                  <div className="w-4" />
                </div>

                {/* Mockup Inside content layout */}
                <div className="flex-1 flex bg-slate-50">
                  {/* Left Mockup Sidebar */}
                  <div className="w-[60px] md:w-[150px] border-r border-slate-200/50 bg-white p-3 flex flex-col space-y-4">
                    <div className="flex items-center space-x-2 px-1 py-1.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                        <GraduationCap className="w-4.5 h-4.5 text-white" />
                      </div>
                      <span className="hidden md:inline font-bold text-xs text-slate-900">Studora</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col space-y-1">
                      <div className="h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center px-2 space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden md:inline font-semibold text-[11px]">Documents</span>
                      </div>
                      <div className="h-8 rounded-lg text-slate-400 flex items-center px-2 space-x-2">
                        <Trophy className="w-4 h-4" />
                        <span className="hidden md:inline font-semibold text-[11px]">Quiz</span>
                      </div>
                      <div className="h-8 rounded-lg text-slate-400 flex items-center px-2 space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden md:inline font-semibold text-[11px]">Flashcards</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Mockup Right Content */}
                  <div className="flex-1 p-4 md:p-6 flex flex-col space-y-4 text-left overflow-hidden">
                    {/* Header line */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/40">
                      <div>
                        <div className="h-4 w-32 bg-slate-200 rounded-md mb-1" />
                        <div className="h-3 w-48 bg-slate-100 rounded-md" />
                      </div>
                      <div className="h-8 px-3 rounded-lg bg-blue-600/10 text-blue-600 text-[10px] font-bold flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Smart Core V1</span>
                      </div>
                    </div>

                    {/* Stats summary cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-slate-200/50 rounded-xl flex items-center space-x-3 shadow-2xs">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-slate-900">12</div>
                          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Documents</div>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-200/50 rounded-xl flex items-center space-x-3 shadow-2xs">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-slate-900">95%</div>
                          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Score moyen</div>
                        </div>
                      </div>
                    </div>

                    {/* Active uploading item simulator container */}
                    <div className="p-4 bg-white border border-slate-200/60 rounded-xl shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-mono text-[10px] font-bold">
                            PDF
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-800">Physique_Chapitre_3.pdf</div>
                            <div className="text-[8px] font-medium text-slate-400">1.2 MB</div>
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full font-bold">
                          Analysé
                        </span>
                      </div>

                      {/* Loading status bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                          <span>Génération du résumé</span>
                          <span>100%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="w-full h-full bg-blue-600 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Micro Flashcard preview */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-md flex items-center justify-between relative overflow-hidden">
                      {/* Grid background effect */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:10px_10px] opacity-40" />
                      
                      <div className="relative z-10 space-y-1">
                        <div className="text-[8px] uppercase tracking-wider font-bold text-blue-400">Flashcard #4</div>
                        <div className="text-[11px] font-semibold max-w-[200px]">Qu'est-ce que l'impulsion ?</div>
                        <div className="text-[9px] font-medium text-slate-400 italic">Cliquez pour voir la réponse...</div>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-xs relative z-10">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Floating Visual Elements to make it feel super 3D & premium */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ transform: 'translateZ(40px)' }}
                className="absolute -top-6 -right-6 bg-white border border-slate-200/50 p-3 rounded-xl shadow-lg flex items-center space-x-2.5 hidden md:flex"
              >
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-800">Résumé Prêt !</p>
                  <p className="text-[8px] font-semibold text-slate-400">14 fiches créées</p>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                style={{ transform: 'translateZ(30px)' }}
                className="absolute -bottom-6 -left-6 bg-white border border-slate-200/50 p-3 rounded-xl shadow-lg flex items-center space-x-2.5 hidden md:flex"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-500">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-800">Score de Révision</p>
                  <p className="text-[8px] font-semibold text-slate-400">+125 XP gagnés</p>
                </div>
              </motion.div>
              
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
