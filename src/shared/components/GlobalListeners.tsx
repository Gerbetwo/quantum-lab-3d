'use client';

import { useEffect, useState } from 'react';
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

export function GlobalListeners() {
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  useEffect(() => {
    // Unlock Web Audio API upon first user interaction
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

    // Evaluate mission completion status from browser storage
    const alreadyCelebrated = localStorage.getItem('quantum_lab_celebration_shown') === 'true';
    if (!alreadyCelebrated) {
      try {
        const completedMissionsStr = localStorage.getItem('quantum_lab_completed_missions');
        const completed: string[] = completedMissionsStr ? JSON.parse(completedMissionsStr) : [];

        const allSevenComplete = CANONICAL_MISSIONS.every((id) => {
          const inArray = completed.includes(id);
          const byKey =
            localStorage.getItem(`mission_completed_${id}`) === 'true' ||
            localStorage.getItem(`quantum-lab-mission-${id}-completed`) === 'true';
          return inArray || byKey;
        });

        if (allSevenComplete) {
          // Schedule state update in the microtask queue to avoid synchronous cascading renders
          queueMicrotask(() => {
            setIsCelebrationOpen(true);
          });
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
    localStorage.setItem('quantum_lab_celebration_shown', 'true');
  };

  return <CelebrationModal isOpen={isCelebrationOpen} onClose={handleCloseCelebration} />;
}

export default GlobalListeners;