/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  Layers,
  BarChart3,
  Trophy,
  Archive,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Plus,
  UploadCloud,
  CheckCircle2,
  X,
  Flame,
  Clock,
  Sparkles,
  Trash2,
  BookOpen,
  Award,
  AlertCircle,
  Calendar,
  ChevronDown,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Bookmark,
  Share2,
  Search,
  CheckSquare,
  GraduationCap
} from 'lucide-react';
import { authService, dbService, DocumentRow, QuizRow, FlashcardRow, ProgressRow, UserProfile } from '../lib/supabase';
import { playClickSound, playSuccessSound, playFailureSound, setSoundEnabled } from '../utils/audio';
import { toast } from '../utils/toast';

interface StudentDashboardProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const CONSEILS_DU_JOUR = [
  "Révisez un peu chaque jour plutôt que plusieurs heures d'un seul coup. La régularité est la clé de la mémoire !",
  "Utilisez la technique Pomodoro : 25 minutes de concentration intense, puis 5 minutes de pause active.",
  "Testez-vous activement (Active Recall) avec des quiz plutôt que de simplement relire passivement vos fiches.",
  "Expliquez un concept complexe à voix haute ou à un proche pour valider que vous l'avez réellement compris.",
  "La répétition espacée permet de réviser pile au moment où votre cerveau s'apprête à oublier l'information.",
  "Dormez au moins 7 à 8h ! C'est durant le sommeil paradoxal que votre cerveau consolide les révisions du jour."
];

export default function StudentDashboard({ userProfile: initialProfile, onLogout, onNavigate }: StudentDashboardProps) {
  // Navigation & Shell states
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // User Profile & Database states
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([]);
  const [progress, setProgress] = useState<ProgressRow | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; level: string; isCurrentUser?: boolean }[]>([]);
  const [archivedDocs, setArchivedDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stats Counters state with animated progress
  const [displayDocsCount, setDisplayDocsCount] = useState(0);
  const [displayQuizzesCount, setDisplayQuizzesCount] = useState(0);
  const [displayScoreAvg, setDisplayScoreAvg] = useState(0);
  const [displayHours, setDisplayHours] = useState(0);

  // File upload state machine
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'importing' | 'analyzing' | 'done'>('idle');
  const [uploadingFileName, setUploadingFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tip carousel
  const [tipIndex, setTipIndex] = useState(0);

  // Goal objective checkbox state
  const [goalCompleted, setGoalCompleted] = useState(false);

  // Active quiz playing states
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRow | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [quizScoreCounter, setQuizScoreCounter] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Active Flashcards states
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // Search filter inside Mes Documents view
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'ready' | 'analyzing' | 'analyzed'>('all');

  // Form states inside Settings view
  const [formData, setFormData] = useState({
    firstname: initialProfile.firstname || '',
    lastname: initialProfile.lastname || '',
    school: initialProfile.school || '',
    city: initialProfile.city || '',
    level: initialProfile.level || '',
    goal: initialProfile.goal || '',
    daily_study_time: initialProfile.daily_study_time || '',
    sound_enabled: initialProfile.sound_enabled ?? true,
    notifications_enabled: initialProfile.notifications_enabled ?? true,
  });

  // Sound and Notifications
  const [soundEnabled, setSoundState] = useState(initialProfile.sound_enabled ?? true);
  const [notificationsEnabled, setNotificationState] = useState(initialProfile.notifications_enabled ?? true);

  // Fetch all database records upon initialization
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const docsData = await dbService.getDocuments(initialProfile.id);
        const archivedData = await dbService.getArchivedDocuments(initialProfile.id);
        const quizData = await dbService.getQuizzes(initialProfile.id);
        const fcData = await dbService.getFlashcards(initialProfile.id);
        const progressData = await dbService.getProgress(initialProfile.id);
        const leaderboardData = await dbService.getLeaderboard();

        setDocuments(docsData);
        setArchivedDocs(archivedData);
        setQuizzes(quizData);
        setFlashcards(fcData);
        setProgress(progressData);
        setLeaderboard(leaderboardData);

        // Initialize Settings form
        setFormData({
          firstname: initialProfile.firstname || '',
          lastname: initialProfile.lastname || '',
          school: initialProfile.school || '',
          city: initialProfile.city || '',
          level: initialProfile.level || '',
          goal: initialProfile.goal || '',
          daily_study_time: initialProfile.daily_study_time || '',
          sound_enabled: initialProfile.sound_enabled ?? true,
          notifications_enabled: initialProfile.notifications_enabled ?? true,
        });

        // Trigger Stats Counter increment anims
        animateStats(docsData.length, quizData.length, getAverageScore(quizData), progressData.hours_studied);

      } catch (err) {
        console.error('Error loading dashboard datasets:', err);
        toast.show('Erreur lors du chargement des données. Veuillez réessayer.', 'warning');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialProfile.id]);

  // Rotator for advice cards
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % CONSEILS_DU_JOUR.length);
    }, 15000); // Changes every 15 seconds
    return () => clearInterval(timer);
  }, []);

  const rotateTip = () => {
    playClickSound();
    setTipIndex((prev) => (prev + 1) % CONSEILS_DU_JOUR.length);
  };

  // Sound Toggle Synchronizer
  const handleToggleSound = async (val: boolean) => {
    setSoundState(val);
    setSoundEnabled(val);
    setFormData((prev) => ({ ...prev, sound_enabled: val }));
    if (val) playClickSound();

    try {
      const updated = await authService.updateProfile(userProfile.id, {
        sound_enabled: val
      });
      setUserProfile(updated);
      toast.show(val ? 'Effets sonores activés ! 🔊' : 'Effets sonores coupés. 🔇', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationState(val);
    setFormData((prev) => ({ ...prev, notifications_enabled: val }));
    playClickSound();

    try {
      const updated = await authService.updateProfile(userProfile.id, {
        notifications_enabled: val
      });
      setUserProfile(updated);
      toast.show(val ? 'Notifications activées ! 🔔' : 'Notifications désactivées. 🔕', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Calculates Average Score of completed quizzes
  const getAverageScore = (quizList: QuizRow[]) => {
    const completed = quizList.filter(q => q.completed && q.score !== null);
    if (completed.length === 0) return 80; // default initial score display
    const totalPct = completed.reduce((acc, q) => acc + ((q.score || 0) / q.max_score) * 100, 0);
    return Math.round(totalPct / completed.length);
  };

  // Sequential stats animation
  const animateStats = (docsC: number, quizC: number, scoreA: number, hours: number) => {
    // Documents
    let currentD = 0;
    const intervalD = setInterval(() => {
      if (currentD >= docsC) {
        setDisplayDocsCount(docsC);
        clearInterval(intervalD);
      } else {
        currentD++;
        setDisplayDocsCount(currentD);
      }
    }, 40);

    // Quizzes
    let currentQ = 0;
    const intervalQ = setInterval(() => {
      if (currentQ >= quizC) {
        setDisplayQuizzesCount(quizC);
        clearInterval(intervalQ);
      } else {
        currentQ++;
        setDisplayQuizzesCount(currentQ);
      }
    }, 40);

    // Score
    let currentS = 0;
    const intervalS = setInterval(() => {
      if (currentS >= scoreA) {
        setDisplayScoreAvg(scoreA);
        clearInterval(intervalS);
      } else {
        currentS += Math.ceil(scoreA / 20);
        if (currentS >= scoreA) {
          setDisplayScoreAvg(scoreA);
          clearInterval(intervalS);
        } else {
          setDisplayScoreAvg(currentS);
        }
      }
    }, 20);

    // Hours
    let currentH = 0;
    const intervalH = setInterval(() => {
      if (currentH >= hours) {
        setDisplayHours(hours);
        clearInterval(intervalH);
      } else {
        currentH += 0.5;
        if (currentH >= hours) {
          setDisplayHours(hours);
          clearInterval(intervalH);
        } else {
          setDisplayHours(currentH);
        }
      }
    }, 30);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processUploadedFile(file);
    }
  };

  const triggerFileSelect = () => {
    playClickSound();
    fileInputRef.current?.click();
  };

  // Process and analyze PDF file using real Gemini API secure backend
  const processUploadedFile = async (file: File) => {
    if (uploadState !== 'idle') return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      playFailureSound();
      toast.show('Seuls les fichiers PDF contenant du texte sont acceptés pour le moment.', 'warning');
      return;
    }

    // Limit check (5 MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      playFailureSound();
      toast.show('Limite dépassée : Le fichier ne doit pas excéder 5 Mo.', 'warning');
      return;
    }

    setUploadingFileName(file.name);
    setUploadState('importing');
    setUploadProgress(0);
    playClickSound();

    // 1. Progress upload simulation
    let currentProgress = 0;
    const uploadInterval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        clearInterval(uploadInterval);
        setUploadProgress(100);
        
        // Move to analysis stage
        setTimeout(() => {
          setUploadState('analyzing');
          analyzeDocument(file);
        }, 800);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 100);
  };

  // Real AI analysis parsing via Express server-side endpoint calling Gemini API
  const analyzeDocument = async (file: File) => {
    try {
      // Read file content as base64
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
      });

      const pdfBase64 = await base64Promise;

      // Call our secure backend endpoint
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBase64,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Échec de la communication avec le serveur d'analyse.");
      }

      const parsedData = await response.json();

      // Create actual document row
      const newDoc = await dbService.uploadDocument(
        userProfile.id,
        file.name,
        (file.size / (1024 * 1024)).toFixed(1) + ' Mo',
        'PDF'
      );
      await dbService.updateDocumentStatus(newDoc.id, 'analyzed');

      // Create Quiz from Gemini data
      const quizQuestions = parsedData.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || "Explication générée par l'IA.",
      }));

      const quizTitle = parsedData.quizTitle || `Quiz : ${file.name.replace('.pdf', '')}`;
      await dbService.createQuiz(userProfile.id, quizTitle, quizQuestions, newDoc.id);

      // Create Flashcards from Gemini data
      if (Array.isArray(parsedData.flashcards)) {
        for (const fc of parsedData.flashcards) {
          await dbService.createFlashcard(userProfile.id, fc.front, fc.back, newDoc.id);
        }
      }

      // Update local state datasets
      const freshDocs = await dbService.getDocuments(userProfile.id);
      const freshQuizzes = await dbService.getQuizzes(userProfile.id);
      const freshFcs = await dbService.getFlashcards(userProfile.id);
      
      // Add XP reward (+30 XP)
      if (progress) {
        const updatedProgress = await dbService.updateProgress(userProfile.id, {
          xp: progress.xp + 30,
          daily_goal_pct: Math.min(progress.daily_goal_pct + 25, 100)
        });
        setProgress(updatedProgress);
      }

      setDocuments(freshDocs);
      setQuizzes(freshQuizzes);
      setFlashcards(freshFcs);

      // Update stats
      animateStats(freshDocs.length, freshQuizzes.length, getAverageScore(freshQuizzes), progress?.hours_studied || 4.5);

      setUploadState('done');
      playSuccessSound();
      toast.show(`"${file.name}" analysé avec succès ! +30 XP débloqués. ✨`, 'success');

      // Reset state after showing complete
      setTimeout(() => {
        setUploadState('idle');
        setUploadProgress(null);
        setUploadingFileName('');
      }, 2000);

    } catch (err: any) {
      console.error('Error during document analysis:', err);
      setUploadState('idle');
      playFailureSound();
      toast.show(err.message || 'Échec de la numérisation du document.', 'warning');
    }
  };

  // Deletes document from local state & dbService
  const handleDeleteDoc = async (id: string, name: string) => {
    playClickSound();
    try {
      await dbService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.show(`Document "${name}" supprimé.`, 'info');
    } catch (e) {
      console.error(e);
      toast.show('Impossible de supprimer le document.', 'warning');
    }
  };

  // Archives document
  const handleArchiveDoc = async (id: string, name: string) => {
    playClickSound();
    try {
      await dbService.archiveDocument(id, true);
      const freshDocs = await dbService.getDocuments(userProfile.id);
      const freshArchives = await dbService.getArchivedDocuments(userProfile.id);
      setDocuments(freshDocs);
      setArchivedDocs(freshArchives);
      toast.show(`"${name}" déplacé dans les archives.`, 'success');
    } catch (e) {
      console.error(e);
      toast.show("Erreur d'archivage.", 'warning');
    }
  };

  const handleRestoreDoc = async (id: string, name: string) => {
    playClickSound();
    try {
      await dbService.archiveDocument(id, false);
      const freshDocs = await dbService.getDocuments(userProfile.id);
      const freshArchives = await dbService.getArchivedDocuments(userProfile.id);
      setDocuments(freshDocs);
      setArchivedDocs(freshArchives);
      toast.show(`"${name}" restauré avec succès !`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Quick Actions routing
  const triggerQuickAction = (action: string) => {
    playClickSound();
    if (action === 'import') {
      setActiveView('dashboard');
      setTimeout(() => {
        const importEl = document.getElementById('import-section-card');
        importEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (action === 'quiz') {
      setActiveView('quiz');
    } else if (action === 'flashcards') {
      setActiveView('flashcards');
    } else if (action === 'progression') {
      setActiveView('progression');
    }
  };

  // Navigation controller with audio feedback
  const navigateToTab = (tabName: string) => {
    playClickSound();
    setActiveView(tabName);
    setMobileMenuOpen(false);
  };

  // Handles Quiz Play
  const startQuizPlay = (quiz: QuizRow) => {
    playClickSound();
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setQuizScoreCounter(0);
    setQuizFinished(false);
  };

  const submitAnswer = (ansIdx: number) => {
    if (selectedAnswerIndex !== null || !selectedQuiz) return;
    setSelectedAnswerIndex(ansIdx);
    
    const correctIdx = selectedQuiz.questions[currentQuestionIndex].correct;
    if (ansIdx === correctIdx) {
      setQuizScoreCounter((prev) => prev + 1);
      playSuccessSound();
    } else {
      playFailureSound();
    }
  };

  const handleNextQuizQuestion = () => {
    if (!selectedQuiz) return;
    playClickSound();
    setSelectedAnswerIndex(null);
    
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishQuizPlay();
    }
  };

  const finishQuizPlay = async () => {
    if (!selectedQuiz || !progress) return;
    setQuizFinished(true);

    try {
      // Save score
      await dbService.submitQuizScore(selectedQuiz.id, quizScoreCounter);
      
      // Award XP (+100 XP if perfect, +50 XP otherwise)
      const earnedXP = quizScoreCounter === selectedQuiz.max_score ? 100 : 50;
      const updatedProgress = await dbService.updateProgress(userProfile.id, {
        xp: progress.xp + earnedXP,
        daily_goal_pct: 100 // achieve daily goal
      });
      setProgress(updatedProgress);

      // Refresh quiz dataset
      const freshQuizzes = await dbService.getQuizzes(userProfile.id);
      setQuizzes(freshQuizzes);

      // Refresh stats
      animateStats(documents.length, freshQuizzes.length, getAverageScore(freshQuizzes), updatedProgress.hours_studied);

      playSuccessSound();
      toast.show(`Quiz terminé ! +${earnedXP} XP récoltés ! 🏆`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // Flashcards Swipe Simulation
  const handleFlashcardFeedback = (feedback: 'easy' | 'medium' | 'hard') => {
    playClickSound();
    setFcFlipped(false);
    
    let xpGain = 5;
    if (feedback === 'easy') xpGain = 15;
    if (feedback === 'medium') xpGain = 10;

    // Save progression
    if (progress) {
      dbService.updateProgress(userProfile.id, {
        xp: progress.xp + xpGain
      }).then(updated => setProgress(updated));
    }

    toast.show(`Ancrage mémoriel mis à jour ! +${xpGain} XP`, 'success');

    setTimeout(() => {
      if (flashcards.length > 0) {
        setFcIndex((prev) => (prev + 1) % flashcards.length);
      }
    }, 200);
  };

  // Settings Save action
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    try {
      const updated = await authService.updateProfile(userProfile.id, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        school: formData.school,
        city: formData.city,
        level: formData.level,
        goal: formData.goal,
        daily_study_time: formData.daily_study_time,
      });
      setUserProfile(updated);
      toast.show('Vos paramètres ont été mis à jour avec succès ! ✨', 'success');
    } catch (err) {
      console.error(err);
      playFailureSound();
      toast.show('Erreur lors de la sauvegarde.', 'warning');
    }
  };

  // Redirection / Logout triggered elegantly
  const triggerLogout = () => {
    playFailureSound();
    onLogout();
  };

  // Filtered documents list helper
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = docFilter === 'all' || doc.status === docFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] relative overflow-hidden font-sans selection:bg-blue-600/10 select-none">
      {/* Dynamic light gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_10%,rgba(37,99,235,0.02),transparent_40%)] pointer-events-none" />

      {/* SIDEBAR FIXED (DESKTOP) & MOBILE DRAWER */}
      <aside
        id="studora-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-slate-200/20
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo container */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-50">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Studora
                </span>
              )}
            </div>

            {/* Desktop reduction toggle arrow */}
            <button
              onClick={() => { playClickSound(); setSidebarCollapsed(!sidebarCollapsed); }}
              className="hidden md:flex w-7 h-7 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            
            {/* Mobile close menu trigger */}
            <button
              onClick={() => { playClickSound(); setMobileMenuOpen(false); }}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Compact User profile state widget */}
          <div className="p-4 border-b border-slate-50 text-left bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                {userProfile.firstname ? userProfile.firstname[0].toUpperCase() : 'S'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {userProfile.firstname} {userProfile.lastname}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Plan Bêta</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nav list menu */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
              { id: 'documents', label: 'Mes documents', icon: FileText, badge: documents.length > 0 ? documents.length : undefined },
              { id: 'quiz', label: 'Quiz', icon: HelpCircle, badge: quizzes.length > 0 ? quizzes.length : undefined },
              { id: 'flashcards', label: 'Flashcards', icon: Layers, badge: flashcards.length > 0 ? flashcards.length : undefined },
              { id: 'progression', label: 'Progression', icon: BarChart3 },
              { id: 'leaderboard', label: 'Classement', icon: Trophy },
              { id: 'archives', label: 'Archives', icon: Archive, badge: archivedDocs.length > 0 ? archivedDocs.length : undefined },
              { id: 'settings', label: 'Paramètres', icon: Settings },
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-semibold text-sm cursor-pointer group
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                  aria-label={item.label}
                >
                  <div className="flex items-center space-x-3">
                    <IconComp className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Disconnect) */}
        <div className="p-4 border-t border-slate-50 shrink-0">
          <button
            onClick={triggerLogout}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 hover:text-red-600 text-slate-500 transition-all font-semibold text-sm cursor-pointer`}
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER BLACKOUT OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* MAIN VIEW CONTENT SHELL */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* PREMIUM FIXED TOP HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-50 flex items-center justify-between px-6 sticky top-0 z-20">
          
          {/* Hamburger trigger (mobile) & Title greetings */}
          <div className="flex items-center space-x-4 text-left">
            <button
              onClick={() => { playClickSound(); setMobileMenuOpen(true); }}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 border border-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="leading-none">
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Bonjour, {userProfile.firstname || 'Bêta-testeur'}</span>
                <span className="text-xl">👋</span>
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Prêt pour une nouvelle session de révision ?
              </p>
            </div>
          </div>

          {/* Right Header Controls (Notifications, Quick add, Profile avatar) */}
          <div className="flex items-center space-x-4 relative">
            
            {/* XP Level indicator pill */}
            <div className="hidden lg:flex items-center space-x-2 bg-blue-50/60 border border-blue-100/50 px-3 py-1.5 rounded-xl">
              <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
                {progress?.xp || 420} XP
              </span>
            </div>

            {/* Quick Upload Action */}
            <button
              onClick={() => triggerQuickAction('import')}
              className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 font-bold text-xs cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Importer</span>
            </button>

            {/* Notification triggers */}
            <div className="relative">
              <button
                onClick={() => { playClickSound(); setShowNotifications(!showNotifications); }}
                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/80 transition-all border border-slate-200/40 relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-bounce" />
              </button>

              {/* Notification Popover Box */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-4 text-left z-50"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Notifications</h4>
                        <span className="text-[10px] text-blue-600 font-black cursor-pointer">Tout marquer lu</span>
                      </div>
                      <div className="space-y-3 py-3 max-h-60 overflow-y-auto">
                        <div className="flex space-x-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <span className="text-lg">🎉</span>
                          <div className="text-xs">
                            <p className="font-extrabold text-slate-800">Bienvenue sur Studora !</p>
                            <p className="text-slate-400 mt-0.5">Votre espace d'apprentissage intelligent est actif.</p>
                          </div>
                        </div>
                        <div className="flex space-x-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <span className="text-lg">📚</span>
                          <div className="text-xs">
                            <p className="font-extrabold text-slate-800">Prêt pour le quiz hebdomadaire ?</p>
                            <p className="text-slate-400 mt-0.5">Gagnez +100 XP en complétant un quiz parfait.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Triggering Settings */}
            <button
              onClick={() => navigateToTab('settings')}
              className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-700 shadow-sm hover:scale-105 hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
            >
              {userProfile.firstname ? userProfile.firstname[0].toUpperCase() : 'S'}
            </button>
          </div>
        </header>

        {/* VIEW BODY SCROLLABLE CONTAINER */}
        <main className="flex-1 p-6 md:p-8 space-y-8 relative overflow-y-auto max-w-7xl mx-auto w-full">
          
          <AnimatePresence mode="wait">
            {loading ? (
              <div key="loading-state" className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-400">Synchronisation des bases de données Studora...</p>
              </div>
            ) : (
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                
                {/* 1. TABLEAU DE BORD (MAIN VIEW) */}
                {activeView === 'dashboard' && (
                  <div className="space-y-8">
                    
                    {/* STATS SECTION */}
                    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { title: 'Documents analysés', value: displayDocsCount, suffix: '', icon: FileText, color: 'text-blue-600 bg-blue-50' },
                        { title: 'Quiz réalisés', value: displayQuizzesCount, suffix: '', icon: HelpCircle, color: 'text-emerald-600 bg-emerald-50' },
                        { title: 'Score moyen', value: displayScoreAvg, suffix: '%', icon: Award, color: 'text-amber-600 bg-amber-50' },
                        { title: 'Temps de révision', value: displayHours, suffix: ' h', icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -4 }}
                          className="bg-white p-5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex items-center space-x-4 text-left transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-200/30"
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                            <stat.icon className="w-5.5 h-5.5" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-1">
                              {stat.title}
                            </span>
                            <span className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none">
                              {stat.value}{stat.suffix}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </section>

                    {/* UPPER MIDDLE CONTAINER: ACTIONS, TARGET, ADVICE & ACTIVITY */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* BENTO QUICK ACTIONS */}
                      <div className="bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 space-y-4 text-left flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                            <Zap className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                            <span>Actions Rapides</span>
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Optimisez votre temps de révision en un clic.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {[
                            { label: 'Importer', desc: 'un document', action: 'import', icon: Plus, bg: 'hover:border-blue-200 hover:bg-blue-50/20' },
                            { label: 'Créer', desc: 'un quiz', action: 'quiz', icon: HelpCircle, bg: 'hover:border-emerald-200 hover:bg-emerald-50/20' },
                            { label: 'Flashcards', desc: 'réviser fiches', action: 'flashcards', icon: Layers, bg: 'hover:border-amber-200 hover:bg-amber-50/20' },
                            { label: 'Progression', desc: 'voir stats', action: 'progression', icon: BarChart3, bg: 'hover:border-indigo-200 hover:bg-indigo-50/20' },
                          ].map((act, i) => (
                            <button
                              key={i}
                              onClick={() => triggerQuickAction(act.action)}
                              className={`p-3 border border-slate-100 rounded-xl text-left transition-all hover:shadow-xs cursor-pointer ${act.bg} active:scale-95`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                                <act.icon className="w-4 h-4 text-slate-600" />
                              </div>
                              <h4 className="text-xs font-black text-slate-800 leading-none">{act.label}</h4>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">{act.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* BENTO DAILY TARGET */}
                      <div className="bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex flex-col justify-between text-left">
                        <div className="space-y-4">
                          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                            <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
                            <span>Objectif du Jour</span>
                          </h3>
                          
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-left">
                              <button
                                onClick={() => {
                                  playClickSound();
                                  setGoalCompleted(!goalCompleted);
                                  if (!goalCompleted) {
                                    playSuccessSound();
                                    toast.show('Objectif accompli ! +50 XP récoltés ! ✨', 'success');
                                    if (progress) {
                                      dbService.updateProgress(userProfile.id, { xp: progress.xp + 50 }).then(p => setProgress(p));
                                    }
                                  }
                                }}
                                className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer
                                  ${goalCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-blue-500'}
                                `}
                              >
                                {goalCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                              </button>
                              <div>
                                <h4 className={`text-xs font-black transition-all ${goalCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  Faire un quiz aujourd'hui
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Quotidien • +50 XP</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide text-slate-400">
                            <span>Progression quotidienne</span>
                            <span>{goalCompleted ? '100%' : '0%'}</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                            <motion.div
                              className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: goalCompleted ? '100%' : '0%' }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* BENTO ADVICE OF THE DAY */}
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[20px] shadow-lg shadow-blue-500/10 text-white flex flex-col justify-between text-left min-h-[200px]">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 bg-white/20 text-white text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                              Conseil du jour
                            </span>
                            <button
                              onClick={rotateTip}
                              className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all cursor-pointer"
                              title="Autre conseil"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <motion.p
                            key={tipIndex}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs md:text-sm text-blue-100 leading-relaxed font-semibold"
                          >
                            « {CONSEILS_DU_JOUR[tipIndex]} »
                          </motion.p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-blue-200">
                          <span>Studora IA Co-pilot</span>
                          <span>Suivant automatique</span>
                        </div>
                      </div>

                    </div>

                    {/* UPPER BOTTOM CONTAINER: IMPORT RAPIDE & DOCUMENTS RECENTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* SECTION IMPORT RAPIDE */}
                      <div id="import-section-card" className="lg:col-span-1 bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 text-left flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                            <UploadCloud className="w-5 h-5 text-blue-600" />
                            <span>Importer un document</span>
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Uploadez votre cours PDF pour l'analyser en secondes.
                          </p>
                        </div>

                        {/* Interactive drag-and-drop box */}
                        <div className="my-4">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".pdf"
                            className="hidden"
                          />

                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerFileSelect}
                            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer
                              ${isDragging 
                                ? 'border-blue-500 bg-blue-50/40' 
                                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
                              }
                              ${uploadState !== 'idle' ? 'pointer-events-none' : ''}
                            `}
                          >
                            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                              <UploadCloud className="w-6 h-6 text-blue-600 animate-pulse" />
                            </div>
                            
                            <p className="text-xs font-extrabold text-slate-700 text-center">
                              Déposez votre fichier ici ou cliquez pour choisir
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 text-center">
                              Formats acceptés : PDF contenant du texte
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 justify-center">
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">
                                Max 20 pages
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">
                                Max 5 Mo
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status logs and Upload Progress bar */}
                        <div>
                          {uploadState !== 'idle' && (
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                                  {uploadState === 'importing' && 'Importation en cours...'}
                                  {uploadState === 'analyzing' && 'Analyse IA en cours...'}
                                  {uploadState === 'done' && 'Analyse terminée ! ✔'}
                                </span>
                                {uploadProgress !== null && (
                                  <span className="text-[10px] font-black text-slate-600">{uploadProgress}%</span>
                                )}
                              </div>

                              {uploadProgress !== null && (
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              )}

                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping shrink-0" />
                                <span className="truncate">{uploadingFileName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SECTION DOCUMENTS RECENTS */}
                      <div className="lg:col-span-2 bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 text-left flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <span>Documents Récents</span>
                            </h3>
                            <button
                              onClick={() => navigateToTab('documents')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-extrabold cursor-pointer"
                            >
                              Voir tout
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Vos derniers cours numérisés et prêts à réviser.
                          </p>
                        </div>

                        {/* Recent files listing */}
                        <div className="my-4 divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                          {documents.length === 0 ? (
                            <div className="text-center py-10 space-y-2">
                              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                              <p className="text-xs font-semibold text-slate-400">Aucun document pour le moment.</p>
                            </div>
                          ) : (
                            documents.slice(0, 3).map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between py-3">
                                <div className="flex items-center space-x-3 text-left min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                                    <FileText className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-extrabold text-slate-800 truncate max-w-[150px] sm:max-w-[300px]">
                                      {doc.name}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-[9px] text-slate-400 font-bold">
                                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                      <span className="text-[9px] text-slate-300">•</span>
                                      <span className="text-[9px] text-slate-400 font-bold">{doc.size}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  {/* Status indicator */}
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mr-2
                                    ${doc.status === 'analyzed' ? 'bg-emerald-50 text-emerald-600' : ''}
                                    ${doc.status === 'analyzing' ? 'bg-amber-50 text-amber-600 animate-pulse' : ''}
                                    ${doc.status === 'ready' ? 'bg-blue-50 text-blue-600' : ''}
                                    ${doc.status === 'error' ? 'bg-red-50 text-red-600' : ''}
                                  `}>
                                    {doc.status === 'analyzed' && 'Analysé'}
                                    {doc.status === 'analyzing' && 'En cours'}
                                    {doc.status === 'ready' && 'Importé'}
                                    {doc.status === 'error' && 'Erreur'}
                                  </span>

                                  {/* Quick Open actions */}
                                  <button
                                    onClick={() => {
                                      // Switch to Quiz view if quizzes exist for this doc
                                      const associatedQuiz = quizzes.find(q => q.document_id === doc.id);
                                      if (associatedQuiz) {
                                        startQuizPlay(associatedQuiz);
                                        setActiveView('quiz');
                                      } else {
                                        setActiveView('quiz');
                                      }
                                    }}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 font-black text-[11px] px-2.5 transition-all cursor-pointer"
                                  >
                                    Ouvrir
                                  </button>

                                  <button
                                    onClick={() => handleDeleteDoc(doc.id, doc.name)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Extra informational footer line */}
                        <div className="pt-2 border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-blue-500 mr-1.5 shrink-0" />
                          <span>Cliquez sur "Ouvrir" pour générer directement des fiches mémoires et quiz intelligents.</span>
                        </div>
                      </div>

                    </div>

                    {/* LOWEST CONTAINER: CLASSEMENT BENTO, DERNIERE ACTIVITE */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* SECTION CLASSEMENT MINI */}
                      <div className="bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 flex flex-col justify-between text-left">
                        <div>
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                              <Trophy className="w-4.5 h-4.5 text-blue-600" />
                              <span>Classement Général</span>
                            </h3>
                            <button
                              onClick={() => navigateToTab('leaderboard')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-extrabold cursor-pointer"
                            >
                              Voir tout
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Votre position actuelle : <strong className="text-blue-600">#9</strong> sur la promo.
                          </p>
                        </div>

                        {/* Mini Top 3 List */}
                        <div className="my-4 divide-y divide-slate-50">
                          {leaderboard.slice(0, 3).map((student, i) => (
                            <div key={i} className="flex items-center justify-between py-2 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">
                                  {i === 0 && '🥇'}
                                  {i === 1 && '🥈'}
                                  {i === 2 && '🥉'}
                                </span>
                                <div>
                                  <p className="font-extrabold text-slate-800">{student.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{student.level}</p>
                                </div>
                              </div>
                              <span className="font-black text-slate-700">{student.score} XP</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => navigateToTab('leaderboard')}
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 rounded-xl text-xs font-black transition-all cursor-pointer text-center"
                        >
                          Voir le classement complet
                        </button>
                      </div>

                      {/* SECTION DERNIERE ACTIVITE */}
                      <div className="lg:col-span-2 bg-white p-6 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100 text-left flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                            <Clock className="w-4.5 h-4.5 text-blue-600" />
                            <span>Dernière Activité</span>
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            Historique en temps réel de vos révisions.
                          </p>
                        </div>

                        {/* High fidelity logs of last actions */}
                        <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Dernier document analysé</span>
                            <span className="block text-xs font-extrabold text-slate-800 truncate">
                              {documents[0]?.name || 'Biologie_Cellulaire_L1.pdf'}
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-black">✔ Terminé</span>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Dernier quiz</span>
                            <span className="block text-xs font-extrabold text-slate-800 truncate">
                              {quizzes[0]?.title || 'Méthodes Actives de Révisions'}
                            </span>
                            <span className="block text-[10px] text-blue-600 font-bold">Score : {quizzes[0]?.score ?? 3} / {quizzes[0]?.max_score ?? 3}</span>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Dernier score global</span>
                            <span className="block text-xs font-extrabold text-slate-800">
                              {getAverageScore(quizzes)}% de réussite
                            </span>
                            <span className="block text-[10px] text-slate-400 font-bold">Sur l'ensemble des quiz</span>
                          </div>

                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Dernière connexion</span>
                            <span className="block text-xs font-extrabold text-slate-800">
                              Aujourd'hui, {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-bold">Paris, France</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 font-bold text-center">
                          Données synchronisées en temps réel avec le stockage local chiffré Studora.
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* 2. MES DOCUMENTS SUB-VIEW */}
                {activeView === 'documents' && (
                  <div className="space-y-6 text-left">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Mes Documents</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Consultez, recherchez et gérez vos documents importés.</p>
                    </div>

                    {/* Filter and search bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="Rechercher un document..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                        {[
                          { id: 'all', label: 'Tout' },
                          { id: 'analyzed', label: 'Analysés' },
                          { id: 'analyzing', label: 'En cours' },
                          { id: 'ready', label: 'Nouveaux' },
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => { playClickSound(); setDocFilter(filter.id as any); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors
                              ${docFilter === filter.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                              }
                            `}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Documents grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDocs.length === 0 ? (
                        <div className="col-span-full bg-white p-16 rounded-[20px] text-center space-y-4 border border-slate-100">
                          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                          <p className="font-extrabold text-slate-700">Aucun document ne correspond à vos critères.</p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">Veuillez importer un fichier PDF ou modifier vos filtres.</p>
                          <button
                            onClick={() => triggerQuickAction('import')}
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
                          >
                            <span>Déposer un fichier</span>
                          </button>
                        </div>
                      ) : (
                        filteredDocs.map((doc) => (
                          <motion.div
                            key={doc.id}
                            whileHover={{ y: -3 }}
                            className="bg-white p-5 rounded-[20px] border border-slate-100 flex flex-col justify-between shadow-xs hover:shadow-lg transition-shadow"
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full
                                  ${doc.status === 'analyzed' ? 'bg-emerald-50 text-emerald-600' : ''}
                                  ${doc.status === 'analyzing' ? 'bg-amber-50 text-amber-600 animate-pulse' : ''}
                                  ${doc.status === 'ready' ? 'bg-blue-50 text-blue-600' : ''}
                                `}>
                                  {doc.status === 'analyzed' && 'Analysé'}
                                  {doc.status === 'analyzing' && 'En cours'}
                                  {doc.status === 'ready' && 'Nouveau'}
                                </span>
                              </div>

                              <div>
                                <h3 className="font-extrabold text-sm text-slate-800 line-clamp-2" title={doc.name}>
                                  {doc.name}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">
                                  Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR')} • {doc.size}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-50">
                              <button
                                onClick={() => {
                                  const associatedQuiz = quizzes.find(q => q.document_id === doc.id);
                                  if (associatedQuiz) {
                                    startQuizPlay(associatedQuiz);
                                  }
                                  setActiveView('quiz');
                                }}
                                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-xs rounded-xl transition-colors cursor-pointer text-center"
                              >
                                Réviser
                              </button>

                              <button
                                onClick={() => handleArchiveDoc(doc.id, doc.name)}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                title="Archiver"
                              >
                                <Archive className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteDoc(doc.id, doc.name)}
                                className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. QUIZ SUB-VIEW (PLAY INTERACTIVE EXAM) */}
                {activeView === 'quiz' && (
                  <div className="space-y-6 text-left max-w-3xl mx-auto">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quiz d'Évaluation</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Sélectionnez et complétez un examen personnalisé généré par IA.</p>
                    </div>

                    {!selectedQuiz ? (
                      <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-1">
                          <h3 className="text-sm font-black text-slate-800">Quiz Disponibles</h3>
                          <p className="text-xs text-slate-400">Vos examens générés à partir de vos fichiers importés.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {quizzes.map((q) => (
                            <div key={q.id} className="bg-white p-5 rounded-[20px] border border-slate-100 flex flex-col justify-between shadow-xs">
                              <div className="space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <HelpCircle className="w-5.5 h-5.5" />
                                </div>
                                <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1">{q.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  Nombre de questions : {q.max_score} • {q.completed ? `Dernier score : ${q.score}/${q.max_score}` : 'Non commencé'}
                                </p>
                              </div>

                              <button
                                onClick={() => startQuizPlay(q)}
                                className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer text-center active:scale-95 shadow-sm"
                              >
                                {q.completed ? 'Recommencer le quiz' : 'Commencer le quiz'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 shadow-md space-y-6">
                        {/* Header of quiz play */}
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                          <div>
                            <h3 className="font-extrabold text-base text-slate-900">{selectedQuiz.title}</h3>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Question {currentQuestionIndex + 1} sur {selectedQuiz.max_score}
                            </span>
                          </div>
                          <button
                            onClick={() => { playClickSound(); setSelectedQuiz(null); }}
                            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quiz playing content */}
                        {!quizFinished ? (
                          <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 font-extrabold text-sm md:text-base">
                              {selectedQuiz.questions[currentQuestionIndex].question}
                            </div>

                            <div className="space-y-2.5">
                              {selectedQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                                const isSelected = selectedAnswerIndex === idx;
                                const isCorrect = idx === selectedQuiz.questions[currentQuestionIndex].correct;
                                const hasSubmitted = selectedAnswerIndex !== null;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => submitAnswer(idx)}
                                    disabled={hasSubmitted}
                                    className={`w-full p-4 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex justify-between items-center
                                      ${!hasSubmitted 
                                        ? 'bg-white hover:bg-slate-50 hover:border-blue-400 border-slate-100 text-slate-700' 
                                        : ''
                                      }
                                      ${hasSubmitted && isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs' : ''}
                                      ${hasSubmitted && isSelected && !isCorrect ? 'bg-red-50 border-red-500 text-red-800' : ''}
                                      ${hasSubmitted && !isSelected && !isCorrect ? 'bg-slate-50 border-slate-100 text-slate-400' : ''}
                                    `}
                                  >
                                    <span>{option}</span>
                                    {hasSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                    {hasSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-red-500 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Question Explanation Box */}
                            {selectedAnswerIndex !== null && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-blue-50/50 border border-blue-100/40 rounded-2xl text-xs font-semibold text-blue-800 space-y-1 text-left"
                              >
                                <strong className="block text-blue-900 font-black">💡 Explication de l'IA :</strong>
                                <p>{selectedQuiz.questions[currentQuestionIndex].explanation}</p>
                              </motion.div>
                            )}

                            {/* Actions bar */}
                            {selectedAnswerIndex !== null && (
                              <button
                                onClick={handleNextQuizQuestion}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer text-center active:scale-98"
                              >
                                {currentQuestionIndex < selectedQuiz.max_score - 1 ? 'Question suivante' : 'Terminer le quiz'}
                              </button>
                            )}
                          </div>
                        ) : (
                          // Finished panel
                          <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                              <Trophy className="w-10 h-10 stroke-[2.5]" />
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-black text-xl text-slate-900">Félicitations ! 🎉</h3>
                              <p className="text-xs text-slate-400 font-semibold">Examen terminé avec succès.</p>
                            </div>

                            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl max-w-xs mx-auto space-y-1">
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Votre score final</span>
                              <span className="block text-2xl font-black text-slate-800">{quizScoreCounter} / {selectedQuiz.max_score}</span>
                              <span className="block text-[10px] text-emerald-600 font-extrabold mt-1">
                                {quizScoreCounter === selectedQuiz.max_score ? 'Score parfait ! +100 XP' : 'Réussi ! +50 XP'}
                              </span>
                            </div>

                            <button
                              onClick={() => { playClickSound(); setSelectedQuiz(null); }}
                              className="w-full max-w-xs py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer text-center shadow-xs"
                            >
                              Fermer et revenir aux quiz
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. FLASHCARDS SUB-VIEW */}
                {activeView === 'flashcards' && (
                  <div className="space-y-6 text-left max-w-xl mx-auto">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Flashcards Spacées</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Réactivez votre mémoire en testant vos connaissances fiches par fiches.</p>
                    </div>

                    {flashcards.length === 0 ? (
                      <div className="bg-white p-12 rounded-[20px] text-center border border-slate-100 space-y-4">
                        <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="font-extrabold text-slate-700">Aucune flashcard disponible.</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">Veuillez d'abord importer un document ou un cours pour générer des fiches automatiques.</p>
                        <button
                          onClick={() => triggerQuickAction('import')}
                          className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl cursor-pointer"
                        >
                          Importer mon premier cours
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        
                        {/* 3D Fliping Flashcard wrapper */}
                        <div
                          onClick={() => { playClickSound(); setFcFlipped(!fcFlipped); }}
                          className="relative h-72 cursor-pointer perspective-1000 group select-none"
                        >
                          <motion.div
                            className="relative w-full h-full duration-500 preserve-3d"
                            animate={{ rotateY: fcFlipped ? 180 : 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          >
                            {/* FRONT SIDE CARD */}
                            <div className="absolute inset-0 w-full h-full bg-white border border-slate-100 rounded-[24px] shadow-md p-6 flex flex-col justify-between text-center backface-hidden">
                              <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase">
                                <span>Recto • Définition</span>
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Fiche {fcIndex + 1}/{flashcards.length}</span>
                              </div>
                              <h3 className="text-base md:text-lg font-black text-slate-800 px-4 leading-normal">
                                {flashcards[fcIndex].front}
                              </h3>
                              <span className="text-[10px] text-blue-600 font-black animate-pulse">Cliquer pour retourner la carte</span>
                            </div>

                            {/* BACK SIDE CARD */}
                            <div className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-800 rounded-[24px] shadow-xl p-6 flex flex-col justify-between text-center rotate-y-180 backface-hidden text-white">
                              <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase">
                                <span>Verso • Explication</span>
                                <span className="bg-white/10 text-white px-2 py-0.5 rounded-md">Répétition active</span>
                              </div>
                              <p className="text-xs md:text-sm text-slate-200 px-4 leading-relaxed font-semibold">
                                {flashcards[fcIndex].back}
                              </p>
                              <span className="text-[10px] text-slate-500 font-black">Cliquer pour re-consulter la question</span>
                            </div>

                          </motion.div>
                        </div>

                        {/* Interactive repetition indicator tools */}
                        <div className="bg-white p-4 rounded-[20px] border border-slate-100 flex justify-around gap-2 shadow-xs">
                          <button
                            onClick={() => handleFlashcardFeedback('hard')}
                            className="flex-1 py-3 border border-red-100 hover:bg-red-50 text-red-600 text-xs font-black rounded-xl transition-all cursor-pointer text-center"
                          >
                            🔴 Difficile (+5 XP)
                          </button>
                          <button
                            onClick={() => handleFlashcardFeedback('medium')}
                            className="flex-1 py-3 border border-amber-100 hover:bg-amber-50 text-amber-600 text-xs font-black rounded-xl transition-all cursor-pointer text-center"
                          >
                            🟡 Moyen (+10 XP)
                          </button>
                          <button
                            onClick={() => handleFlashcardFeedback('easy')}
                            className="flex-1 py-3 border border-emerald-100 hover:bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl transition-all cursor-pointer text-center"
                          >
                            🟢 Facile (+15 XP)
                          </button>
                        </div>

                        {/* Pagination indicator */}
                        <div className="flex justify-between items-center px-2 text-xs font-bold text-slate-400">
                          <span>Studora flashcard deck</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => { playClickSound(); setFcIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length); }}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span>{fcIndex + 1} / {flashcards.length}</span>
                            <button
                              onClick={() => { playClickSound(); setFcIndex((prev) => (prev + 1) % flashcards.length); }}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* 5. PROGRESSION SUB-VIEW */}
                {activeView === 'progression' && (
                  <div className="space-y-6 text-left">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Progression d'Apprentissage</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Analysez vos indicateurs d'efforts et d'heures étudiées.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Streak and Level details */}
                      <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-xs space-y-4 text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Flame className="w-5.5 h-5.5 animate-pulse" />
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-800">Série Actuelle</h3>
                          <p className="text-xs text-slate-400">
                            Vous révisez sans relâche depuis <strong className="text-slate-800">{progress?.streak || 3} jours</strong> d'affilée !
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 text-xs space-y-2 font-semibold text-slate-500">
                          <div className="flex justify-between">
                            <span>Badge actuel :</span>
                            <span className="text-slate-800 font-extrabold">Marathonien Bêta</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Niveau d'assiduité :</span>
                            <span className="text-slate-800 font-extrabold">{progress?.level || 'Étoile montante'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cumulative stats XP */}
                      <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-xs space-y-4 text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Zap className="w-5.5 h-5.5" />
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-800">Total XP accumulé</h3>
                          <p className="text-xs text-slate-400">
                            Vous possédez actuellement <strong className="text-slate-800">{progress?.xp || 420} XP</strong>. Prochain palier à 500 XP !
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                            <span>Progression Niveau</span>
                            <span>{Math.round(((progress?.xp || 420) / 500) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                            <div className="bg-blue-600 absolute top-0 bottom-0 left-0 rounded-full" style={{ width: `${Math.round(((progress?.xp || 420) / 500) * 100)}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Hour counters */}
                      <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-xs space-y-4 text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Clock className="w-5.5 h-5.5" />
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-800">Heures de concentration</h3>
                          <p className="text-xs text-slate-400">
                            Cumul de concentration totale : <strong className="text-slate-800">{progress?.hours_studied || 4.5} heures</strong>.
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 text-xs space-y-2 font-semibold text-slate-500">
                          <div className="flex justify-between">
                            <span>Objectif hebdomadaire :</span>
                            <span className="text-slate-800 font-extrabold">10 heures</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Moyenne par jour :</span>
                            <span className="text-slate-800 font-extrabold">~45 minutes</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* CUSTOM HIGH-FIDELITY RECHART METRIC (PURE SVG INTEGRATION FOR TOTAL RELIABILITY WITHOUT CRASHING IN DEPLOYMENTS) */}
                    <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-xs text-left space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Heures de Concentration Hebdomadaire</h3>
                        <p className="text-xs text-slate-400">Heures passées par jour à réviser sur Studora.</p>
                      </div>

                      {/* SVG custom bar graph */}
                      <div className="pt-6">
                        <div className="flex items-end justify-between h-44 border-b border-slate-100 px-4">
                          {[
                            { day: 'Lun', hrs: 1.5, height: 'h-16 bg-blue-500' },
                            { day: 'Mar', hrs: 0.8, height: 'h-8 bg-blue-400' },
                            { day: 'Mer', hrs: 2.1, height: 'h-24 bg-blue-600' },
                            { day: 'Jeu', hrs: 1.2, height: 'h-12 bg-blue-400' },
                            { day: 'Ven', hrs: 3.0, height: 'h-32 bg-blue-600' },
                            { day: 'Sam', hrs: 0.5, height: 'h-6 bg-slate-200' },
                            { day: 'Dim', hrs: 1.8, height: 'h-20 bg-blue-500' },
                          ].map((bar, i) => (
                            <div key={i} className="flex flex-col items-center space-y-2 w-10 sm:w-12">
                              <span className="text-[10px] font-black text-slate-600">{bar.hrs}h</span>
                              <div className={`w-6 sm:w-8 rounded-t-lg transition-all hover:scale-x-105 ${bar.height}`} />
                              <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 6. LEADERBOARD / CLASSEMENT SUB-VIEW */}
                {activeView === 'leaderboard' && (
                  <div className="space-y-6 text-left max-w-2xl mx-auto">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Classement de la Promo</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Saine émulation amicale entre étudiants de Studora Bêta.</p>
                    </div>

                    <div className="bg-white rounded-[20px] border border-slate-100 shadow-md divide-y divide-slate-100 overflow-hidden">
                      {leaderboard.map((student, idx) => {
                        const isUser = student.isCurrentUser || student.name === 'Vous' || student.name === `${userProfile.firstname} ${userProfile.lastname[0]}.`;
                        return (
                          <div
                            key={idx}
                            className={`p-4 flex items-center justify-between text-xs transition-all
                              ${isUser ? 'bg-blue-50/60 font-extrabold' : 'hover:bg-slate-50/50'}
                            `}
                          >
                            <div className="flex items-center space-x-3.5">
                              <span className="font-black text-sm w-6 text-slate-400 text-center">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                              </span>

                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                                {student.name[0]}
                              </div>

                              <div>
                                <h4 className="text-slate-800 font-extrabold flex items-center space-x-2">
                                  <span>{student.name}</span>
                                  {isUser && <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black">VOUS</span>}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{student.level}</p>
                              </div>
                            </div>

                            <span className="font-black text-slate-800 text-sm shrink-0">
                              {student.score} XP
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. ARCHIVES SUB-VIEW */}
                {activeView === 'archives' && (
                  <div className="space-y-6 text-left">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Archives</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Consultez et restaurez vos documents archivés temporairement.</p>
                    </div>

                    {archivedDocs.length === 0 ? (
                      <div className="bg-white p-12 rounded-[20px] text-center border border-slate-100 space-y-3">
                        <Archive className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="font-extrabold text-slate-700">Aucun document archivé.</h3>
                        <p className="text-xs text-slate-400">Vos fichiers archivés apparaîtront ici.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {archivedDocs.map((doc) => (
                          <div key={doc.id} className="bg-white p-5 rounded-[20px] border border-slate-100 flex flex-col justify-between shadow-xs">
                            <div className="space-y-2">
                              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                <Archive className="w-4.5 h-4.5" />
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-800 truncate" title={doc.name}>{doc.name}</h4>
                              <p className="text-[9px] text-slate-400 font-semibold">Taille : {doc.size}</p>
                            </div>

                            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-50">
                              <button
                                onClick={() => handleRestoreDoc(doc.id, doc.name)}
                                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[11px] font-black transition-colors cursor-pointer"
                              >
                                Restaurer
                              </button>
                              <button
                                onClick={() => {
                                  playClickSound();
                                  dbService.deleteDocument(doc.id).then(() => {
                                    setArchivedDocs(prev => prev.filter(d => d.id !== doc.id));
                                    toast.show(`"${doc.name}" définitivement supprimé.`, 'info');
                                  });
                                }}
                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 8. PARAMETRES SUB-VIEW */}
                {activeView === 'settings' && (
                  <div className="space-y-6 text-left max-w-2xl mx-auto">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Paramètres du Compte</h2>
                      <p className="text-xs text-slate-400 font-bold mt-1">Mettez à jour vos informations personnelles et vos préférences.</p>
                    </div>

                    <form onSubmit={handleSaveSettings} className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-black uppercase text-slate-400">Prénom</label>
                          <input
                            type="text"
                            required
                            value={formData.firstname}
                            onChange={(e) => setFormData((prev) => ({ ...prev, firstname: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-black uppercase text-slate-400">Nom</label>
                          <input
                            type="text"
                            required
                            value={formData.lastname}
                            onChange={(e) => setFormData((prev) => ({ ...prev, lastname: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-black uppercase text-slate-400">Établissement scolaire</label>
                          <input
                            type="text"
                            value={formData.school}
                            onChange={(e) => setFormData((prev) => ({ ...prev, school: e.target.value }))}
                            placeholder="Ex : Sorbonne, Lycée Condorcet"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-black uppercase text-slate-400">Ville</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="Ex : Paris, Lyon"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-black uppercase text-slate-400">Niveau d'études</label>
                          <input
                            type="text"
                            value={formData.level}
                            onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                            placeholder="Ex : Licence 1 Droit, Terminale S"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[11px] font-black uppercase text-slate-400">Objectif principal</label>
                          <input
                            type="text"
                            value={formData.goal}
                            onChange={(e) => setFormData((prev) => ({ ...prev, goal: e.target.value }))}
                            placeholder="Ex : Obtenir ma licence mention Bien"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Ambiance preference switches */}
                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <h4 className="text-[11px] font-black uppercase text-slate-400">Préférences de l'application</h4>
                        
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
                          <div className="flex items-center space-x-3 text-left">
                            {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                            <div>
                              <span className="block text-xs font-extrabold text-slate-800">Sons et effets audio</span>
                              <span className="block text-[10px] text-slate-400 font-bold">Retour sonore lors des clics et succès.</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSound(!soundEnabled)}
                            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer
                              ${soundEnabled ? 'bg-blue-600' : 'bg-slate-200'}
                            `}
                          >
                            <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all
                              ${soundEnabled ? 'left-6' : 'left-1'}
                            `} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
                          <div className="flex items-center space-x-3 text-left">
                            <Bell className="w-5 h-5 text-blue-600" />
                            <div>
                              <span className="block text-xs font-extrabold text-slate-800">Alertes e-mails</span>
                              <span className="block text-[10px] text-slate-400 font-bold">Rappels quotidiens de vos objectifs de révision.</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleNotifications(!notificationsEnabled)}
                            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer
                              ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'}
                            `}
                          >
                            <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all
                              ${notificationsEnabled ? 'left-6' : 'left-1'}
                            `} />
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer text-center active:scale-98"
                      >
                        Enregistrer mes modifications
                      </button>

                    </form>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
          
        </main>
      </div>
    </div>
  );
}
