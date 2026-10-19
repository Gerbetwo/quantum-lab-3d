'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation, DICTIONARY } from '@/lib/i18n';
import { getMissionById, isMissionId, getMissionIndex, type MissionId } from '@/features/missions/missionRegistry';
import { Sliders, Sparkles, CheckCircle2, Globe, ArrowLeft } from 'lucide-react';

export interface MissionHeaderProps {
  missionId?: string;
  className?: string;
}

/**
 * Top Edge Mission Navigation & Status Header (fixed top-0 left-0 right-0 z-20).
 * Displays current mission identifier, step objective ticker, ES/EN switch, and ESC Pause button.
 */
export function MissionHeader({ missionId: propMissionId, className = '' }: MissionHeaderProps) {
  const storeMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const rawId = propMissionId || storeMissionId;
  const activeMissionId: MissionId = isMissionId(rawId) ? rawId : 'superposition';
  const mission = getMissionById(activeMissionId);
  const missionIndex = getMissionIndex(activeMissionId);

  const completedMissions = useQuantumStore((s) => s.completedMissions);
  const markMissionCompleted = useQuantumStore((s) => s.markMissionCompleted);
  const togglePauseMenu = useQuantumStore((s) => s.togglePauseMenu);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);

  const { language, setLanguage } = useTranslation();
  const isCompleted = completedMissions.includes(missionIndex);

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const missionI18n = DICTIONARY[language]?.missions?.[activeMissionId];
  const missionTitle = missionI18n?.title ?? mission?.title ?? activeMissionId;
  const objectiveText = missionI18n?.learningObjective ?? missionI18n?.description ?? mission?.learningObjective ?? mission?.description ?? 'Explore quantum state kinematics';

  return (
    <header
      data-testid="mission-header"
      className={`fixed top-0 left-0 right-0 z-20 h-14 border-b border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-[#0B0E14]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 pointer-events-auto select-none ${className}`.trim()}
    >
      {/* 1. Left: Mission Identifier & Completion status */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setAppViewState('CAMPAIGN_SELECT')}
          title="Return to Mission Select"
          data-testid="back-to-missions"
          className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-semibold">
            [M.{missionIndex >= 0 ? missionIndex : 0}]
          </span>
          <span
            data-testid="mission-title"
            className="text-xs font-mono font-bold text-slate-900 dark:text-cyan-400 uppercase tracking-wide truncate max-w-[140px] sm:max-w-[220px]"
          >
            {missionTitle}
          </span>
        </div>

        {isCompleted ? (
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> DONE
          </span>
        ) : (
          <button
            type="button"
            onClick={() => markMissionCompleted(missionIndex)}
            data-testid="mark-completed-button"
            className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 border border-sky-400/50 dark:border-cyan-500/40 bg-sky-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-sky-100 dark:hover:bg-cyan-900/60 transition-colors font-bold"
          >
            <Sparkles className="w-3 h-3" /> MARK COMPLETE
          </button>
        )}
      </div>

      {/* 2. Center: Step Objective Ticker */}
      <div
        data-testid="step-objective-ticker"
        className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-2 overflow-hidden px-3 py-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-xs font-mono"
      >
        <span className="text-[10px] font-bold text-sky-600 dark:text-cyan-400 shrink-0 tracking-wider">
          OBJECTIVE:
        </span>
        <div className="truncate text-slate-700 dark:text-slate-300 text-[11px]" title={objectiveText}>
          {objectiveText}
        </div>
      </div>

      {/* 3. Right: ES/EN Language Switch & ESC Pause Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleLanguage}
          data-testid="language-switch"
          aria-label="Toggle language between English and Spanish"
          title={`Switch language (Current: ${language.toUpperCase()})`}
          className="px-2.5 py-1 rounded text-xs font-mono font-bold border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className={language === 'es' ? 'text-sky-600 dark:text-cyan-400 font-extrabold' : 'opacity-50'}>ES</span>
          <span className="opacity-30">/</span>
          <span className={language === 'en' ? 'text-sky-600 dark:text-cyan-400 font-extrabold' : 'opacity-50'}>EN</span>
        </button>

        <button
          type="button"
          onClick={() => togglePauseMenu()}
          data-testid="esc-pause-button"
          aria-label="Pause Menu [ESC]"
          title="Pause Menu [ESC]"
          className="px-2.5 py-1 rounded text-xs font-mono font-medium border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 active:scale-95"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline font-bold">PAUSE</span>
          <kbd className="text-[10px] px-1 py-0.2 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
        </button>
      </div>
    </header>
  );
}

export default MissionHeader;
