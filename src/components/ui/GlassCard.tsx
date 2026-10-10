import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, badge }) => {
  return (
    <div className={`hud-glass-card p-4 transition-all duration-300 hover:border-cyan-400/50 ${className}`}>
      {(title || badge) && (
        <div className="flex items-center justify-between mb-3 border-b border-cyan-500/10 pb-2">
          {title && <h3 className="text-sm font-semibold tracking-wider text-accent uppercase hud-font-mono">{title}</h3>}
          {badge && <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-accent border border-cyan-800 hud-font-mono">{badge}</span>}
        </div>
      )}
      {children}
    </div>
  );
};
