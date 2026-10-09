'use client';

import React from 'react';

interface MissionShellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mission?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
  children?: React.ReactNode;
}

export function MissionShell({ mission, config, children }: MissionShellProps) {
  const data = mission || config;
  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">{data?.title ?? 'Misión Cuántica'}</h1>
        <p className="text-sm text-slate-400">{data?.description ?? data?.subtitle ?? ''}</p>
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export default MissionShell;
