'use client';

import React, { useEffect } from 'react';
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

export default function CelebrationModal({ isOpen, onClose, formUrl }: Props) {
  useEffect(() => {
    if (isOpen) {
      playChimeSuccess();
      updateStoredMetrics((prev) => ({
        ...prev,
        completedAt: new Date().toISOString(),
      }));

      if (!prefersReducedMotion()) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#a855f7', '#10b981', '#ffffff'],
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const userId = getOrCreateUserId();

  return (
    <div data-testid="celebration-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-[#0b0f1d] border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        {/* Badge Icon */}
        <div className="w-14 h-14 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan mb-3 shadow-lg shadow-cyan/15">
          <Award className="w-7 h-7 text-cyan" />
        </div>

        <h3 className="font-orbitron font-bold text-xl text-white tracking-wide">
          Entrenamiento Completado
        </h3>
        <p className="text-xs text-slate-300 mt-1 max-w-sm">
          Has interactuado con los 4 conceptos fundamentales de la computación cuántica.
        </p>

        {/* Summary Card */}
        <div className="w-full my-4 bg-slate-950 border border-slate-800 rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800 pb-2 font-mono">
            <span className="text-slate-400">ID de sesión registrado:</span>
            <span data-testid="celebration-user-id" className="text-cyan font-bold">{userId}</span>
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

        {/* Action Button */}
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
