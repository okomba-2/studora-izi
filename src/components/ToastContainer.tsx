/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { toast } from '../utils/toast';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      // Automatically remove toast after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      id="toast-notifications-portal"
      className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          let icon = <Info className="w-5 h-5 text-blue-500" />;
          let bgColor = 'bg-white border-blue-100';
          let textColor = 'text-slate-800';
          let progressColor = 'bg-blue-500';

          if (t.type === 'success') {
            icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
            bgColor = 'bg-white border-emerald-100';
            progressColor = 'bg-emerald-500';
          } else if (t.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
            bgColor = 'bg-white border-amber-100';
            progressColor = 'bg-amber-500';
          }

          return (
            <motion.div
              key={t.id}
              id={`toast-item-${t.id}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`p-4 rounded-xl border shadow-lg flex items-start space-x-3 pointer-events-auto relative overflow-hidden ${bgColor} ${textColor}`}
            >
              {/* Progress indicator bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.75 ${progressColor}`}
              />

              <div className="shrink-0 mt-0.5">{icon}</div>
              
              <div className="flex-1 text-sm font-semibold leading-relaxed text-left">
                {t.message}
              </div>

              <button
                id={`btn-close-toast-${t.id}`}
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-0.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
