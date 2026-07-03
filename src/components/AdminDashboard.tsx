/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  FileText, 
  BookOpen, 
  Compass, 
  Clock, 
  Award, 
  Search, 
  Trash2, 
  Eye, 
  Database, 
  LogOut, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  BrainCircuit,
  Settings,
  RefreshCw,
  X
} from 'lucide-react';
import { adminService, isMock, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { playClickSound, playSuccessSound, playFailureSound } from '../utils/audio';
import { toast } from '../utils/toast';

interface AdminDashboardProps {
  currentUser: any;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export default function AdminDashboard({ currentUser, onLogout, onNavigate }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Credentials edit form
  const [dbUrl, setDbUrl] = useState(supabaseUrl);
  const [dbKey, setDbKey] = useState(supabaseAnonKey);
  const [showConfig, setShowConfig] = useState(false);

  // Admin Data states
  const [data, setData] = useState<{
    profiles: any[];
    documents: any[];
    quizzes: any[];
    flashcards: any[];
    progress: any[];
  }>({
    profiles: [],
    documents: [],
    quizzes: [],
    flashcards: [],
    progress: []
  });

  // Load complete admin datasets
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminData();
      setData(res);
    } catch (err: any) {
      console.error(err);
      toast.show('Erreur de récupération des données administratives.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaveConfig = () => {
    playClickSound();
    if (!dbUrl || !dbKey) {
      toast.show('Veuillez renseigner l’URL et la clé ANON Supabase.', 'warning');
      return;
    }
    try {
      adminService.saveCredentials(dbUrl, dbKey);
      playSuccessSound();
      toast.show('Identifiants Supabase sauvegardés ! Reconnexion en cours...', 'success');
    } catch (e) {
      playFailureSound();
      toast.show('Échec de la sauvegarde des identifiants.', 'warning');
    }
  };

  const handleClearConfig = () => {
    playClickSound();
    if (window.confirm('Voulez-vous réinitialiser la connexion Supabase et revenir en mode simulé ?')) {
      adminService.clearCredentials();
      toast.show('Mode simulé (Mock) réactivé !', 'info');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    playClickSound();
    if (userId === currentUser.id) {
      toast.show('Vous ne pouvez pas supprimer votre propre compte administrateur !', 'warning');
      return;
    }
    if (window.confirm(`Êtes-vous absolument sûr de vouloir supprimer l'utilisateur "${name}" ainsi que toutes ses données (fichiers, quiz, progrès, flashcards) ?`)) {
      try {
        await adminService.deleteUser(userId);
        playSuccessSound();
        toast.show(`L'utilisateur ${name} a été supprimé définitivement.`, 'success');
        // Reload data
        loadAdminData();
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(null);
        }
      } catch (err: any) {
        playFailureSound();
        toast.show(err.message || 'Erreur lors de la suppression de l’utilisateur.', 'warning');
      }
    }
  };

  // Processing metrics
  const totalUsers = data.profiles.length;
  const totalDocs = data.documents.length;
  const totalQuizzes = data.quizzes.length;
  const totalFlashcards = data.flashcards.length;

  const totalXP = data.progress.reduce((sum, p) => sum + (p.xp || 0), 0);
  const totalHours = data.progress.reduce((sum, p) => sum + (p.hours_studied || 0), 0);

  // Filtered users list
  const filteredUsers = data.profiles.filter(p => {
    const term = searchQuery.toLowerCase();
    const fullName = `${p.firstname || ''} ${p.lastname || ''}`.toLowerCase();
    const email = (p.email || '').toLowerCase();
    const school = (p.school || '').toLowerCase();
    const level = (p.level || '').toLowerCase();
    const city = (p.city || '').toLowerCase();
    return fullName.includes(term) || email.includes(term) || school.includes(term) || level.includes(term) || city.includes(term);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased relative selection:bg-blue-600 selection:text-white pb-16">
      {/* Decorative ambient gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(37,99,235,0.15),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />

      {/* Admin Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <ShieldAlert className="w-5.5 h-5.5 text-white animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white block">
                  Studora Admin
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Console de Supervision
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Database State Badge */}
              <div 
                onClick={() => { playClickSound(); setShowConfig(!showConfig); }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer hover:bg-slate-800 transition-all ${
                  isMock 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isMock ? 'Base Simulée (Mock)' : 'Supabase Connecté'}</span>
                <Settings className="w-3 h-3 ml-1 opacity-70 group-hover:rotate-45 transition-transform" />
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  onLogout();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Supabase Dynamic Configuration Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Key className="w-4 h-4 text-blue-500" />
                      <span>Connexion à votre base Supabase</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Entrez les identifiants de votre base de données Supabase pour basculer vers une synchronisation Cloud en direct.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowConfig(false)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUPABASE PROJECT URL</label>
                    <input 
                      type="text"
                      placeholder="https://your-project-id.supabase.co"
                      value={dbUrl}
                      onChange={(e) => setDbUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUPABASE ANON KEY</label>
                    <input 
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={dbKey}
                      onChange={(e) => setDbKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    {isMock ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span>Mode Local (Offline-First) actif : Les données de test sont sécurisées localement.</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-400 font-semibold">Mode Cloud actif : connecté à Supabase en direct.</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center space-x-2">
                    {!isMock && (
                      <button
                        onClick={handleClearConfig}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-all"
                      >
                        Réinitialiser la connexion
                      </button>
                    )}
                    <button
                      onClick={handleSaveConfig}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                    >
                      Sauvegarder et Connecter
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Introduction Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 border border-slate-800/80 p-6 rounded-2xl">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest bg-blue-500/10 text-blue-400 uppercase">
                ADMIN PRIVILÈGES
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-semibold">
                Session active pour: <strong className="text-slate-200">{currentUser.email}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Tableau de bord de consommation de Studora
            </h1>
            <p className="text-xs text-slate-400">
              Mesurez l'engagement des étudiants, les lancements de quiz, le volume de documents téléchargés, et l'usage global d'AI.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => { playClickSound(); loadAdminData(); }}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Rafraîchir</span>
            </button>
            <button
              onClick={() => { playClickSound(); onNavigate('landing'); }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
            >
              Retour au Site
            </button>
          </div>
        </div>

        {/* Global KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Utilisateurs', value: totalUsers, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
            { label: 'Fichiers Importés', value: totalDocs, icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' },
            { label: 'Quiz Générés', value: totalQuizzes, icon: BookOpen, color: 'text-violet-500 bg-violet-500/10' },
            { label: 'Flashcards', value: totalFlashcards, icon: Compass, color: 'text-amber-500 bg-amber-500/10' },
            { label: 'Temps Étudié', value: `${totalHours.toFixed(1)}h`, icon: Clock, color: 'text-emerald-500 bg-emerald-500/10' },
            { label: 'XP Distribué', value: totalXP, icon: Award, color: 'text-rose-500 bg-rose-500/10' },
          ].map((card, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800/60 rounded-xl p-4.5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-white tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        {/* AI & File Consumption Highlight Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Resource & API Cost Estimation */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI API Token Consumption</h3>
              </div>
              <p className="text-xs text-slate-400">
                Estimation basée sur les résumés et les générations de quiz automatisés via le modèle de langage Gemini.
              </p>
            </div>

            <div className="my-6 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Tokens Estimés</span>
                  <p className="text-2xl font-black text-indigo-400">{(totalDocs * 3200 + totalQuizzes * 5400).toLocaleString()} tk</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Coût Estimé</span>
                  <p className="text-lg font-bold text-emerald-400">{((totalDocs * 3200 + totalQuizzes * 5400) * 0.0000015).toFixed(4)} $</p>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                  <span>Quota mensuel d'AI gratuit</span>
                  <span>{(((totalDocs * 3 + totalQuizzes * 5) / 100) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, (totalDocs * 3 + totalQuizzes * 5))}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3 flex items-center space-x-2.5">
              <TrendingUp className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <p className="text-[11px] text-indigo-300 leading-relaxed">
                Recommandation : L'usage moyen par utilisateur est de {((totalDocs + totalQuizzes) / (totalUsers || 1)).toFixed(1)} activités interactives par mois. L'infrastructure est stable.
              </p>
            </div>
          </div>

          {/* Document File Storage Breakdown */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Volume de Stockage</h3>
              </div>
              <p className="text-xs text-slate-400">
                Espace disque consommé par les supports pédagogiques et PDF importés par les étudiants.
              </p>
            </div>

            <div className="my-6 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Taille Totale Stockée</span>
                  <p className="text-2xl font-black text-blue-400">
                    {(data.documents.reduce((sum, d) => {
                      const mb = parseFloat(d.size || '0');
                      return sum + (isNaN(mb) ? 0 : mb);
                    }, 0)).toFixed(1)} MB
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Taille Moyenne PDF</span>
                  <p className="text-lg font-bold text-slate-200">
                    {(data.documents.length ? (data.documents.reduce((sum, d) => {
                      const mb = parseFloat(d.size || '0');
                      return sum + (isNaN(mb) ? 0 : mb);
                    }, 0) / data.documents.length).toFixed(1) : 0)} MB
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                  <span>Usage Espace Disque</span>
                  <span>{(data.documents.reduce((sum, d) => sum + parseFloat(d.size || '0'), 0) / 100).toFixed(2)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                    style={{ width: `${Math.min(100, data.documents.reduce((sum, d) => sum + parseFloat(d.size || '0'), 0) / 10)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-500/10 rounded-xl p-3 flex items-center space-x-2.5">
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                Le stockage est optimisé. Les fichiers inactifs de plus de 90 jours sont automatiquement archivés localement.
              </p>
            </div>
          </div>

          {/* Interactive Study Level Distribution Chart */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Répartition Universitaire</h3>
              </div>
              <p className="text-xs text-slate-400">
                Distribution des étudiants inscrits selon les niveaux d'études configurés.
              </p>
            </div>

            <div className="my-4 space-y-2 flex-1 flex flex-col justify-center">
              {['L1', 'L2', 'L3', 'M1', 'M2', 'Autres'].map((lvl) => {
                const count = data.profiles.filter(p => (p.level || '').toUpperCase().includes(lvl) || (lvl === 'Autres' && !p.level)).length;
                const pct = data.profiles.length ? (count / data.profiles.length) * 100 : 0;
                return (
                  <div key={lvl} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                      <span>{lvl}</span>
                      <span>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full">
                      <div 
                        className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Users Statistics and Consumption Database Section */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden">
          
          {/* Section Header */}
          <div className="p-6 border-b border-slate-800/60 bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Base des Étudiants & Consommation Pédagogique</span>
              </h2>
              <p className="text-xs text-slate-400">
                Liste complète des profils avec données d'XP, temps passé, et fichiers importés en temps réel.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Chercher un étudiant, école, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400">Chargement de la base d'utilisateurs...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-semibold">Aucun utilisateur ne correspond à la recherche.</p>
                <p className="text-xs text-slate-600 mt-1">Essayez un autre mot-clé ou effacez la recherche.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Étudiant / Email</th>
                    <th className="px-6 py-4">Niveau / École</th>
                    <th className="px-6 py-4">Ville</th>
                    <th className="px-6 py-4 text-center">Documents</th>
                    <th className="px-6 py-4 text-center">Quiz Terminés</th>
                    <th className="px-6 py-4 text-center">Progression</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {filteredUsers.map((user) => {
                    const userDocs = data.documents.filter(d => d.user_id === user.id);
                    const userQuizzes = data.quizzes.filter(q => q.user_id === user.id && q.completed);
                    const userProg = data.progress.find(p => p.user_id === user.id) || { xp: 0, hours_studied: 0, streak: 0 };
                    
                    return (
                      <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                        {/* Name and Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                              {user.firstname?.[0] || 'U'}{user.lastname?.[0] || ''}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center space-x-1.5">
                                <span>{user.firstname || 'Étudiant'} {user.lastname || 'Anonyme'}</span>
                                {user.role === 'admin' && (
                                  <span className="bg-red-500/15 text-red-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px] font-mono mt-0.5">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Level and School */}
                        <td className="px-6 py-4">
                          <div className="text-slate-200 font-medium">{user.level || 'Non spécifié'}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{user.school || 'Indépendant'}</div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 text-slate-300">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{user.city || 'Non spécifiée'}</span>
                          </div>
                        </td>

                        {/* Documents Count */}
                        <td className="px-6 py-4 text-center font-bold text-blue-400">
                          {userDocs.length} doc{userDocs.length > 1 ? 's' : ''}
                        </td>

                        {/* Quiz attempts */}
                        <td className="px-6 py-4 text-center font-bold text-indigo-400">
                          {userQuizzes.length} quiz
                        </td>

                        {/* Progress Indicators */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2 font-semibold">
                              <span className="text-emerald-400">{userProg.xp || 0} XP</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-300">{userProg.hours_studied || 0}h</span>
                            </div>
                            {userProg.streak > 0 && (
                              <div className="text-amber-500 font-extrabold text-[10px] flex items-center space-x-1">
                                <span>🔥 {userProg.streak} jours de série</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => { playClickSound(); setSelectedUser(user); }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                              title="Voir toutes les informations de consommation"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, `${user.firstname} ${user.lastname}`)}
                              className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-all border border-transparent hover:border-rose-500/10"
                              title="Supprimer définitivement l'utilisateur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal Component showing 100% of information of selected student */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" 
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden z-10 flex flex-col shadow-2xl shadow-black/50"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800/80 bg-slate-950 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-base">
                    {selectedUser.firstname?.[0] || 'U'}{selectedUser.lastname?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {selectedUser.firstname} {selectedUser.lastname}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* 1. General Profile & Study metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ÉTUDES & LOGISTIQUE</span>
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300">Niveau : <strong className="text-white">{selectedUser.level || 'Non spécifié'}</strong></p>
                      <p className="text-slate-300">Établissement : <strong className="text-white">{selectedUser.school || 'Indépendant'}</strong></p>
                      <p className="text-slate-300">Ville : <strong className="text-white">{selectedUser.city || 'Non spécifiée'}</strong></p>
                      <p className="text-slate-300">Objectif d'études : <strong className="text-white">{selectedUser.goal || 'Non configuré'}</strong></p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">PROGRESSION STATISTIQUES</span>
                    <div className="space-y-1 text-xs">
                      {(() => {
                        const prog = data.progress.find(p => p.user_id === selectedUser.id) || { xp: 0, hours_studied: 0, streak: 0, level: 'Débutant' };
                        return (
                          <>
                            <p className="text-slate-300">Points d'XP accumulés : <strong className="text-emerald-400">{prog.xp} XP</strong></p>
                            <p className="text-slate-300">Grade actuel : <strong className="text-indigo-400">{prog.level || 'Étoile montante'}</strong></p>
                            <p className="text-slate-300">Heures de révision : <strong className="text-white">{prog.hours_studied} h</strong></p>
                            <p className="text-slate-300">Série active de jours : <strong className="text-amber-500">🔥 {prog.streak} jours</strong></p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">PARAMÈTRES COMPTE</span>
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300">Effets Sonores : <strong className={selectedUser.sound_enabled ? 'text-emerald-400' : 'text-slate-500'}>{selectedUser.sound_enabled ? 'Activés' : 'Désactivés'}</strong></p>
                      <p className="text-slate-300">Notifications Push : <strong className={selectedUser.notifications_enabled ? 'text-emerald-400' : 'text-slate-500'}>{selectedUser.notifications_enabled ? 'Activées' : 'Désactivées'}</strong></p>
                      <p className="text-slate-300">Thème Visuel Dark : <strong className={selectedUser.dark_mode ? 'text-blue-400' : 'text-slate-500'}>{selectedUser.dark_mode ? 'Activé' : 'Désactivé'}</strong></p>
                      <p className="text-slate-300">Date d'inscription : <strong className="text-slate-200">{new Date(selectedUser.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                    </div>
                  </div>
                </div>

                {/* 2. List of Uploaded Documents (Consumption) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Documents importés par l'étudiant ({data.documents.filter(d => d.user_id === selectedUser.id).length})</span>
                  </h4>

                  {data.documents.filter(d => d.user_id === selectedUser.id).length === 0 ? (
                    <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800/40 text-xs text-slate-500 font-semibold">
                      Aucun document importé.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.documents.filter(d => d.user_id === selectedUser.id).map((doc) => (
                        <div key={doc.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 flex justify-between items-center text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-white truncate max-w-[220px]" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-slate-400 text-[10px] font-mono">
                              Taille: {doc.size} | Type: {doc.type} | Créé: {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            doc.status === 'ready' || doc.status === 'analyzed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. List of Generated Quizzes & Scores */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Quiz générés & Taux de réussite ({data.quizzes.filter(q => q.user_id === selectedUser.id).length})</span>
                  </h4>

                  {data.quizzes.filter(q => q.user_id === selectedUser.id).length === 0 ? (
                    <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800/40 text-xs text-slate-500 font-semibold">
                      Aucun quiz généré.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.quizzes.filter(q => q.user_id === selectedUser.id).map((quiz) => {
                        const scorePct = quiz.score !== null ? (quiz.score / quiz.max_score) * 100 : null;
                        return (
                          <div key={quiz.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 flex justify-between items-center text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-white truncate max-w-[220px]">{quiz.title}</p>
                              <p className="text-slate-400 text-[10px] font-mono">
                                Date: {new Date(quiz.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              {quiz.completed ? (
                                <div className="space-y-0.5">
                                  <span className={`font-extrabold text-sm ${scorePct && scorePct >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {quiz.score}/{quiz.max_score}
                                  </span>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase">{scorePct?.toFixed(0)}% de réussite</p>
                                </div>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                  En cours
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Generated Flashcards */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-amber-500" />
                    <span>Flashcards de l'étudiant ({data.flashcards.filter(f => f.user_id === selectedUser.id).length})</span>
                  </h4>

                  {data.flashcards.filter(f => f.user_id === selectedUser.id).length === 0 ? (
                    <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800/40 text-xs text-slate-500 font-semibold">
                      Aucune flashcard créée.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.flashcards.filter(f => f.user_id === selectedUser.id).map((fc) => (
                        <div key={fc.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 text-xs grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/20">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">RECTO</span>
                            <p className="text-slate-200 mt-1">{fc.front}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/20">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">VERSO</span>
                            <p className="text-slate-300 mt-1">{fc.back}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-800/80 bg-slate-950 flex justify-between items-center">
                <button
                  onClick={() => handleDeleteUser(selectedUser.id, `${selectedUser.firstname} ${selectedUser.lastname}`)}
                  className="px-4 py-2 bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer définitivement ce compte</span>
                </button>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
