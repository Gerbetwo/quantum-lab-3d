'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Skeleton } from '@/shared/ui/Skeleton';

const LoadingFallback = () => (
  <div className="w-full h-[600px] flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-800/80 p-8">
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-8 w-3/4 bg-slate-800" />
      <Skeleton className="h-4 w-full bg-slate-800/60" />
      <Skeleton className="h-4 w-5/6 bg-slate-800/60" />
      <Skeleton className="h-64 w-full rounded-xl bg-slate-800/40 mt-6" />
    </div>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const missionComponents: Record<string, React.ComponentType<any>> = {
  'superposition': dynamic(() => import('./Mission1Superposition'), {
    ssr: false,
    loading: LoadingFallback,
  }),
  'entanglement': dynamic(() => import('./Mission2Entanglement'), {
    ssr: false,
    loading: LoadingFallback,
  }),
  'decoherence': dynamic(() => import('./Mission3Decoherence'), {
    ssr: false,
    loading: LoadingFallback,
  }),
  'applications': dynamic(() => import('./Mission4Applications'), {
    ssr: false,
    loading: LoadingFallback,
  }),
  'gates': dynamic(() => import('./Mission5Gates'), {
    ssr: false,
    loading: LoadingFallback,
  }),
  'grover': dynamic(() => import('./Mission6Grover'), {
    ssr: false,
    loading: LoadingFallback,
  }),
  'error-correction': dynamic(() => import('./Mission7ErrorCorrection'), {
    ssr: false,
    loading: LoadingFallback,
  }),
};

interface MissionRegistryProps {
  missionId: string;
}

export function MissionRegistry({ missionId }: MissionRegistryProps) {
  const Component = missionComponents[missionId];

  if (!Component) {
    return (
      <div className="p-8 text-center bg-slate-900/80 border border-rose-500/30 rounded-2xl">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Misión No Encontrada</h2>
        <p className="text-sm text-slate-400">
          El identificador de misión <code className="text-amber-300">{missionId}</code> no está registrado.
        </p>
      </div>
    );
  }

  return <Component />;
}
