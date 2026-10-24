'use client';

import React, { useState, useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import {
  isAudioEnabled,
  setAudioEnabled,
  getVolume,
  setVolume,
} from '@/lib/audio/soundEngine';
import { useTranslation } from '@/hooks/useTranslation';

export interface VolumeControlProps {
  className?: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean>(() => isAudioEnabled());
  const [volumeLevel, setVolumeLevel] = useState<number>(() => getVolume());
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleMute = () => {
    const next = !enabled;
    setAudioEnabled(next);
    setEnabled(next);
    if (next && volumeLevel === 0) {
      setVolume(0.8);
      setVolumeLevel(0.8);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = parseFloat(e.target.value);
    setVolume(nextVal);
    setVolumeLevel(nextVal);
    if (!enabled && nextVal > 0) {
      setAudioEnabled(true);
      setEnabled(true);
    } else if (enabled && nextVal === 0) {
      setAudioEnabled(false);
      setEnabled(false);
    }
  };

  const effectiveVolume = enabled ? volumeLevel : 0;
  const percentage = Math.round(effectiveVolume * 100);

  const getIcon = () => {
    if (!enabled || effectiveVolume === 0) {
      return <VolumeX className="w-4 h-4 text-muted-foreground" />;
    }
    if (effectiveVolume < 0.5) {
      return <Volume1 className="w-4 h-4 text-primary" />;
    }
    return <Volume2 className="w-4 h-4 text-primary" />;
  };

  return (
    <div
      ref={containerRef}
      data-testid="volume-control"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-center ${className}`.trim()}
    >
      {/* Hover popover volume slider */}
      {isHovered && (
        <div
          data-testid="volume-slider-popover"
          className="absolute bottom-full mb-2 right-0 p-2.5 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl flex flex-col items-center gap-1.5 min-w-30 pointer-events-auto z-40 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between w-full text-[10px] font-mono text-muted-foreground">
            <span>{t('header.toggle_audio')}</span>
            <span className="font-bold text-primary">{percentage}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={effectiveVolume}
            onChange={handleVolumeChange}
            data-testid="volume-slider"
            aria-label={t('header.toggle_audio')}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-1.5 bg-secondary rounded-lg accent-primary cursor-pointer"
          />
        </div>
      )}

      {/* Mute/Unmute Toggle Button */}
      <button
        type="button"
        onClick={handleToggleMute}
        data-testid="volume-toggle-button"
        aria-label={enabled ? t('header.mute_audio') : t('header.unmute_audio')}
        title={enabled ? `${t('header.mute_audio')} (${percentage}%)` : t('header.unmute_audio')}
        className="p-1.5 rounded-lg text-xs font-mono border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
      >
        {getIcon()}
      </button>
    </div>
  );
};

export default VolumeControl;
