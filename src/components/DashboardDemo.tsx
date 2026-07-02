/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Sparkles,
  Trophy,
  Layers,
  LineChart,
  Plus,
  UploadCloud,
  CheckCircle2,
  X,
  Volume2,
  ChevronRight,
  RefreshCw,
  Clock,
  ThumbsUp,
  Brain
} from 'lucide-react';
import { playClickSound, playSuccessSound, playFailureSound } from '../utils/audio';
import { toast } from '../utils/toast';

type TabType = 'documents' | 'quiz' | 'flashcards' | 'progression';

interface MockDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'ready' | 'analyzing' | 'analyzed';
  date: string;
}

interface DashboardDemoProps {
  userProfile?: any;
}

export default function DashboardDemo({ userProfile }: DashboardDemoProps) {
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [docs, setDocs] = useState<MockDoc[]>([
    { id: '1', name: 'Biologie_Cellulaire_L1.pdf', type: 'PDF', size: '2.4 MB', status: 'analyzed', date: 'Hier' },
    { id: '2', name: 'Histoire_Contemporaine.docx', type: 'DOCX', size: '1.1 MB', status: 'analyzed', date: 'Il y a 3 jours' },
    { id: '3', name: 'Economie_Introduction.epub', type: 'EPUB', size: '4.8 MB', status: 'ready', date: 'Il y a 1 semaine' },
  ]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Flashcards state
  const [activeFlashcard, setActiveFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const quizQuestions = [
    {
      question: "Quelle est la méthode d'apprentissage la plus efficace supportée par Studora ?",
      options: ["La relecture passive de ses notes", "La répétition espacée et le test actif", "Le bachotage la veille de l'examen"],
      correct: 1,
      explanation: "La répétition espacée et l'auto-évaluation active stimulent les connexions neuronales à long terme !"
    },
    {
      question: "Quel format de cours pouvez-vous importer sur la plateforme Studora ?",
      options: ["Uniquement du texte brut", "Des PDF, fichiers Word, EPUB et notes", "Seulement des captures d'écran"],
      correct: 1,
      explanation: "Studora est polyvalent et gère vos PDF, Word, EPUB et notes de révision pour en extraire l'essence."
    },
    {
      question: "Comment Studora vous aide-t-il à rester motivé pour réviser ?",
      options: ["Par un système de classement d'XP amical", "En bloquant votre téléphone portable", "En envoyant des emails à vos parents"],
      correct: 0,
      explanation: "L'XP amical et le classement stimulent une saine émulation positive sans stress inutile."
    }
  ];

  const flashcards = [
    { front: "Qu'est-ce que la répétition espacée ?", back: "Une technique d'apprentissage qui consiste à réviser un concept à intervalles croissants pour optimiser la rétention à long terme." },
    { front: "Comment fonctionne la plasticité neuronale ?", back: "C'est la capacité du cerveau à créer, renforcer ou éliminer des connexions neuronales en fonction des expériences d'apprentissage." },
    { front: "Qu'est-ce qu'une flashcard active ?", back: "Une carte de révision recto-verso forçant l'effort de récupération (Active Recall), bien plus efficace que la simple relecture." },
  ];

  // Simulator: File upload action
  const handleSimulatedUpload = (fileName: string) => {
    if (isUploading) return;
    playClickSound();
    setIsUploading(true);
    setNewDocName(fileName);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Add new document
            const newDoc: MockDoc = {
              id: Date.now().toString(),
              name: fileName,
              type: fileName.split('.').pop()?.toUpperCase() || 'PDF',
              size: '1.8 MB',
              status: 'analyzed',
              date: 'À l\'instant'
            };
            setDocs([newDoc, ...docs]);
            setIsUploading(false);
            setUploadProgress(null);
            playSuccessSound();
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === quizQuestions[currentQuestion].correct) {
      setQuizScore((prev) => prev + 1);
      playSuccessSound();
    } else {
      playFailureSound();
    }
  };

  const handleNextQuestion = () => {
    playClickSound();
    setSelectedAnswer(null);
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    playClickSound();
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const handleFlipCard = () => {
    playClickSound();
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    playClickSound();
    setIsFlipped(false);
    setTimeout(() => {
      setActiveFlashcard((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handleTabChange = (tab: TabType) => {
    playClickSound();
    setActiveTab(tab);
  };

  return (
    <section id="demo-dashboard-section" className="py-24 bg-white relative overflow-hidden">
      {/* Dynamic Background shapes */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-slate-100 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Démonstration interactive</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Essayez l'expérience Studora
          </h2>
          <p className="text-lg text-slate-500 mt-4 font-medium">
            Cliquez sur les onglets de la barre latérale ci-dessous pour tester l'interface de révision en direct. Activez vos haut-parleurs !
          </p>
        </div>

        {/* Master Interactive Dashboard Mockup Card */}
        <motion.div
          id="interactive-dashboard-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[580px] max-w-5xl mx-auto"
        >
          {/* SIMULATED SIDEBAR */}
          <div className="w-full lg:w-[240px] bg-slate-900 text-white p-6 flex flex-col justify-between shrink-0">
            <div className="space-y-8 text-left">
              {/* App logo brand */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tight">Studora</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/25 text-blue-400 rounded">DEMO</span>
              </div>

              {/* Sidebar Menu Navigation */}
              <nav className="space-y-1">
                <button
                  id="tab-btn-documents"
                  onClick={() => handleTabChange('documents')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'documents'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-4.5 h-4.5 shrink-0" />
                  <span>Mes Documents</span>
                </button>

                <button
                  id="tab-btn-quiz"
                  onClick={() => handleTabChange('quiz')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'quiz'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Trophy className="w-4.5 h-4.5 shrink-0" />
                  <span>Quiz d'évaluation</span>
                </button>

                <button
                  id="tab-btn-flashcards"
                  onClick={() => handleTabChange('flashcards')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'flashcards'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4.5 h-4.5 shrink-0" />
                  <span>Flashcards</span>
                </button>

                <button
                  id="tab-btn-progression"
                  onClick={() => handleTabChange('progression')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'progression'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LineChart className="w-4.5 h-4.5 shrink-0" />
                  <span>Ma progression</span>
                </button>
              </nav>
            </div>

            {/* Simulated User Profile */}
            <div className="pt-6 border-t border-slate-800 flex items-center space-x-3 mt-8 lg:mt-0 text-left">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold text-sm border border-blue-500/30">
                {userProfile?.firstname ? userProfile.firstname[0].toUpperCase() : 'JD'}
              </div>
              <div>
                <p className="text-xs font-bold">
                  {userProfile?.firstname ? `${userProfile.firstname} ${userProfile.lastname || ''}` : 'Jean Dupont'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold font-mono">
                  {userProfile?.level ? `${userProfile.level} • ${userProfile.role || 'Étudiant'}` : 'Bêta-testeur #102'}
                </p>
              </div>
            </div>
          </div>

          {/* SIMULATED CONTENT VIEWPORT */}
          <div className="flex-1 bg-slate-50 p-6 md:p-8 flex flex-col justify-between overflow-hidden">
            
            <AnimatePresence mode="wait">
              
              {/* Onglet 1 : Documents */}
              {activeTab === 'documents' && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 text-left flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900">Mes Documents récents</h3>
                        <p className="text-sm font-medium text-slate-400">Importez vos cours pour déclencher la synthèse magique.</p>
                      </div>
                      
                      {/* Predefined quick adders */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          id="btn-upload-physique"
                          onClick={() => handleSimulatedUpload('Physique_Thermodynamique.pdf')}
                          disabled={isUploading}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-bold transition-all duration-200 shadow-3xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thermodynamique.pdf</span>
                        </button>
                        <button
                          id="btn-upload-chimie"
                          onClick={() => handleSimulatedUpload('Chimie_Organique_L2.pdf')}
                          disabled={isUploading}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-bold transition-all duration-200 shadow-3xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Chimie_Organique.pdf</span>
                        </button>
                      </div>
                    </div>

                    {/* Drag and Drop Zone Container */}
                    <div
                      id="drag-drop-zone"
                      onClick={() => handleSimulatedUpload('Sciences_Du_Cerveau.pdf')}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                        isUploading
                          ? 'border-blue-300 bg-blue-50/20'
                          : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {isUploading ? (
                        <div className="space-y-3 max-w-xs mx-auto">
                          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                          <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Génération en cours... {uploadProgress}%
                          </p>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-150"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-semibold text-slate-400">
                            Extraction du texte, création des quiz et flashcards
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto group-hover:text-blue-500 transition-colors" />
                          <p className="text-sm font-bold text-slate-800">
                            Déposez votre cours ici ou <span className="text-blue-600 hover:underline">parcourez vos fichiers</span>
                          </p>
                          <p className="text-xs font-medium text-slate-400">
                            Démo : Cliquez pour simuler l'importation de "Sciences_Du_Cerveau.pdf"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Document List */}
                    <div className="space-y-2.5">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          id={`doc-row-${doc.id}`}
                          className="bg-white border border-slate-200/60 p-4 rounded-xl flex items-center justify-between shadow-3xs hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-mono text-[10px] font-bold">
                              {doc.type}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                              <div className="flex items-center space-x-2.5 mt-0.5">
                                <span className="text-[10px] font-semibold text-slate-400">{doc.size}</span>
                                <span className="text-slate-200 text-xs">•</span>
                                <span className="text-[10px] font-semibold text-slate-400">{doc.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              <span>Prêt</span>
                            </span>
                            
                            <button
                              id={`btn-open-doc-${doc.id}`}
                              onClick={() => {
                                playClickSound();
                                toast.show(`Affichage du résumé de ${doc.name} bientôt disponible ! Passez au Quiz ou aux Flashcards pour tester l'apprentissage actif.`, 'info');
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 border-t border-slate-200/60 pt-4 mt-4">
                    💡 Astuce : Les documents téléchargés restent confidentiels et stockés localement sur votre appareil.
                  </p>
                </motion.div>
              )}

              {/* Onglet 2 : Quiz d'évaluation interactif */}
              {activeTab === 'quiz' && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 text-left flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Quiz d'évaluation actif</h3>
                      <p className="text-sm font-medium text-slate-400">Validez votre mémoire immédiate. Gagnez de l'XP.</p>
                    </div>

                    {!quizCompleted ? (
                      <div className="space-y-4">
                        {/* Quiz progress header */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>QUESTION {currentQuestion + 1} SUR {quizQuestions.length}</span>
                          <span>SCORE ACTUEL : {quizScore}/{quizQuestions.length}</span>
                        </div>
                        
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                          />
                        </div>

                        {/* Question container */}
                        <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-xl shadow-3xs space-y-4">
                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {quizQuestions[currentQuestion].question}
                          </h4>

                          {/* Options list */}
                          <div className="space-y-2.5">
                            {quizQuestions[currentQuestion].options.map((option, idx) => {
                              let btnStyle = 'border-slate-200 hover:border-blue-400 hover:bg-slate-50';
                              if (selectedAnswer !== null) {
                                if (idx === quizQuestions[currentQuestion].correct) {
                                  btnStyle = 'border-green-500 bg-green-50 text-green-900';
                                } else if (idx === selectedAnswer) {
                                  btnStyle = 'border-red-400 bg-red-50 text-red-900';
                                } else {
                                  btnStyle = 'border-slate-200 opacity-60';
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  id={`quiz-option-${idx}`}
                                  onClick={() => handleAnswerSelect(idx)}
                                  disabled={selectedAnswer !== null}
                                  className={`w-full text-left p-4 rounded-xl text-sm font-bold border transition-all duration-200 flex items-center justify-between cursor-pointer ${btnStyle}`}
                                >
                                  <span>{option}</span>
                                  {selectedAnswer !== null && idx === quizQuestions[currentQuestion].correct && (
                                    <span className="text-xs font-bold text-green-600 bg-white border border-green-200 px-2 py-0.5 rounded-md">Correct</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation display */}
                          {selectedAnswer !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-xs font-medium text-slate-600"
                            >
                              <span className="font-extrabold text-blue-700 uppercase tracking-wide mr-1.5">Explication :</span>
                              {quizQuestions[currentQuestion].explanation}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Quiz Completed state
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-200/80 p-8 rounded-xl shadow-md text-center space-y-6"
                      >
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                          <Trophy className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-2xl font-extrabold text-slate-900">Quiz terminé !</h4>
                          <p className="text-sm font-medium text-slate-500">
                            Félicitations, vous avez révisé avec succès cette session.
                          </p>
                        </div>

                        <div className="inline-block px-6 py-3 bg-slate-50 rounded-xl border border-slate-200/60">
                          <span className="text-sm font-bold text-slate-400">VOTRE COMPÉTENCE : </span>
                          <span className="text-2xl font-extrabold text-blue-600 ml-2">
                            {Math.round((quizScore / quizQuestions.length) * 100)}%
                          </span>
                        </div>

                        <div className="flex justify-center space-x-3">
                          <button
                            id="quiz-restart-btn"
                            onClick={restartQuiz}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Recommencer</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200/60 mt-4">
                    {!quizCompleted && selectedAnswer !== null && (
                      <button
                        id="quiz-next-btn"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                      >
                        <span>{currentQuestion < quizQuestions.length - 1 ? "Question suivante" : "Terminer"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Onglet 3 : Flashcards interactives */}
              {activeTab === 'flashcards' && (
                <motion.div
                  key="flashcards"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 text-left flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Flashcards de mémorisation</h3>
                      <p className="text-sm font-medium text-slate-400">Répétition active à l'aide de cartes recto-verso.</p>
                    </div>

                    {/* Progress tracking */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>CARTE {activeFlashcard + 1} SUR {flashcards.length}</span>
                      <span>CLIQUEZ POUR RETOURNER LA CARTE</span>
                    </div>

                    {/* 3D Flipping Card visual container */}
                    <div className="perspective-1000 h-[220px] relative w-full max-w-md mx-auto">
                      <motion.div
                        onClick={handleFlipCard}
                        className="relative w-full h-full cursor-pointer duration-500"
                        style={{
                          transformStyle: 'preserve-3d',
                          rotateY: isFlipped ? 180 : 0
                        }}
                      >
                        {/* Front Side Card */}
                        <div
                          className="absolute inset-0 bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs select-none backface-hidden"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question</span>
                          <p className="text-base md:text-lg font-bold text-slate-800 text-center flex items-center justify-center flex-1">
                            {flashcards[activeFlashcard].front}
                          </p>
                          <span className="text-[10px] font-bold text-blue-600 text-center animate-pulse">Afficher la réponse</span>
                        </div>

                        {/* Back Side Card */}
                        <div
                          className="absolute inset-0 bg-slate-900 text-white border-2 border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md select-none backface-hidden"
                          style={{ transform: 'rotateY(180deg)' }}
                        >
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Définition</span>
                          <p className="text-sm md:text-base font-medium text-slate-100 text-center flex items-center justify-center flex-1 leading-relaxed">
                            {flashcards[activeFlashcard].back}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 text-center">Re-cliquer pour voir la question</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 mt-4">
                    <span className="text-xs text-slate-400 font-medium">Auto-évaluez vous mentalement avant de retourner !</span>
                    <button
                      id="flashcards-next-btn"
                      onClick={handleNextCard}
                      className="inline-flex items-center space-x-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Carte suivante</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Onglet 4 : Progression */}
              {activeTab === 'progression' && (
                <motion.div
                  key="progression"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 text-left flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Suivi des performances scolaires</h3>
                      <p className="text-sm font-medium text-slate-400">Vos XP, constance et scores accumulés d'entraînement.</p>
                    </div>

                    {/* Stats bento layout */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temps de révision</span>
                        <div className="my-2.5">
                          <span className="text-2xl font-extrabold text-slate-900">4h 32m</span>
                          <span className="text-[10px] text-green-500 font-bold ml-1.5">+20%</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Cette semaine
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score d'assimilation</span>
                        <div className="my-2.5">
                          <span className="text-2xl font-extrabold text-slate-900">92/100</span>
                          <span className="text-[10px] text-blue-500 font-bold ml-1.5">Excellent</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium flex items-center">
                          <ThumbsUp className="w-3 h-3 mr-1" /> Calculé sur 12 quiz
                        </span>
                      </div>
                    </div>

                    {/* Beautiful SVG progression chart */}
                    <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Évolution hebdomadaire (XP)</span>
                        <span className="text-blue-600 font-mono">1,450 XP accumulés</span>
                      </div>

                      <div className="relative h-24 w-full flex items-end justify-between px-1.5 pt-4">
                        {/* Background guide lines */}
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-100" />
                        <div className="absolute inset-x-0 bottom-8 h-[1px] bg-slate-50" />
                        <div className="absolute inset-x-0 bottom-16 h-[1px] bg-slate-50" />

                        {/* Custom visual chart columns */}
                        {[
                          { day: 'Lun', val: 30, xp: '150' },
                          { day: 'Mar', val: 55, xp: '280' },
                          { day: 'Mer', val: 40, xp: '200' },
                          { day: 'Jeu', val: 75, xp: '390' },
                          { day: 'Ven', val: 60, xp: '310' },
                          { day: 'Sam', val: 95, xp: '480' },
                          { day: 'Dim', val: 20, xp: '100' },
                        ].map((d, index) => (
                          <div key={index} className="flex flex-col items-center flex-1 space-y-1 z-10 group/col relative">
                            {/* Floating tooltip on hover */}
                            <div className="absolute bottom-full mb-1 bg-slate-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/col:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
                              {d.xp} XP
                            </div>
                            
                            {/* Animated bar */}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${d.val}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                              className="w-4 rounded-t-sm bg-blue-500 hover:bg-blue-600 transition-colors"
                            />
                            <span className="text-[9px] font-bold text-slate-400 font-mono">{d.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 border-t border-slate-200/60 pt-4 mt-4">
                    🚀 Votre score vous place dans le Top 5% des étudiants de votre promotion. Continuez ainsi !
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
