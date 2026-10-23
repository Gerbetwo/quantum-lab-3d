'use client';

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { QuantumObjective } from '@/lib/quantum/objectivesConfig';
import { playCompletionTriad } from '@/lib/audio/soundEngine';
import { useTranslation } from '@/hooks/useTranslation';
import { Target, CheckCircle2 } from 'lucide-react';

export interface TargetGoalCardProps {
  objective?: QuantumObjective;
  isCompleted?: boolean;
  progressText?: string;
  className?: string;
}

/**
 * TargetGoalCard:
 * Real-time objective card embedded in Tier 1 HUD.
 * Tracks completion criteria and triggers celebratory audio upon achievement.
 */
export const TargetGoalCard: React.FC<TargetGoalCardProps> = ({
  objective,
  isCompleted = false,
  progressText,
  className = '',
}) => {
  const { t } = useTranslation();
  const wasCompletedRef = useRef(isCompleted);

  useEffect(() => {
    if (isCompleted && !wasCompletedRef.current) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.2 },
        colors: ['#00f0ff', '#10b981', '#a855f7'],
      });
      playCompletionTriad();
    }
    wasCompletedRef.current = isCompleted;
  }, [isCompleted]);

  if (!objective) {
    return null;
  }

  const title = t(objective.titleKey);
  const criteria = objective.criteriaText;

  return (
    <div
      data-testid="target-goal-card"
      data-completed={isCompleted ? 'true' : 'false'}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all backdrop-blur-md select-none ${
        isCompleted
          ? 'bg-success/10 border-success/40 text-foreground shadow-sm'
          : 'bg-card/90 border-border text-foreground shadow-sm'
      } ${className}`.trim()}
    >
      <div className="shrink-0 flex items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-success animate-pulse" />
        ) : (
          <Target className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground">
            {title}
          </span>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
              isCompleted
                ? 'bg-success/20 text-success'
                : 'bg-secondary text-primary'
            }`}
          >
            {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
        </div>
        <p className="text-xs font-mono text-foreground truncate max-w-xs sm:max-w-md">
          {criteria}
        </p>
      </div>

      {progressText && (
        <span className="ml-auto text-[11px] font-mono font-semibold text-muted-foreground whitespace-nowrap pl-2 border-l border-border">
          {progressText}
        </span>
      )}
    </div>
  );
};

export default TargetGoalCard;
