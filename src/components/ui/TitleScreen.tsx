'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { ArrowRight, ExternalLink, Sun, Moon, Globe, Atom } from 'lucide-react';

export interface DeveloperInfo {
  name: string;
  handle: string;
  github: string;
  avatar: string;
}

export const DEVELOPERS: DeveloperInfo[] = [
  {
    name: 'Gerbetwo',
    handle: '@Gerbetwo',
    github: 'https://github.com/Gerbetwo',
    avatar: 'https://github.com/Gerbetwo.png',
  },
  {
    name: 'kriv-bit',
    handle: '@kriv-bit',
    github: 'https://github.com/kriv-bit',
    avatar: 'https://github.com/kriv-bit.png',
  },
];

export interface TitleScreenProps {
  onEnter: () => void;
  className?: string;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onEnter,
  className = '',
}) => {
  const { t, locale, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      data-testid="title-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-y-auto bg-background/70 backdrop-blur-md text-foreground transition-all duration-300 ${className}`.trim()}
    >
      {/* Top Bar HUD: Emblem & Version */}
      <div className="w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card/80 backdrop-blur-md shadow-sm">
          <Atom className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase">
            {t('landing.title')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card/80 backdrop-blur-md text-[11px] font-mono text-muted-foreground">
          <span>{'v0.3.0'}</span>
        </div>
      </div>

      {/* Hero Content Section */}
      <div className="w-full max-w-2xl my-auto py-8 flex flex-col items-center text-center space-y-6 sm:space-y-8">
        {/* Glassmorphic Main Hero Card */}
        <div className="w-full p-6 sm:p-10 rounded-2xl border border-border/80 bg-card/85 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Badge & Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-mono font-black tracking-tight text-foreground">
              <span className="text-primary">{t('landing.title')}</span>
            </h1>
            <p className="text-sm sm:text-base font-mono text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onEnter}
              data-testid="enter-workspace-button"
              className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-mono text-sm font-bold tracking-wider uppercase border border-primary bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <span>{t('landing.enter_workspace')}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Developer Showcase Section */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                {t('landing.developers_title')}
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {DEVELOPERS.map((dev) => (
                <a
                  key={dev.handle}
                  href={dev.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`dev-card-${dev.name.toLowerCase()}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/50 transition-all duration-200 group cursor-pointer text-left shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external developer GitHub profile avatar */}
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border border-border/80 object-cover shrink-0 group-hover:border-primary transition-colors"
                    onError={(e) => {
                      // Fallback in case of network issue
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {dev.name}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate">
                      {dev.handle}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: System Controls (Theme & Language) */}
      <div className="w-full max-w-4xl flex items-center justify-end pb-2">
        <div className="bg-card/85 backdrop-blur-md border border-border shadow-lg p-1.5 rounded-xl flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLanguage}
            data-testid="title-language-toggle"
            aria-label={t('header.toggle_language')}
            title={t('header.toggle_language')}
            className="px-2 py-1 rounded-lg text-xs font-mono font-bold border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{locale === 'en' ? 'EN' : 'ES'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            data-testid="title-theme-toggle"
            aria-label={t('header.toggle_theme')}
            title={
              theme === 'dark'
                ? t('header.switch_to_light')
                : t('header.switch_to_dark')
            }
            className="p-1.5 rounded-lg text-xs font-mono border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-warning" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
