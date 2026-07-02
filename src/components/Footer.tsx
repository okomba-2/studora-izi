/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent } from 'react';
import { GraduationCap, Facebook, Instagram, Github } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { toast } from '../utils/toast';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: MouseEvent, label: string) => {
    e.preventDefault();
    playClickSound();
    toast.show(`Lien "${label}" bientôt fonctionnel pour la version officielle !`, 'info');
  };

  return (
    <footer id="footer-container" className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-slate-800">
          
          {/* Brand Presentation Column (6 cols) */}
          <div className="md:col-span-6 space-y-6 text-left">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5.5 h-5.5 text-white" />
              </div>
              <span className="font-sans text-2xl font-extrabold tracking-tight text-white">
                Studora
              </span>
            </div>
            
            <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
              Studora est la plateforme de productivité et de réussite académique moderne conçue pour simplifier la révision des élèves, étudiants et candidats aux examens nationaux.
            </p>
          </div>

          {/* Quick Links Column (3 cols) */}
          <div className="md:col-span-3 text-left space-y-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Studora</h4>
            <ul className="space-y-2.5">
              {['Confidentialité', 'Conditions', 'Contact'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    id={`footer-link-${link.toLowerCase()}`}
                    onClick={(e) => handleLinkClick(e, link)}
                    className="text-sm font-semibold hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Network Icons Column (3 cols) */}
          <div className="md:col-span-3 text-left space-y-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Suivez-nous</h4>
            <div className="flex items-center space-x-4">
              <a
                href="#facebook"
                id="social-facebook"
                aria-label="Facebook Studora"
                onClick={(e) => handleLinkClick(e, 'Facebook')}
                className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 hover:border-blue-500 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#instagram"
                id="social-instagram"
                aria-label="Instagram Studora"
                onClick={(e) => handleLinkClick(e, 'Instagram')}
                className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 hover:border-pink-500 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#tiktok"
                id="social-tiktok"
                aria-label="TikTok Studora"
                onClick={(e) => handleLinkClick(e, 'TikTok')}
                className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 hover:border-cyan-400 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer text-slate-400 hover:text-white"
              >
                {/* Custom Tiktok SVG to strictly follow instructions for custom icons */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.51-.15-.11-.29-.24-.42-.37-.06 1.14-.03 2.28-.04 3.42-.1 4.79-3.41 9.13-8.17 9.91-4.05.77-8.38-1.56-9.74-5.46-1.53-4.14.28-9.2 4.41-10.66 1.4-.52 2.92-.61 4.39-.37v4.16c-1.12-.39-2.39-.23-3.37.45-.92.61-1.45 1.68-1.41 2.77.01 1.76 1.48 3.25 3.24 3.21 1.63-.03 2.97-1.32 3.05-2.95V0h.41-.01z"/>
                </svg>
              </a>
              <a
                href="#github"
                id="social-github"
                aria-label="GitHub Studora"
                onClick={(e) => handleLinkClick(e, 'GitHub')}
                className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 hover:border-indigo-400 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        {/* Copyright and Legal statement row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-slate-500 gap-4">
          <p id="copyright-text">
            © {currentYear} Studora. Tous droits réservés.
          </p>
          <p className="italic">
            Fièrement propulsé pour la réussite de la nouvelle génération.
          </p>
        </div>

      </div>
    </footer>
  );
}
