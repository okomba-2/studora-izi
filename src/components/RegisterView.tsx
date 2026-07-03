/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authService } from '../lib/supabase';
import { playClickSound, playSuccessSound, playFailureSound } from '../utils/audio';
import { toast } from '../utils/toast';

// Define the validation schema with Zod
const registerSchema = z.object({
  firstname: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastname: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().min(1, "L'e-mail est requis").email("Format d'e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions d'utilisation"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterViewProps {
  onNavigate: (view: string) => void;
  onRegisterSuccess: () => void;
}

export default function RegisterView({ onNavigate, onRegisterSuccess }: RegisterViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email Verification OTP State
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Decrement resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    playClickSound();
    try {
      await authService.signUp(data.email, data.password, data.firstname, data.lastname);
      playSuccessSound();
      setRegisteredEmail(data.email);
      
      if (!authService.isMock) {
        // Real Supabase requires email verification
        setIsVerifying(true);
        toast.show('Compte créé ! Veuillez saisir le code de confirmation reçu par e-mail.', 'info');
      } else {
        toast.show('Compte créé avec succès ! Étape d’onboarding.', 'success');
        onRegisterSuccess();
      }
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || "Une erreur est survenue lors de l'inscription.", 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.show('Veuillez saisir le code de validation.', 'warning');
      return;
    }
    
    setIsOtpLoading(true);
    playClickSound();
    try {
      await authService.verifyOtp(registeredEmail, otpCode.trim());
      playSuccessSound();
      toast.show('Votre compte a été validé ! Étape d’onboarding.', 'success');
      onRegisterSuccess();
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || "Le code saisi est invalide ou a expiré.", 'warning');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    playClickSound();
    try {
      await authService.resendOtp(registeredEmail);
      playSuccessSound();
      toast.show('Un nouveau code de validation a été envoyé par email.', 'success');
      setResendTimer(60);
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || 'Impossible de renvoyer le code pour le moment.', 'warning');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    playClickSound();
    try {
      await authService.signInWithGoogle();
      playSuccessSound();
      toast.show('Connexion avec Google réussie !', 'success');
      onRegisterSuccess();
    } catch (err: any) {
      playFailureSound();
      toast.show(err.message || 'La connexion via Google a échoué.', 'warning');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-16 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
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

        {/* Card */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 backdrop-blur-md relative overflow-hidden">
          {/* Accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

          {isVerifying ? (
            <div className="text-center py-4">
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Vérifier votre e-mail
              </h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Un code de confirmation a été envoyé à <strong className="text-slate-800">{registeredEmail}</strong>. Veuillez le saisir ci-dessous.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-5 mt-8">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="otp-code" className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">
                    Code de confirmation (6 chiffres)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="otp-code"
                      type="text"
                      placeholder="Ex: 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/85 rounded-xl text-slate-950 placeholder:text-slate-400 text-sm font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center tracking-[0.25em] text-lg font-bold"
                    />
                  </div>
                </div>

                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={isOtpLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/75 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  {isOtpLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Valider et continuer</span>
                  )}
                </button>
              </form>

              <div className="mt-8 flex flex-col items-center space-y-4 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors cursor-pointer"
                >
                  {resendTimer > 0 ? `Renvoyer le code dans ${resendTimer}s` : "Renvoyer le code par e-mail"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsVerifying(false);
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à l'inscription</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 id="register-title" className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  Créer votre compte
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                  Commencez à réviser intelligemment dès aujourd'hui.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Grid for First name and Last name */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Prénom */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="firstname" className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">
                      Prénom
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="firstname"
                        type="text"
                        placeholder="Jean"
                        {...register('firstname')}
                        className={`w-full pl-8.5 pr-3 py-2.5 bg-slate-50 border rounded-xl text-slate-950 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                          errors.firstname ? 'border-rose-300 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/85'
                        }`}
                      />
                    </div>
                    {errors.firstname && (
                      <p className="text-rose-500 text-[10px] font-semibold mt-1 pl-1">{errors.firstname.message}</p>
                    )}
                  </div>

                  {/* Nom */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="lastname" className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">
                      Nom
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="lastname"
                        type="text"
                        placeholder="Dupont"
                        {...register('lastname')}
                        className={`w-full pl-8.5 pr-3 py-2.5 bg-slate-50 border rounded-xl text-slate-950 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                          errors.lastname ? 'border-rose-300 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/85'
                        }`}
                      />
                    </div>
                    {errors.lastname && (
                      <p className="text-rose-500 text-[10px] font-semibold mt-1 pl-1">{errors.lastname.message}</p>
                    )}
                  </div>
                </div>

                {/* Email input */}
                <div className="space-y-1 text-left">
                  <label htmlFor="register-email" className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="register-email"
                      type="email"
                      placeholder="exemple@studora.fr"
                      {...register('email')}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-950 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                        errors.email ? 'border-rose-300 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/85'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-rose-500 text-[10px] font-semibold mt-1 pl-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Password input */}
                <div className="space-y-1 text-left">
                  <label htmlFor="register-password" className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-slate-950 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                        errors.password ? 'border-rose-300 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/85'
                      }`}
                    />
                    <button
                      type="button"
                      id="btn-register-toggle-password"
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
                    <p className="text-rose-500 text-[10px] font-semibold mt-1 pl-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Password Confirmation */}
                <div className="space-y-1 text-left">
                  <label htmlFor="confirmPassword" className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-slate-950 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all ${
                        errors.confirmPassword ? 'border-rose-300 ring-rose-500/10 focus:border-rose-500' : 'border-slate-200/85'
                      }`}
                    />
                    <button
                      type="button"
                      id="btn-register-toggle-confirm"
                      onClick={() => {
                        playClickSound();
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-rose-500 text-[10px] font-semibold mt-1 pl-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Terms of Service checkbox */}
                <div className="flex flex-col text-left py-1">
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                    <input
                      id="accept-terms-checkbox"
                      type="checkbox"
                      {...register('acceptTerms')}
                      className="w-4.5 h-4.5 rounded-md mt-0.5 border-slate-200 text-blue-600 focus:ring-blue-500/20 focus:ring-2 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-500 leading-relaxed">
                      J'accepte les conditions d'utilisation et la politique de confidentialité de Studora.
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-rose-500 text-[10px] font-semibold mt-1 pl-1">{errors.acceptTerms.message}</p>
                  )}
                </div>

                {/* Register button */}
                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/75 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Créer mon compte</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-3 font-semibold text-slate-400 tracking-wider">Ou continuer avec</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                id="btn-register-google"
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

              {/* Navigation to Login */}
              <div className="text-center mt-6 pt-5 border-t border-slate-50">
                <span className="text-slate-500 text-xs font-semibold">Déjà un compte ? </span>
                <button
                  id="btn-go-to-login"
                  onClick={() => {
                    playClickSound();
                    onNavigate('login');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Se connecter
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
