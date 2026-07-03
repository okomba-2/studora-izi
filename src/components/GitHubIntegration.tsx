/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Github,
  Folder,
  File,
  ArrowLeft,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Layers,
  Info
} from 'lucide-react';
import { dbService, UserProfile, ProgressRow, DocumentRow, QuizRow, FlashcardRow } from '../lib/supabase';
import { playClickSound, playSuccessSound, playFailureSound } from '../utils/audio';
import { toast } from '../utils/toast';

interface GitHubIntegrationProps {
  userProfile: UserProfile;
  progress: ProgressRow | null;
  setProgress: (p: ProgressRow | null) => void;
  setDocuments: (docs: DocumentRow[]) => void;
  setQuizzes: (quizzes: QuizRow[]) => void;
  setFlashcards: (fc: FlashcardRow[]) => void;
  animateStats: (docsC: number, quizC: number, scoreA: number, hours: number) => void;
  setActiveView: (view: string) => void;
}

interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  html_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  default_branch: string;
  owner: { login: string };
}

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "dir" | "file";
  html_url: string;
  download_url: string | null;
}

export default function GitHubIntegration({
  userProfile,
  progress,
  setProgress,
  setDocuments,
  setQuizzes,
  setFlashcards,
  animateStats,
  setActiveView
}: GitHubIntegrationProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem('studora_github_token') || '');
  const [manualToken, setManualToken] = useState<string>('');
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [loadingRepos, setLoadingRepos] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Browse state
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [loadingContents, setLoadingContents] = useState<boolean>(false);
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  // Selected file analysis state
  const [selectedFile, setSelectedFile] = useState<GitHubContent | null>(null);
  const [analyzingFile, setAnalyzingFile] = useState<boolean>(false);

  // Load profile and repos if token exists
  useEffect(() => {
    if (token) {
      fetchGitHubData(token);
    }
  }, [token]);

  // Handle postMessage for OAuth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS' && event.data?.token) {
        const receivedToken = event.data.token;
        localStorage.setItem('studora_github_token', receivedToken);
        setToken(receivedToken);
        playSuccessSound();
        toast.show('Connecté à GitHub avec succès ! 🎉', 'success');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchGitHubData = async (ghToken: string) => {
    setLoadingProfile(true);
    setLoadingRepos(true);
    try {
      // 1. Fetch Profile
      const profResponse = await fetch('/api/github/profile', {
        headers: {
          'Authorization': `Bearer ${ghToken}`
        }
      });
      if (!profResponse.ok) {
        throw new Error('Jeton invalide ou expiré.');
      }
      const profData = await profResponse.json();
      setProfile(profData);

      // 2. Fetch Repos
      const reposResponse = await fetch('/api/github/repos', {
        headers: {
          'Authorization': `Bearer ${ghToken}`
        }
      });
      if (reposResponse.ok) {
        const reposData = await reposResponse.json();
        setRepos(reposData);
      }
    } catch (error: any) {
      console.error(error);
      playFailureSound();
      toast.show(error.message || 'Échec de la récupération des données GitHub.', 'warning');
      // Clear invalid token
      localStorage.removeItem('studora_github_token');
      setToken('');
      setProfile(null);
      setRepos([]);
    } finally {
      setLoadingProfile(false);
      setLoadingRepos(false);
    }
  };

  const handleConnectOAuth = async () => {
    playClickSound();
    try {
      const response = await fetch('/api/github/oauth-url');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Échec de l'obtention de l'URL OAuth.");
      }
      const { url } = await response.json();
      const popupWidth = 600;
      const popupHeight = 700;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;
      
      const authWindow = window.open(
        url,
        'github_oauth_popup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
      );

      if (!authWindow) {
        toast.show('Veuillez autoriser les popups pour vous connecter.', 'warning');
      }
    } catch (error: any) {
      console.error(error);
      toast.show(error.message || 'Erreur lors du lancement de la connexion.', 'warning');
    }
  };

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    playClickSound();
    setLoadingProfile(true);
    try {
      // Test manual token
      const profResponse = await fetch('/api/github/profile', {
        headers: {
          'Authorization': `Bearer ${manualToken.trim()}`
        }
      });
      if (!profResponse.ok) {
        throw new Error('Le jeton d\'accès saisi est invalide.');
      }
      const profData = await profResponse.json();
      setProfile(profData);
      localStorage.setItem('studora_github_token', manualToken.trim());
      setToken(manualToken.trim());
      setManualToken('');
      playSuccessSound();
      toast.show('Connecté avec succès via Jeton ! 🔑', 'success');
    } catch (error: any) {
      console.error(error);
      playFailureSound();
      toast.show(error.message || 'Erreur de connexion avec ce jeton.', 'warning');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleDisconnect = () => {
    playClickSound();
    localStorage.removeItem('studora_github_token');
    setToken('');
    setProfile(null);
    setRepos([]);
    setSelectedRepo(null);
    setCurrentPath('');
    setContents([]);
    setSelectedFile(null);
    toast.show('GitHub déconnecté avec succès.', 'info');
  };

  // Browse Repository Contents
  const browseRepo = async (repo: GitHubRepo, pathStr: string = '') => {
    setLoadingContents(true);
    setSelectedFile(null);
    try {
      const response = await fetch(`/api/github/contents?owner=${repo.owner.login}&repo=${repo.name}&path=${encodeURIComponent(pathStr)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Impossible de charger le dossier.');
      }
      const data = await response.json();
      const sortedData = Array.isArray(data)
        ? data.sort((a: any, b: any) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
          })
        : [data];

      setContents(sortedData);
      setSelectedRepo(repo);
      setCurrentPath(pathStr);
    } catch (error: any) {
      console.error(error);
      playFailureSound();
      toast.show(error.message || 'Erreur lors du chargement des fichiers.', 'warning');
    } finally {
      setLoadingContents(false);
    }
  };

  const handleNavigateFolder = (folderPath: string) => {
    playClickSound();
    const nextHistory = [...pathHistory, currentPath];
    setPathHistory(nextHistory);
    browseRepo(selectedRepo!, folderPath);
  };

  const handleNavigateBack = () => {
    playClickSound();
    if (pathHistory.length === 0) {
      setSelectedRepo(null);
      setCurrentPath('');
      setContents([]);
    } else {
      const prevPath = pathHistory[pathHistory.length - 1];
      const nextHistory = pathHistory.slice(0, -1);
      setPathHistory(nextHistory);
      browseRepo(selectedRepo!, prevPath);
    }
  };

  const handleSelectFile = (file: GitHubContent) => {
    playClickSound();
    setSelectedFile(file);
  };

  // Run AI analysis on code/text file from GitHub
  const handleAnalyzeGitHubFile = async () => {
    if (!selectedRepo || !selectedFile) return;
    playClickSound();
    setAnalyzingFile(true);
    try {
      const response = await fetch('/api/github/analyze-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          path: selectedFile.path,
          fileName: selectedFile.name
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Échec de l'analyse du fichier par l'IA.");
      }

      const parsedData = await response.json();

      // Create Document in local db/Supabase
      const newDoc = await dbService.uploadDocument(
        userProfile.id,
        `[GitHub] ${selectedFile.name}`,
        (selectedFile.size / 1024).toFixed(1) + ' Ko',
        selectedFile.name.split('.').pop()?.toUpperCase() || 'CODE'
      );
      await dbService.updateDocumentStatus(newDoc.id, 'analyzed');

      // Create Quiz
      const quizQuestions = parsedData.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || "Explication générée par l'IA.",
      }));

      const quizTitle = parsedData.quizTitle || `Quiz : ${selectedFile.name}`;
      await dbService.createQuiz(userProfile.id, quizTitle, quizQuestions, newDoc.id);

      // Create Flashcards
      if (Array.isArray(parsedData.flashcards)) {
        for (const fc of parsedData.flashcards) {
          await dbService.createFlashcard(userProfile.id, fc.front, fc.back, newDoc.id);
        }
      }

      // Refresh datasets
      const freshDocs = await dbService.getDocuments(userProfile.id);
      const freshQuizzes = await dbService.getQuizzes(userProfile.id);
      const freshFcs = await dbService.getFlashcards(userProfile.id);

      // Award XP (+30 XP)
      let currentXp = progress?.xp || 0;
      let currentHours = progress?.hours_studied || 4.5;
      if (progress) {
        const updatedProgress = await dbService.updateProgress(userProfile.id, {
          xp: progress.xp + 30,
          daily_goal_pct: Math.min(progress.daily_goal_pct + 25, 100)
        });
        setProgress(updatedProgress);
        currentXp = updatedProgress.xp;
        currentHours = updatedProgress.hours_studied;
      }

      setDocuments(freshDocs);
      setQuizzes(freshQuizzes);
      setFlashcards(freshFcs);

      // Update parent counters
      const activeQuizzes = freshQuizzes;
      const getAverageScore = (quizList: QuizRow[]) => {
        const completed = quizList.filter(q => q.completed && q.score !== null);
        if (completed.length === 0) return 80;
        const totalPct = completed.reduce((acc, q) => acc + ((q.score || 0) / q.max_score) * 100, 0);
        return Math.round(totalPct / completed.length);
      };
      animateStats(freshDocs.length, freshQuizzes.length, getAverageScore(activeQuizzes), currentHours);

      playSuccessSound();
      toast.show(`Fichier "${selectedFile.name}" analysé ! Quiz et Flashcards créés. ✨ +30 XP`, 'success');
      
      // Auto-navigate to newly created Quiz to study
      setActiveView('quiz');
    } catch (error: any) {
      console.error(error);
      playFailureSound();
      toast.show(error.message || 'Une erreur est survenue lors de la numérisation de votre code.', 'warning');
    } finally {
      setAnalyzingFile(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
          <Github className="w-6 h-6 text-slate-800" />
          <span>Intégration GitHub</span>
        </h2>
        <p className="text-xs text-slate-400 font-bold mt-1">
          Connectez votre compte GitHub pour transformer vos dépôts de code, fiches Markdown et documents de cours en Quiz et Flashcards intelligents.
        </p>
      </div>

      {!token ? (
        // CONNECT VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Automatic OAuth connection */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between text-left space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <Github className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Connexion Automatique</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Recommandé pour un accès direct et rapide. Connectez-vous via l'authentification sécurisée officielle de GitHub.
              </p>
            </div>

            <button
              onClick={handleConnectOAuth}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <Github className="w-4 h-4" />
              <span>Se connecter avec GitHub (OAuth)</span>
            </button>
            
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-[10px] text-blue-800 font-semibold leading-relaxed">
                <strong>Config de rappel :</strong> Pour utiliser l'OAuth en production, définissez <code>GITHUB_CLIENT_ID</code> et <code>GITHUB_CLIENT_SECRET</code> dans vos Secrets. URL de redirection autorisée : <code>{window.location.origin}/auth/callback</code>
              </div>
            </div>
          </div>

          {/* Manual Jeton d'accès (PAT) connection */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-100 shadow-sm text-left space-y-4">
            <div className="space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Connexion par Jeton (PAT)</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Connectez-vous instantanément en saisissant un Jeton d'accès personnel GitHub (Personal Access Token). Ultra fiable et sans configuration requise.
              </p>
            </div>

            <form onSubmit={handleConnectManual} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Jeton d'accès GitHub (classic ou fine-grained)</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                  <Key className="absolute right-3.5 top-3 w-4 h-4 text-slate-300" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingProfile}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {loadingProfile ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Valider le Jeton et se connecter</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Comment créer un Jeton ?</h4>
              <ol className="text-[10px] text-slate-500 space-y-1 list-decimal pl-4 font-semibold">
                <li>Allez sur GitHub &gt; Settings &gt; Developer settings &gt; Personal access tokens.</li>
                <li>Générez un jeton avec l'accès au scope <code>repo</code> et <code>user</code>.</li>
                <li>Copiez-collez-le ci-dessus en toute sécurité.</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        // LOGGED IN VIEW
        <div className="space-y-6">
          {/* User Profile Summary row */}
          <div className="bg-white p-5 rounded-[20px] border border-slate-100 flex flex-col sm:flex-row items-center justify-between shadow-xs gap-4">
            <div className="flex items-center space-x-4 text-left self-start sm:self-center">
              {profile ? (
                <>
                  <img
                    src={profile.avatar_url}
                    alt={profile.login}
                    className="w-12 h-12 rounded-full border-2 border-slate-100 shadow-sm"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                      <span>{profile.name || profile.login}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-black">
                        @{profile.login}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-sm truncate font-semibold">
                      {profile.bio || "Aucune biographie fournie."}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500">
                        {profile.public_repos} dépôts publics • Jeton connecté
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-slate-200 h-12 w-12" />
                  <div className="space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-24" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleDisconnect}
              className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-black transition-colors cursor-pointer self-stretch sm:self-center text-center"
            >
              Déconnecter de GitHub
            </button>
          </div>

          {!selectedRepo ? (
            // REPOSITORIES LIST VIEW
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Sélectionnez un dépôt à explorer
                </h3>
                
                {/* Search repos bar */}
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Rechercher un dépôt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 shadow-xs"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {loadingRepos ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100">
                  <div className="w-9 h-9 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Récupération de vos dépôts GitHub...</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-100 rounded-[20px] space-y-3">
                  <Github className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="font-extrabold text-slate-700">Aucun dépôt trouvé</h3>
                  <p className="text-xs text-slate-400">Essayez une autre recherche ou vérifiez vos permissions de jeton.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRepos.map((repo) => (
                    <motion.div
                      key={repo.id}
                      whileHover={{ y: -3 }}
                      onClick={() => browseRepo(repo)}
                      className="bg-white p-5 rounded-[20px] border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/40 transition-all cursor-pointer text-left flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {repo.language || "Code"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center space-x-1">
                            {repo.private ? (
                              <><Lock className="w-3 h-3 text-amber-500" /> <span>Privé</span></>
                            ) : (
                              <><Unlock className="w-3 h-3 text-slate-300" /> <span>Public</span></>
                            )}
                          </span>
                        </div>
                        
                        <h4 className="font-black text-xs text-slate-900 truncate" title={repo.name}>
                          {repo.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold line-clamp-2 h-7 leading-relaxed">
                          {repo.description || "Aucune description de dépôt."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 text-[10px] font-black text-slate-400">
                        <span>Mis à jour le {new Date(repo.updated_at).toLocaleDateString()}</span>
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // REPOSITORY CONTENT EXPLORER VIEW
            <div className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-5 text-left">
              {/* Explorer Header / Breadcrumbs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-50">
                <div className="flex items-center space-x-3 text-left">
                  <button
                    onClick={handleNavigateBack}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-slate-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 flex items-center space-x-1">
                      <span className="text-blue-600 font-extrabold">{selectedRepo.name}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-500 font-semibold max-w-xs truncate">
                        {currentPath || "racine"}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      Parcourez les fichiers d'études pour générer des révisions.
                    </p>
                  </div>
                </div>

                <a
                  href={selectedRepo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-[10px] font-black text-blue-600 hover:underline"
                >
                  <span>Ouvrir sur GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Loader, File Grid or Selected File detail view */}
              {loadingContents ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-9 h-9 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Récupération du répertoire...</p>
                </div>
              ) : selectedFile ? (
                // FILE DETAILED PREVIEW & ANALYSIS TRIGGER
                <div className="py-4 space-y-6">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-[20px] flex items-start space-x-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1 leading-normal">
                      <h4 className="font-black text-xs text-slate-900 truncate">
                        {selectedFile.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Chemin complet : {selectedFile.path}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                        Taille : {(selectedFile.size / 1024).toFixed(1)} Ko
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-xs font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Retour aux fichiers
                    </button>
                  </div>

                  {/* AI action panel */}
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 p-6 rounded-[24px] space-y-4 text-left">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                      <h4 className="font-extrabold text-sm text-slate-900">Transformateur d'études IA</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      L'intelligence artificielle de Studora va lire attentivement l'intégralité du contenu de ce fichier pour en extraire les idées forces, définir les termes clés, et composer automatiquement un QCM d'entraînement à haute fidélité académique.
                    </p>

                    <button
                      onClick={handleAnalyzeGitHubFile}
                      disabled={analyzingFile}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
                    >
                      {analyzingFile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          <span>Lecture et analyse par Gemini IA... (patientez 5 à 10s)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>✨ Convertir en Quiz & Flashcards avec l'IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : contents.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">Ce dossier est vide.</p>
                </div>
              ) : (
                // LIST OF CURRENT DIRECTORY CONTENTS
                <div className="space-y-2">
                  {contents.map((item) => {
                    const isDir = item.type === 'dir';
                    return (
                      <div
                        key={item.sha}
                        onClick={() => isDir ? handleNavigateFolder(item.path) : handleSelectFile(item)}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          {isDir ? (
                            <Folder className="w-4.5 h-4.5 text-blue-500 fill-blue-50/50" />
                          ) : (
                            <File className="w-4.5 h-4.5 text-slate-400" />
                          )}
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-md">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4">
                          {!isDir && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {(item.size / 1024).toFixed(1)} Ko
                            </span>
                          )}
                          {isDir ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100">
                              Analyser
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
