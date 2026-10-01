'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getOrCreateUserId, updateStoredMetrics } from '@/lib/cookies';
import { playChimeSuccess } from '@/lib/sound';

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

      // Launch multi-burst confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#a855f7', '#10b981', '#ffffff'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const userId = getOrCreateUserId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-[#0b0f1d] border border-cyan/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan/20 text-center flex flex-col items-center">
        {/* Glow Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan via-purple-600 to-emerald-400 p-0.5 shadow-xl shadow-cyan/30 mb-4 animate-bounce">
          <div className="w-full h-full bg-[#070913] rounded-2xl flex items-center justify-center">
            <Trophy className="w-8 h-8 text-cyan" />
          </div>
        </div>

        <h3 className="font-orbitron font-bold text-2xl text-white tracking-wide">
          ¡MAESTRÍA CUÁNTICA LOGRADA!
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Has experimentado y deducido en 3D los principios de la mecánica cuántica aplicada.
        </p>

        {/* Student Session Card */}
        <div className="w-full my-5 bg-black/50 border border-slate-800 rounded-2xl p-4 text-left flex flex-col gap-2 font-mono text-xs">
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">ID DE SESIÓN REGISTRADO:</span>
            <span className="text-cyan font-bold">{userId}</span>
          </div>
          <div className="text-[11px] text-slate-300 flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan shrink-0" />
              <span><strong>Superposición:</strong> Moneda en el aire; colapsa a 0 o 1 al medir.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span><strong>Entrelazamiento:</strong> Correlación instantánea sin importar la distancia.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span><strong>Decoherencia & Frío:</strong> Cero absoluto para eliminar ruido ambiental.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><strong>Aplicaciones:</strong> Simulación molecular (medicinas), optimización y criptografía.</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          {formUrl ? (
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan via-teal-400 to-emerald-400 text-black font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan/25 hover:brightness-110 transition-all"
            >
              Ir a la Postprueba Oficial <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan to-emerald-400 text-black font-orbitron font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan/25 hover:brightness-110 transition-all"
            >
              Cerrar y Revisar Módulos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
