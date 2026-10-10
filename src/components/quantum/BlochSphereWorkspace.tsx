import React, { useMemo } from 'react';
import { useQuantumStore } from '../../store/useQuantumStore';

export const BlochSphereWorkspace: React.FC = () => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const vectorCoords = useMemo(() => {
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    return {
      x: x.toFixed(3),
      y: y.toFixed(3),
      z: z.toFixed(3),
    };
  }, [theta, phi]);

  return (
    <div className="relative w-full h-95 rounded-xl border border-cyan-500/20 bg-background/80 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10 w-48 h-48 rounded-full border-2 border-dashed border-cyan-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.15)]">
        <div className="absolute w-48 h-20 rounded-full border border-purple-500/30 transform -rotate-12" />
        <span className="absolute -top-6 text-xs hud-font-mono text-accent">|0⟩ (Z+)</span>
        <span className="absolute -bottom-6 text-xs hud-font-mono text-purple-300">|1⟩ (Z-)</span>
        
        <div 
          className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_12px_#00F0FF] transition-all duration-300"
          style={{
            transform: `translate(${parseFloat(vectorCoords.x) * 60}px, ${-parseFloat(vectorCoords.z) * 60}px)`,
          }}
        />
      </div>

      <div className="mt-8 flex gap-4 text-xs hud-font-mono text-muted-foreground bg-background/80 px-4 py-2 rounded-md border border-border">
        <div><span className="text-accent font-bold">X:</span> {vectorCoords.x}</div>
        <div><span className="text-purple-400 font-bold">Y:</span> {vectorCoords.y}</div>
        <div><span className="text-amber-400 font-bold">Z:</span> {vectorCoords.z}</div>
        {lastOutcome !== null && (
          <div className="border-l border-border pl-3">
            <span className="text-emerald-400 font-bold">COLLAPSED:</span> |{lastOutcome}⟩
          </div>
        )}
      </div>
    </div>
  );
};
