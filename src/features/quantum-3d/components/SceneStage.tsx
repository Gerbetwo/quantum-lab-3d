
/**
 * Contenedor visual SceneStage para escenas 3D
 */
import React from 'react';
import { SceneFallback } from '../scenes/SceneFallback';

interface SceneStageProps {
  children: React.ReactNode;
  label: string;
  description?: string;
  hasWebGL?: boolean;
}

export function SceneStage({ children, label, description, hasWebGL = true }: SceneStageProps) {
  return (
    <div className="flex flex-col bg-background/80 border border-border rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-accent tracking-wide uppercase">{label}</h3>
        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">WebGL 3D Active</span>
      </div>
      {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
      <div className="relative w-full aspect-square max-h-90 bg-background/50 rounded-xl overflow-hidden border border-border/80">
        {hasWebGL ? children : <SceneFallback />}
      </div>
    </div>
  );
}
