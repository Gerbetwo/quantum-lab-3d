'use client';

import { downloadSessionJSON } from '@/lib/export';
import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Award, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getOrCreateUserId, updateStoredMetrics } from '@/lib/cookies';
import { playChimeSuccess } from '@/lib/sound';
import { prefersReducedMotion } from '@/lib/three/createScene';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formUrl?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CelebrationModal({ isOpen, onClose, formUrl }: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    playChimeSuccess();
    updateStoredMetrics((prev) => ({ ...prev, completedAt: new Date().toISOString() }));
    if (!prefersReducedMotion()) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#a855f7', '#10b981', '#ffffff'],
      });
    }
    return () => {
      try { confetti.reset(); } catch {}
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    modal.addEventListener('keydown', onKeyDown);
    return () => {
      modal.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const userId = getOrCreateUserId();
  const titleId = 'celebration-modal-title';

  return (
    <div
      ref={modalRef}
      data-testid="celebration-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative max-w-lg w-full bg-[#0b0f1d] border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan mb-3 shadow-lg shadow-cyan/15">
          <Award className="w-7 h-7 text-cyan" />
        </div>

        <h3 id={titleId} className="font-orbitron font-bold text-xl text-white tracking-wide">
          Entrenamiento Completado
        </h3>
        <p className="text-xs text-slate-300 mt-1 max-w-sm">
          Has interactuado con los 4 conceptos fundamentales de la computación cuántica.
        </p>

        <div className="w-full my-4 bg-slate-950 border border-slate-800 rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2 font-mono">
            <span className="text-slate-400">ID de sesión registrado:</span>
            <span data-testid="celebration-user-id" className="text-cyan font-bold">
              {userId}
            </span>
          </div>
          <div className="flex flex-col gap-2 pt-1 text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
              <span><strong>Superposición:</strong> El qubit existe en 0 y 1 a la vez hasta que la medición fuerza el colapso.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Entrelazamiento:</strong> Correlación instantánea entre estados sin importar la separación espacial.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
              <span><strong>Decoherencia y Cero Absoluto:</strong> Se enfría a ~0.015 K para neutralizar el ruido térmico que destruye el estado cuántico.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Aplicaciones:</strong> Modelado molecular de medicamentos, optimización de redes y criptografía.</span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          {formUrl ? (
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-lg bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20"
            >
              Ir a la Evaluación <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20"
            >
              Cerrar y Revisar Módulos
            </button>
          )}
          
            <button
              onClick={downloadSessionJSON}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-xl border border-cyan-500/30 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Exportar sesión completa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar sesión (JSON)
            </button>
      
        </div>
      </div>
    </div>
  );
}
