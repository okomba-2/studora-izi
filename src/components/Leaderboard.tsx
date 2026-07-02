/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Award, Zap, Trophy, Users, ShieldAlert } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function Leaderboard() {
  const topStudents = [
    {
      rank: 1,
      badge: '🥇',
      name: 'Amadou Diallo',
      class: 'Terminale S1',
      score: 2850,
      avatarColor: 'from-amber-400 to-yellow-500',
      isCurrentUser: false,
    },
    {
      rank: 2,
      badge: '🥈',
      name: 'Chloé Mensah',
      class: 'Première Générale',
      score: 2410,
      avatarColor: 'from-slate-300 to-slate-400',
      isCurrentUser: false,
    },
    {
      rank: 3,
      badge: '🥉',
      name: 'Kenji Tanaka',
      class: 'Terminale S2',
      score: 2120,
      avatarColor: 'from-amber-600 to-amber-700',
      isCurrentUser: false,
    },
    {
      rank: 4,
      badge: '4',
      name: 'Vous (Jean Dupont)',
      class: 'Première Générale',
      score: 1450,
      avatarColor: 'from-blue-500 to-indigo-600',
      isCurrentUser: true,
    },
    {
      rank: 5,
      badge: '5',
      name: 'Sofia Benali',
      class: 'Seconde A',
      score: 1390,
      avatarColor: 'from-teal-400 to-emerald-500',
      isCurrentUser: false,
    }
  ];

  return (
    <section id="leaderboard" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <Trophy className="w-3.5 h-3.5 text-blue-600" />
            <span>Émulation saine</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Classement hebdomadaire
          </h2>
          <p className="text-lg text-slate-500 mt-4 font-medium">
            Réviser est un sport d'équipe. Relevez le défi, gagnez des points d'expérience (XP) à chaque quiz réussi et hissez-vous au sommet.
          </p>
        </div>

        {/* Master Leaderboard Card */}
        <motion.div
          id="leaderboard-master-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto bg-white border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Card Header Banner */}
          <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold flex items-center space-x-2">
                <Award className="w-5.5 h-5.5 text-yellow-400" />
                <span>Top Étudiants Studora</span>
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Mis à jour toutes les heures • Session en cours
              </p>
            </div>
            
            <div className="flex items-center space-x-2.5 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs border border-white/5 text-xs font-semibold text-slate-200">
              <Users className="w-4 h-4 text-blue-400" />
              <span>124 participants actifs</span>
            </div>
          </div>

          {/* List of leaderboard rows */}
          <div className="p-4 md:p-6 space-y-2.5">
            {topStudents.map((student, idx) => {
              const isPodium = student.rank <= 3;
              const isCurrentUser = student.isCurrentUser;

              return (
                <motion.div
                  key={student.rank}
                  id={`leaderboard-row-${student.rank}`}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  onClick={() => playClickSound()}
                  className={`p-4 rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                    isCurrentUser
                      ? 'bg-blue-50/75 border-blue-200 shadow-3xs'
                      : 'bg-white border-slate-200/50 hover:bg-slate-50'
                  }`}
                >
                  {/* Left Column: Rank and Profile */}
                  <div className="flex items-center space-x-4">
                    {/* Rank Indicator */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {isPodium ? (
                        <span className="text-2xl select-none leading-none">{student.badge}</span>
                      ) : (
                        <span className="font-mono font-extrabold text-sm text-slate-400">{student.rank}</span>
                      )}
                    </div>

                    {/* Avatar Initials */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${student.avatarColor} text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0`}>
                      {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>

                    {/* Name & Academic Grade */}
                    <div className="text-left">
                      <p className={`text-sm font-extrabold ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                        {student.name}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {student.class}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Score */}
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/40 px-3.5 py-1.5 rounded-lg">
                    <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {student.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">XP</span>
                  </div>

                </motion.div>
              );
            })}
          </div>

          {/* Leaderboard footer note */}
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <p className="text-[11px] font-semibold text-slate-400">
              Répondez juste et vite aux quiz de révision pour accumuler plus de bonus multiplicateurs d'XP !
            </p>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
