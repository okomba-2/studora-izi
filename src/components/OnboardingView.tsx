/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  School,
  MapPin,
  Target,
  Clock,
  Settings,
  CheckCircle,
  HelpCircle,
  UserCheck,
  Award,
  Volume2,
  Bell,
  Moon,
  VolumeX,
  BellOff,
  Sun
} from 'lucide-react';
import { authService, UserProfile } from '../lib/supabase';
import { playClickSound, playSuccessSound, playFailureSound, setSoundEnabled } from '../utils/audio';
import { toast } from '../utils/toast';

interface OnboardingViewProps {
  onNavigate: (view: string) => void;
  onOnboardingComplete: (profile: UserProfile) => void;
}

export default function OnboardingView({ onNavigate, onOnboardingComplete }: OnboardingViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding choices state
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('');
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [goal, setGoal] = useState('');
  const [dailyStudyTime, setDailyStudyTime] = useState('');
  const [soundEnabledState, setSoundEnabledState] = useState(true);
  const [notificationsEnabledState, setNotificationsEnabledState] = useState(true);
  const [darkModeState, setDarkModeState] = useState(false);

  // Load current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        toast.show("Veuillez vous connecter pour faire l'onboarding.", "warning");
        onNavigate('login');
      } else {
        setCurrentUser(user);
        
        // Fetch existing profile if available
        try {
          const profile = await authService.getProfile(user.id);
          if (profile) {
            if (profile.role) setRole(profile.role);
            if (profile.level) setLevel(profile.level);
            if (profile.school) setSchool(profile.school);
            if (profile.city) setCity(profile.city);
            if (profile.goal) setGoal(profile.goal);
            if (profile.daily_study_time) setDailyStudyTime(profile.daily_study_time);
            setSoundEnabledState(profile.sound_enabled ?? true);
            setNotificationsEnabledState(profile.notifications_enabled ?? true);
            setDarkModeState(profile.dark_mode ?? false);
          }
        } catch (e) {
          console.error("Error loading profile", e);
        }
      }
    };
    fetchUser();
  }, [onNavigate]);

  // Audio system sync
  useEffect(() => {
    setSoundEnabled(soundEnabledState);
  }, [soundEnabledState]);

  const totalSteps = 8;
  const progressPercent = (step / totalSteps) * 100;

  // Handlers
  const handleNext = () => {
    // Basic validations
    if (step === 1 && !role) {
      toast.show("Veuillez sélectionner qui vous êtes pour continuer.", "info");
      playFailureSound();
      return;
    }
    if (step === 2 && !level) {
      toast.show("Veuillez choisir votre niveau.", "info");
      playFailureSound();
      return;
    }
    if (step === 3 && !school.trim()) {
      toast.show("Veuillez saisir le nom de votre établissement.", "info");
      playFailureSound();
      return;
    }
    if (step === 4 && !city.trim()) {
      toast.show("Veuillez spécifier votre ville.", "info");
      playFailureSound();
      return;
    }
    if (step === 5 && !goal) {
      toast.show("Veuillez sélectionner votre objectif principal.", "info");
      playFailureSound();
      return;
    }
    if (step === 6 && !dailyStudyTime) {
      toast.show("Veuillez définir votre temps de révision quotidien.", "info");
      playFailureSound();
      return;
    }

    playClickSound();
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    playClickSound();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    playClickSound();
    // Default filling when skipping
    if (step === 1 && !role) setRole('étudiant');
    if (step === 2 && !level) setLevel('L2');
    if (step === 3 && !school) setSchool('Faculté des Sciences');
    if (step === 4 && !city) setCity('Brazzaville');
    if (step === 5 && !goal) setGoal('Améliorer mes notes');
    if (step === 6 && !dailyStudyTime) setDailyStudyTime('30 min');

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    playClickSound();

    try {
      const updatedProfile = await authService.updateProfile(currentUser.id, {
        role,
        level,
        school: school || 'Non renseigné',
        city: city || 'Non renseigné',
        goal,
        daily_study_time: dailyStudyTime,
        sound_enabled: soundEnabledState,
        notifications_enabled: notificationsEnabledState,
        dark_mode: darkModeState,
      });

      playSuccessSound();
      toast.show('Profil configuré avec succès ! Redirection vers votre espace.', 'success');
      
      // Let the parent app handle successful onboarding
      onOnboardingComplete(updatedProfile);
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || "Erreur lors de l'enregistrement du profil.", 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Levels selection helper depending on current profile role
  const getLevelsForRole = () => {
    if (role === 'élève') {
      return ['Seconde', 'Première', 'Terminale'];
    }
    if (role === 'étudiant') {
      return ['L1', 'L2', 'L3', 'Master 1', 'Master 2'];
    }
    if (role === 'enseignant') {
      return ['Collège', 'Lycée', 'Supérieur', 'Autre'];
    }
    return ['Formation professionnelle'];
  };

  // Helper translations for previewing human-readable profiles
  const roleLabels: Record<string, string> = {
    élève: '👨‍🎓 Élève',
    étudiant: '🎓 Étudiant',
    enseignant: '👨‍🏫 Enseignant',
    formation: '📚 Formation professionnelle',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative overflow-hidden">
      {/* Premium ambient light effects */}
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.06),transparent_60%)] pointer-events-none" />
      
      {/* 1. Header with Logo & Progress */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 text-blue-600 font-bold text-xl select-none">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span>Studora</span>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="flex items-center space-x-4">
          <div className="text-xs font-bold text-slate-500 hidden sm:block">
            Étape {step} sur {totalSteps}
          </div>
          <div className="w-32 h-2 bg-slate-200/60 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 bottom-0 bg-blue-600"
            />
          </div>
        </div>
      </header>

      {/* 2. Main Question Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[20px] p-8 md:p-12 relative overflow-hidden">
          {/* Top colored strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

          <AnimatePresence mode="wait">
            {/* STEP 1: WHO ARE YOU */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl inline-flex mb-2">
                    <UserCheck className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Qui êtes-vous ?</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Sélectionnez votre profil actuel pour nous aider à personnaliser vos révisions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {[
                    { id: 'élève', emoji: '👨‍🎓', label: 'Élève', desc: 'Collège ou Lycée' },
                    { id: 'étudiant', emoji: '🎓', label: 'Étudiant', desc: 'Université ou École supérieure' },
                    { id: 'enseignant', emoji: '👨‍🏫', label: 'Enseignant', desc: 'Professeur ou Formateur' },
                    { id: 'formation', emoji: '📚', label: 'Formation professionnelle', desc: 'Reconversion ou Perfectionnement' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        playClickSound();
                        setRole(option.id);
                        // Reset level if role changes
                        setLevel('');
                      }}
                      className={`p-5 rounded-xl border text-left flex items-start space-x-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                        role === option.id
                          ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-base">{option.label}</h3>
                        <p className="text-xs text-slate-500 font-medium">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: LEVEL */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl inline-flex mb-2">
                    <Award className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votre niveau</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Précisez votre classe ou année pour cibler les bons programmes d'études.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 max-h-[300px] overflow-y-auto pr-1">
                  {getLevelsForRole().map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        playClickSound();
                        setLevel(lvl);
                      }}
                      className={`p-4 rounded-xl border text-left font-bold text-sm transition-all duration-200 hover:shadow-xs flex items-center justify-between cursor-pointer ${
                        level === lvl
                          ? 'border-blue-500 bg-blue-50/20 text-blue-700 ring-4 ring-blue-500/10'
                          : 'border-slate-200/80 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span>{lvl}</span>
                      {level === lvl && <CheckCircle className="w-4.5 h-4.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: SCHOOL */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl inline-flex mb-2">
                    <School className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votre établissement</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Quel est le nom de votre école, université ou institution actuelle ?
                  </p>
                </div>

                <div className="mt-8 space-y-2 max-w-md mx-auto text-left">
                  <label htmlFor="school" className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">
                    Nom de l'établissement
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                      <School className="w-5 h-5" />
                    </span>
                    <input
                      id="school"
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Ex: Université de Brazzaville, Lycée Chaminade..."
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm font-semibold focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CITY */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-cyan-50 text-cyan-600 rounded-xl inline-flex mb-2">
                    <MapPin className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votre ville</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Dans quelle ville résidez-vous ou étudiez-vous ?
                  </p>
                </div>

                <div className="mt-8 space-y-2 max-w-md mx-auto text-left">
                  <label htmlFor="city" className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">
                    Ville
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Brazzaville, Pointe-Noire, Dolisie..."
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm font-semibold focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-2">
                    {['Brazzaville', 'Pointe-Noire', 'Dolisie'].map((presetCity) => (
                      <button
                        key={presetCity}
                        onClick={() => {
                          playClickSound();
                          setCity(presetCity);
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-bold transition-colors cursor-pointer"
                      >
                        📍 {presetCity}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: MAIN GOAL */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl inline-flex mb-2">
                    <Target className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votre objectif principal</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Nous adapterons notre algorithme d'IA et nos rappels à ce but ultime.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-6 max-w-md mx-auto">
                  {[
                    'Réussir mes examens',
                    'Améliorer mes notes',
                    'Réviser plus vite',
                    'Préparer un concours',
                    'Apprendre régulièrement'
                  ].map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        playClickSound();
                        setGoal(g);
                      }}
                      className={`p-4 rounded-xl border text-left font-bold text-sm transition-all duration-200 hover:shadow-xs flex items-center justify-between cursor-pointer ${
                        goal === g
                          ? 'border-blue-500 bg-blue-50/20 text-blue-700 ring-4 ring-blue-500/10'
                          : 'border-slate-200/80 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span>{g}</span>
                      {goal === g && <CheckCircle className="w-4.5 h-4.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 6: REVISION TIME */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-rose-50 text-rose-600 rounded-xl inline-flex mb-2">
                    <Clock className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Temps quotidien</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Combien de temps souhaitez-vous réviser chaque jour ?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  {[
                    { id: '15 min', icon: '⚡', label: '15 min / jour', sub: 'Micro-apprentissage léger' },
                    { id: '30 min', icon: '🔋', label: '30 min / jour', sub: 'Rythme optimal recommandé' },
                    { id: '45 min', icon: '📈', label: '45 min / jour', sub: 'Concentration avancée' },
                    { id: '1 heure', icon: '🧠', label: '1 heure / jour', sub: 'Immergé dans les chapitres' },
                    { id: 'Plus d\'une heure', icon: '🏆', label: 'Plus d\'une heure', sub: 'Mode marathon intensif' }
                  ].map((timeOption) => (
                    <button
                      key={timeOption.id}
                      onClick={() => {
                        playClickSound();
                        setDailyStudyTime(timeOption.id);
                      }}
                      className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all duration-200 hover:shadow-xs cursor-pointer ${
                        dailyStudyTime === timeOption.id
                          ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{timeOption.icon}</span>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-800 text-sm">{timeOption.label}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{timeOption.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 7: PREFERENCES */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-2 bg-violet-50 text-violet-600 rounded-xl inline-flex mb-2">
                    <Settings className="w-6 h-6" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vos Préférences</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Configurez votre espace Studora à votre convenance.
                  </p>
                </div>

                <div className="space-y-5 mt-8 max-w-md mx-auto text-left">
                  {/* Pref 1: Sounds */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg text-slate-600 shadow-2xs">
                        {soundEnabledState ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Activer les sons</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">Micro-sons de succès et retours haptiques</p>
                      </div>
                    </div>
                    <div className="flex space-x-1.5 bg-slate-200/50 p-1 rounded-lg">
                      <button
                        onClick={() => {
                          playClickSound();
                          setSoundEnabledState(true);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          soundEnabledState ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-600'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => {
                          setSoundEnabledState(false);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          !soundEnabledState ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  </div>

                  {/* Pref 2: Reminders */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg text-slate-600 shadow-2xs">
                        {notificationsEnabledState ? <Bell className="w-5 h-5 text-emerald-600" /> : <BellOff className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Recevoir des rappels</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">Conseils d'IA et notifications d'études</p>
                      </div>
                    </div>
                    <div className="flex space-x-1.5 bg-slate-200/50 p-1 rounded-lg">
                      <button
                        onClick={() => {
                          playClickSound();
                          setNotificationsEnabledState(true);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          notificationsEnabledState ? 'bg-white text-emerald-600 shadow-3xs' : 'text-slate-600'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setNotificationsEnabledState(false);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          !notificationsEnabledState ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  </div>

                  {/* Pref 3: Dark Mode */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg text-slate-600 shadow-2xs">
                        {darkModeState ? <Moon className="w-5 h-5 text-violet-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Mode sombre automatique</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">S'adapter selon l'heure de votre système</p>
                      </div>
                    </div>
                    <div className="flex space-x-1.5 bg-slate-200/50 p-1 rounded-lg">
                      <button
                        onClick={() => {
                          playClickSound();
                          setDarkModeState(true);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          darkModeState ? 'bg-white text-violet-600 shadow-3xs' : 'text-slate-600'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setDarkModeState(false);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          !darkModeState ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-600'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 8: SUMMARY & FINISH */}
            {step === 8 && (
              <motion.div
                key="step8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <span className="p-3 bg-blue-100 text-blue-600 rounded-full inline-flex mb-2">
                    <CheckCircle className="w-8 h-8 animate-bounce" />
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Résumé de votre profil</h1>
                  <p className="text-slate-500 text-sm">
                    Tout est prêt ! Vérifiez vos informations avant de lancer votre espace Studora.
                  </p>
                </div>

                {/* Dashboard-style review panel */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8 text-left space-y-4 max-w-lg mx-auto">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Étudiant</span>
                      <span className="font-bold text-slate-800 text-base">
                        {currentUser?.firstname ? `${currentUser.firstname} ${currentUser.lastname || ''}` : 'Utilisateur Studora'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profil</span>
                      <span className="font-bold text-slate-800">
                        {roleLabels[role] || role || 'Non renseigné'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Niveau d'études</span>
                      <span className="font-bold text-slate-800">{level || 'Non renseigné'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Établissement</span>
                      <span className="font-bold text-slate-800 line-clamp-1">{school || 'Non renseigné'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ville</span>
                      <span className="font-bold text-slate-800">{city || 'Non renseigné'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Objectif principal</span>
                      <span className="font-bold text-slate-800">{goal || 'Non renseigné'}</span>
                    </div>

                    <div className="col-span-2 border-t border-slate-200/50 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Révisions : <strong className="text-slate-700">{dailyStudyTime} / jour</strong></span>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px]">
                        <span className={soundEnabledState ? 'text-blue-600' : 'text-slate-300'}>🔊 Sons</span>
                        <span className={notificationsEnabledState ? 'text-emerald-600' : 'text-slate-300'}>🔔 Rappels</span>
                        <span className={darkModeState ? 'text-violet-600' : 'text-slate-300'}>🌙 Dark</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. Action Buttons Section */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
            {/* Back button */}
            {step > 1 ? (
              <button
                id="btn-onboarding-back"
                onClick={handleBack}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>
            ) : (
              <div /> // Placeholder to align next buttons properly
            )}

            {/* Skip / Next buttons */}
            <div className="flex items-center space-x-3">
              {/* Skip button (only for steps before step 8) */}
              {step < totalSteps && (
                <button
                  id="btn-onboarding-skip"
                  onClick={handleSkip}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Ignorer cette étape
                </button>
              )}

              {/* Next/Finish button */}
              {step < totalSteps ? (
                <button
                  id="btn-onboarding-next"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center space-x-2 shadow-xs hover:shadow-md hover:shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-onboarding-finish"
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-80 text-white text-sm font-extrabold rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/15 active:scale-95 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Terminer</span>
                      <CheckCircle className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
