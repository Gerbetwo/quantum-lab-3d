'use client';

import React from 'react';

interface Props {
  header?: React.ReactNode;
  viewport?: React.ReactNode;
  circuitBar?: React.ReactNode;
  children?: React.ReactNode;
}

export default function LeanLabLayout({ viewport, children }: Props) {

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main data-testid="lean-lab-viewport" className="flex-1 flex items-top justify-center p-4">
        <div className="w-full">{children || viewport}</div>
      </main>
    </div>
  );
}
