'use client';

import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation, DICTIONARY } from '@/lib/i18n';
import {
  CORE_MISSION_IDS,
  getMissionById,
  isMissionId,
  getMissionIndex,
  type MissionId,
} from '@/features/missions/missionRegistry';
import {
  Sliders,
  Sparkles,
  CheckCircle2,
  Globe,
  ArrowLeft,
  RotateCcw,
  Moon,
  Sun,
} from 'lucide-react';

export interface MissionHeaderProps {
  missionId?: string;
  className?: string;
}

export function MissionHeader({ missionId: propMissionId, className = '' }: MissionHeaderProps) {
  const { t, language, setLanguage } = useTranslation();
  const appViewState = useQuantumStore((s) => s.appViewState);
  const isSandbox = appViewState === 'SANDBOX';

  const currentMissionId = useQuantumStore((s) => s.currentMissionId ?? 'superposition');
  const rawId = propMissionId || currentMissionId;
  const activeMissionId: MissionId = isMissionId(rawId) ? rawId : 'superposition';
  const mission = getMissionById(activeMissionId);
  const missionIndex = getMissionIndex(activeMissionId);

  const completedMissions = useQuantumStore((s) => s.completedMissions);
  const markMissionCompleted = useQuantumStore((s) => s.markMissionCompleted);
  const togglePauseMenu = useQuantumStore((s) => s.togglePauseMenu);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);
  const selectMission = useQuantumStore((s) => s.selectMission);
  const resetState = useQuantumStore((s) => s.resetState);
  const theme = useQuantumStore((s) => s.theme);
  const toggleTheme = useQuantumStore((s) => s.toggleTheme);

  const isCompleted = completedMissions.includes(missionIndex);

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const missionI18n = DICTIONARY[language]?.missions?.[activeMissionId];
  const missionTitle = isSandbox
    ? t('mission_header.sandbox_title')
    : (missionI18n?.title ?? mission?.title ?? activeMissionId);

  const objectiveText = missionI18n?.learningObjective ??
    missionI18n?.description ??
    mission?.learningObjective ??
    mission?.description ??
    'Explore quantum state kinematics';

  return (
    <header
      data-testid="mission-header"
      className={`fixed top-0 left-0 right-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur-md px-4 flex items-center justify-between gap-3 pointer-events-auto select-none ${className}`.trim()}
    >
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setAppViewState('CAMPAIGN_SELECT')}
          title={t('mission_header.back_to_missions')}
          data-testid="back-to-missions"
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-semibold">
            {isSandbox ? '[LAB]' : `[M.${missionIndex >= 0 ? missionIndex : 0}]`}
          </span>
          <span
            data-testid="mission-title"
            className="text-xs font-mono font-bold text-quantum-cyan uppercase tracking-wide truncate max-w-35 sm:max-w-55"
          >
            {missionTitle}
          </span>
        </div>

        {isSandbox ? (
          <span className="text-[10px] font-mono hud-badge-purple px-2 py-0.5 rounded flex items-center gap-1 font-bold">
            <Sparkles className="w-3 h-3 text-quantum-purple" /> {t('mission_header.sandbox_badge')}
          </span>
        ) : isCompleted ? (
          <span className="text-[10px] font-mono hud-badge-emerald px-2 py-0.5 rounded flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3 text-success" /> DONE
          </span>
        ) : (
          <button
            type="button"
            onClick={() => markMissionCompleted(missionIndex)}
            data-testid="mark-completed-button"
            className="text-[10px] font-mono hud-badge-cyan px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-90 transition-all font-bold cursor-pointer"
          >
            <Sparkles className="w-3 h-3" /> {t('mission_header.mark_complete')}
          </button>
        )}
      </div>

      <div
        data-testid="step-objective-ticker"
        className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-2 overflow-hidden px-3 py-1 bg-surface-2 border border-border text-xs font-mono"
      >
        <span className="text-[10px] font-bold text-quantum-cyan shrink-0 tracking-wider">
          OBJECTIVE:
        </span>
        {isSandbox ? (
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="truncate text-muted-foreground text-[11px] shrink-0" title={t('mission_header.quick_jump_tooltip')}>
              {t('mission_header.quick_jump')}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {CORE_MISSION_IDS.map((id, idx) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectMission(id)}
                  data-testid={`mission-jump-${id}`}
                  title={t('mission_header.jump_tooltip', { index: idx })}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 hover:bg-surface-2 hover:text-quantum-cyan text-muted-foreground border border-border transition-colors cursor-pointer"
                >
                  M{idx}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="truncate text-foreground text-[11px]" title={objectiveText}>
            {objectiveText}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => resetState()}
          data-testid="reset-state-button"
          title={t('mission_header.reset_tooltip')}
          className="px-2 py-1 rounded text-xs font-mono font-medium border border-border bg-surface-2 text-foreground hover:text-quantum-cyan hover:bg-surface-3 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-warning" />
          <span className="hidden sm:inline font-bold">{t('mission_header.reset_to_zero')}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t('mission_header.toggle_theme')}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          className="p-1.5 rounded text-xs font-mono border border-border bg-surface-2 text-foreground hover:bg-surface-3 transition-colors flex items-center justify-center cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-warning" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-quantum-cyan" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleLanguage}
          data-testid="language-switch"
          aria-label={t('mission_header.toggle_language')}
          title={`Switch language (Current: ${language.toUpperCase()})`}
          className="px-2.5 py-1 rounded text-xs font-mono font-bold border border-border bg-surface-2 text-foreground hover:bg-surface-3 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={language === 'es' ? 'text-quantum-cyan font-extrabold' : 'opacity-50'}>ES</span>
          <span className="opacity-30">/</span>
          <span className={language === 'en' ? 'text-quantum-cyan font-extrabold' : 'opacity-50'}>EN</span>
        </button>

        <button
          type="button"
          onClick={() => togglePauseMenu()}
          data-testid="esc-pause-button"
          aria-label={t('mission_header.pause_tooltip')}
          title={t('mission_header.pause_tooltip')}
          className="px-2.5 py-1 rounded text-xs font-mono font-medium border border-border bg-surface-2 text-foreground hover:text-quantum-cyan hover:bg-surface-3 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-warning" />
          <span className="hidden sm:inline font-bold">{t('mission_header.pause')}</span>
          <kbd className="text-[10px] px-1 py-0.2 bg-surface-3 rounded border border-border text-muted-foreground">
            ESC
          </kbd>
        </button>
      </div>
    </header>
  );
}

export default MissionHeader;
