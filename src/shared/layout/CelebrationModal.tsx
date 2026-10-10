'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Award, ExternalLink, CheckCircle2 } from 'lucide-react';
import { playChimeSuccess } from '@/shared/lib/sound';
import { prefersReducedMotion } from '@/features/quantum-3d/lib/sceneManager';
import { useSession } from '@/features/session/components/SessionProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formUrl?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CelebrationModal({ isOpen, onClose, formUrl }: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { session } = useSession();

  useEffect(() => {
    if (!isOpen) return;
    playChimeSuccess();
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
  const userId = session.userId;
  const titleId = 'celebration-modal-title';

  return (
    <div
      ref={modalRef}
      data-testid="celebration-modal"
      role="dialog" aria-live="polite"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative max-w-lg w-full bg-[#0b0f1d] border border-border rounded-2xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan mb-3 shadow-lg shadow-cyan/15">
          <Award className="w-7 h-7 text-cyan" />
        </div>

        <h3 id={titleId} className="font-orbitron font-bold text-xl text-white tracking-wide">
          Entrenamiento Completado
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Has completado con éxito las siete misiones del recorrido guiado de computación cuántica.
        </p>

        <div className="w-full my-4 bg-background border border-border rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between border-b border-border pb-2 font-mono">
            <span className="text-muted-foreground">ID de sesión registrado:</span>
            <span data-testid="celebration-user-id" className="text-cyan font-bold">
              {userId}
            </span>
          </div>
          <div className="flex flex-col gap-2 pt-1 text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
              <span><strong>Superposición y Entrelazamiento:</strong> Dominio de los estados base y la correlación cuántica.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Decoherencia y Aplicaciones:</strong> Comprensión del ruido térmico y casos de uso prácticos.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Puertas y Algoritmos Avanzados:</strong> Manipulación directa y ejecución de Grover.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Corrección de Errores:</strong> Protección de estados mediante redundancia en qubits lógicos.</span>
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
        </div>
      </div>
    </div>
  );
}
