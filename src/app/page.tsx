'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Mission1Superposition from '@/components/missions/Mission1Superposition';
import Mission2Entanglement from '@/components/missions/Mission2Entanglement';
import Mission3Decoherence from '@/components/missions/Mission3Decoherence';
import Mission4Applications from '@/components/missions/Mission4Applications';
import CelebrationModal from '@/components/CelebrationModal';
import { getStoredProgress, updateStoredMetrics } from '@/lib/cookies';
import { playButtonClick } from '@/lib/sound';
import { Check } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [completedMissions, setCompletedMissions] = useState<number[]>([0]);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);

  useEffect(() => {
    setCompletedMissions(getStoredProgress());
  }, []);

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });

      updateStoredMetrics((prev) => ({
        ...prev,
        totalTimeSeconds: prev.totalTimeSeconds + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleTabChange = (index: number) => {
    playButtonClick();
    setActiveTab(index);
  };

  const handleMissionComplete = (fromIndex: number) => {
    if (!completedMissions.includes(fromIndex + 1)) {
      setCompletedMissions((prev) => [...prev, fromIndex + 1]);
    }
    setActiveTab(fromIndex + 1);
  };

  const tabs = [
    { title: 'Tarea 1: Superposición', desc: 'Bit vs. Qubit y Colapso' },
    { title: 'Tarea 2: Entrelazamiento', desc: 'Alice & Bob a Distancia' },
    { title: 'Tarea 3: Cero Absoluto', desc: 'Criogenia y Decoherencia' },
    { title: 'Tarea 4: Aplicaciones', desc: 'Moléculas y Criptografía' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#070913] text-slate-100 min-h-screen">
      {/* Top Header */}
      <Header
        timeLeft={timeLeft}
        isRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
      />

      {/* Progress Track */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className="h-full bg-cyan transition-all duration-300 shadow-sm shadow-cyan/50"
          style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }}
        />
      </div>

      {/* Main Content Area: Fluid Full Width, Zero Side Gutters */}
      <main className="w-full px-3 sm:px-6 py-2 flex-1 flex flex-col gap-3">
        {/* Sleek Floating Task Selector Dock */}
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl sm:rounded-full backdrop-blur-md shadow-xl">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === idx;
              const isDone = completedMissions.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleTabChange(idx)}
                  className={`px-4 py-2 rounded-xl sm:rounded-full text-xs font-orbitron transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-cyan text-slate-950 font-bold shadow-md shadow-cyan/25'
                      : isDone
                      ? 'text-emerald-400 hover:bg-slate-900/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <span>{tab.title}</span>
                  {isDone && !isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Task Canvas Area: Full fluid container */}
        <div className="flex-1 w-full flex flex-col">
          {activeTab === 0 && (
            <Mission1Superposition onComplete={() => handleMissionComplete(0)} />
          )}
          {activeTab === 1 && (
            <Mission2Entanglement
              onComplete={() => handleMissionComplete(1)}
              onBack={() => setActiveTab(0)}
            />
          )}
          {activeTab === 2 && (
            <Mission3Decoherence
              onComplete={() => handleMissionComplete(2)}
              onBack={() => setActiveTab(1)}
            />
          )}
          {activeTab === 3 && (
            <Mission4Applications
              onFinishAll={() => setIsCelebrationOpen(true)}
              onBack={() => setActiveTab(2)}
            />
          )}
        </div>
      </main>

      {/* Completion Modal */}
      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
      />
    </div>
  );
}
