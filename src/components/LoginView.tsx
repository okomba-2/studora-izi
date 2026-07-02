/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { GraduationCap, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { authService, isMock } from '../lib/supabase';
import { playClickSound, playSuccessSound, playFailureSound } from '../utils/audio';
import { toast } from '../utils/toast';

// Define the validation schema with Zod
const loginSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis").email("Format d'e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginViewProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: () => void;
}

export default function LoginView({ onNavigate, onLoginSuccess }: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Initialize React Hook Form with Zod schema resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    playClickSound();
    try {
      await authService.signIn(data.email, data.password);
      playSuccessSound();
      toast.show('Connexion réussie ! Bienvenue sur Studora.', 'success');
      onLoginSuccess();
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || 'Une erreur est survenue lors de la connexion.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    playClickSound();
    try {
      await authService.signInWithGoogle();
      playSuccessSound();
      toast.show('Connexion avec Google réussie !', 'success');
      onLoginSuccess();
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || 'La connexion via Google a échoué.', 'warning');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-16 relative overflow-hidden">
      {/* Decorative luxury backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Brand Logo & Back to Home */}
        <div className="text-center mb-8">
          <button
            onClick={() => {
              playClickSound();
              onNavigate('landing');
            }}
            className="inline-flex items-center space-x-2 text-blue-600 font-bold text-2xl hover:opacity-90 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="tracking-tight">Studora</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 backdrop-blur-md relative overflow-hidden">
          {/* Subtle light bar accent at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

          <div className="mb-8 text-center">
            <h2 id="login-title" className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Bienvenue sur Studora
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Connectez-vous pour continuer vos révisions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email input */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700 tracking-wider uppercase block">
                Adresse e-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="exemple@studora.fr"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                    errors.email ? 'border-rose-300 ring-rose-500/10 focus:ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/80'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 text-xs font-medium mt-1 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700 tracking-wider uppercase block">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    toast.show('Réinitialisation par e-mail bientôt disponible.', 'info');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                    errors.password ? 'border-rose-300 ring-rose-500/10 focus:ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/80'
                  }`}
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => {
                    playClickSound();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs font-medium mt-1 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center justify-between text-left">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  id="remember-me-checkbox"
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4.5 h-4.5 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500/20 focus:ring-2 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-600">Se souvenir de moi</span>
              </label>
            </div>

            {/* Login button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/75 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 font-semibold text-slate-400 tracking-wider">Ou continuer avec</span>
            </div>
          </div>

          {/* Social Sign in */}
          <button
            id="btn-login-google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center space-x-3 text-slate-700 text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Continuer avec Google</span>
          </button>

          {/* Navigation to sign up */}
          <div className="text-center mt-8 pt-6 border-t border-slate-50">
            <span className="text-slate-500 text-sm">Pas encore de compte ? </span>
            <button
              id="btn-go-to-register"
              onClick={() => {
                playClickSound();
                onNavigate('register');
              }}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Créer un compte
            </button>
          </div>
        </div>

        {/* Informative info badge when mock */}
        {isMock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-amber-50 border border-amber-200/60 rounded-xl text-left"
          >
            <p className="text-xs text-amber-800 leading-relaxed">
              💡 <strong>Note de prévisualisation :</strong> Supabase n'est pas configuré. L'authentification tourne en mode simulation locale sécurisée. Vos données de test seront conservées dans votre navigateur.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
