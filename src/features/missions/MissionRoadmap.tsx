'use client';

import React from 'react';
import Link from 'next/link';
import { useQuantumStore } from '@/store/useQuantumStore';
import { MISSION_CONFIGS, TOTAL_MISSIONS, isMissionUnlocked } from './missionRegistry';
import { CheckCircle2, PlayCircle, Lock, ArrowRight, Sparkles, Beaker } from 'lucide-react';

export function MissionRoadmap() {
  const completedMissions = useQuantumStore((s) => s.completedMissions);
  const isSandboxUnlocked = useQuantumStore((s) => s.isSandboxUnlocked);
  const jumpToMission = useQuantumStore((s) => s.jumpToMission);

  const completedCount = completedMissions.length;
  const progressPercent = Math.round((completedCount / TOTAL_MISSIONS) * 100);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Roadmap Progression Header */}
      <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan" />
            <span className="text-xs font-mono font-semibold text-cyan uppercase tracking-wider">
              Course Progression Track
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground mt-1">
            Quantum Foundations to Advanced Algorithms
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete all 7 interactive missions to unlock the unconstrained Quantum Sandbox Lab.
          </p>
        </div>

        <div className="w-full md:w-64 flex flex-col gap-1.5 shrink-0">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">Missions Mastered</span>
            <span className="text-cyan font-bold">{completedCount} / {TOTAL_MISSIONS} ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden border border-edge">
            <div
              className="h-full bg-gradient-to-r from-cyan to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7 Core Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MISSION_CONFIGS.map((mission) => {
          const isDone = completedMissions.includes(mission.index);
          const isAvailable = isMissionUnlocked(mission.index, completedMissions);

          return (
            <Link
              key={mission.id}
              href={`/missions/${mission.id}`}
              onClick={() => jumpToMission(mission.id)}
              className={`group p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-200 ${
                isDone
                  ? 'bg-card/70 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-card/90 shadow-sm'
                  : isAvailable
                  ? 'bg-card/60 border-cyan/30 hover:border-cyan hover:bg-card/80 hover:shadow-[0_0_20px_rgba(0,243,255,0.12)]'
                  : 'bg-surface-2/40 border-edge/60 hover:border-edge opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-3 border border-edge text-cyan">
                    Level {mission.order}
                  </span>
                  {isDone ? (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Mastered
                    </span>
                  ) : isAvailable ? (
                    <span className="text-[11px] font-mono text-cyan bg-cyan/10 border border-cyan/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-muted-foreground bg-surface-3 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Free Jump
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-foreground mt-3 group-hover:text-cyan transition-colors">
                  {mission.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              <div className="pt-3 border-t border-edge/80 flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="text-[11px] truncate max-w-[170px]">
                  {mission.learningObjective.slice(0, 32)}...
                </span>
                <span className="text-cyan flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}

        {/* Milestone Reward Sandbox Card */}
        <Link
          href="/sandbox"
          className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-200 ${
            isSandboxUnlocked
              ? 'bg-gradient-to-br from-card/80 to-purple-950/20 border-purple-500/40 hover:border-purple-400 shadow-md'
              : 'bg-surface-2/30 border-edge/60 hover:border-edge opacity-80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-3 border border-edge text-purple-400">
                Sandbox Lab
              </span>
              {isSandboxUnlocked ? (
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/40 border border-purple-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Unlocked
                </span>
              ) : (
                <span className="text-[11px] font-mono text-muted-foreground bg-surface-3 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Complete All
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground mt-3 flex items-center gap-1.5">
              <Beaker className="w-4 h-4 text-purple-400" /> Quantum Sandbox Lab
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Open laboratory workspace for arbitrary state preparation, thermal decoherence sweeps, and unitary experiments.
            </p>
          </div>

          <div className="pt-3 border-t border-edge/80 flex items-center justify-between text-xs font-mono">
            <span className="text-[11px] text-muted-foreground">Unconstrained Lab</span>
            <span className="text-purple-400 font-semibold flex items-center gap-1">
              {isSandboxUnlocked ? 'Open Lab →' : 'Preview →'}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
