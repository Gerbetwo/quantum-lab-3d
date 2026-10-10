'use client';

import React, { useState, useEffect } from 'react';
import CelebrationModal from '@/shared/layout/CelebrationModal';
import { audioEngine } from '@/shared/lib/sound';

const CANONICAL_MISSIONS = [
  'superposition',
  'entanglement',
  'error-correction',
  'gates',
  'decoherence',
  'grover',
  'applications',
];

export interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  [key: string]: unknown;
}

export function AppShell({ children, header, footer, ...props }: AppShellProps) {
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  useEffect(() => {
    // Web Audio API unlock handler for browser interaction policy
    const handleUnlock = () => {
      audioEngine
        .unlock()
        .then(() => {
          window.removeEventListener('pointerdown', handleUnlock);
          window.removeEventListener('keydown', handleUnlock);
        })
        .catch(() => {
          // Handled safely within audioEngine
        });
    };

    window.addEventListener('pointerdown', handleUnlock);
    window.addEventListener('keydown', handleUnlock);

    // Idempotency check: if celebration was already shown/dismissed, do not re-trigger
    const alreadyCelebrated = localStorage.getItem('quantum_lab_celebration_shown') === 'true';
    if (!alreadyCelebrated) {
      try {
        // Check stored completion records for all 7 canonical missions
        const completedMissionsStr = localStorage.getItem('quantum_lab_completed_missions');
        const completed: string[] = completedMissionsStr ? JSON.parse(completedMissionsStr) : [];

        // Ensure all seven canonical IDs are present (preventing partial triggers like missions 1-4)
        const allSevenComplete = CANONICAL_MISSIONS.every((id) => {
          const inArray = completed.includes(id);
          const byKey =
            localStorage.getItem(`mission_completed_${id}`) === 'true' ||
            localStorage.getItem(`quantum-lab-mission-${id}-completed`) === 'true';
          return inArray || byKey;
        });

        if (allSevenComplete) {
          setIsCelebrationOpen(true);
        }
      } catch (error) {
        console.error('Error evaluating mission completion status:', error);
      }
    }

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  const handleCloseCelebration = () => {
    setIsCelebrationOpen(false);
    // Persist idempotency flag so reloads and repeated callbacks never reopen it
    localStorage.setItem('quantum_lab_celebration_shown', 'true');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {header}
      <main className="flex-1 flex flex-col" {...props}>
        {children}
      </main>
      {footer}
      <CelebrationModal isOpen={isCelebrationOpen} onClose={handleCloseCelebration} />
    </div>
  );
}

export default AppShell;