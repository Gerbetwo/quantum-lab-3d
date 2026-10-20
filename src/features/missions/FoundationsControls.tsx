'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import type { MissionId } from './missionRegistry';

interface FoundationsControlsProps {
  missionId: MissionId;
}

export function FoundationsControls({ missionId }: FoundationsControlsProps) {
  const { t } = useTranslation();
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const setTheta = useQuantumStore((s) => s.setTheta);
  const setPhi = useQuantumStore((s) => s.setPhi);
  const setTemperature = useQuantumStore((s) => s.setTemperature);
  const applyGate = useQuantumStore((s) => s.applyGate);
  const setEntangled = useQuantumStore((s) => s.setEntangled);
  const isEntangled = useQuantumStore((s) => s.isEntangled);

  if (missionId === 'superposition') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-2">
        <span className="text-xs telemetry-mono font-semibold text-quantum-cyan uppercase tracking-wider">
          {t('foundations.superposition_presets')}
        </span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Button
            type="button"
            size="sm"
            variant={theta === 0 ? 'primary' : 'secondary'}
            onClick={() => { setTheta(0); setPhi(0); }}
            className="normal-case telemetry-mono text-xs"
          >
            {t('foundations.ground_state')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={Math.abs(theta - Math.PI) < 0.05 ? 'primary' : 'secondary'}
            onClick={() => { setTheta(Math.PI); setPhi(0); }}
            className="normal-case telemetry-mono text-xs"
          >
            {t('foundations.excited_state')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={Math.abs(theta - Math.PI / 2) < 0.05 && phi === 0 ? 'primary' : 'secondary'}
            onClick={() => { setTheta(Math.PI / 2); setPhi(0); }}
            className="normal-case telemetry-mono text-xs"
          >
            {t('foundations.plus_state')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={Math.abs(theta - Math.PI / 2) < 0.05 && Math.abs(phi - Math.PI) < 0.05 ? 'primary' : 'secondary'}
            onClick={() => { setTheta(Math.PI / 2); setPhi(Math.PI); }}
            className="normal-case telemetry-mono text-xs"
          >
            {t('foundations.minus_state')}
          </Button>
        </div>
      </div>
    );
  }

  if (missionId === 'entanglement') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-2">
        <span className="text-xs telemetry-mono font-semibold text-quantum-purple uppercase tracking-wider">
          {t('foundations.bell_controls')}
        </span>
        <div className="flex gap-2 mt-1">
          <Button
            type="button"
            size="sm"
            variant={isEntangled ? 'primary' : 'secondary'}
            onClick={() => { setEntangled(true); setTheta(Math.PI / 2); }}
            className="flex-1 normal-case telemetry-mono text-xs"
          >
            {t('foundations.create_bell')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => { setEntangled(false); setTheta(0); }}
            className="normal-case telemetry-mono text-xs"
          >
            {t('foundations.separate')}
          </Button>
        </div>
      </div>
    );
  }

  if (missionId === 'decoherence') {
    const temps = [
      { label: t('foundations.preset_15mk'), val: 0.015 },
      { label: t('foundations.preset_4k'), val: 4.0 },
      { label: t('foundations.preset_77k'), val: 77.0 },
      { label: t('foundations.preset_300k'), val: 300.0 },
    ];
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-2">
        <span className="text-xs telemetry-mono font-semibold text-warning uppercase tracking-wider">
          {t('foundations.cryo_temp_title')}
        </span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {temps.map((t) => (
            <Button
              key={t.val}
              type="button"
              size="sm"
              variant={Math.abs(temperatureK - t.val) < 0.001 ? 'primary' : 'secondary'}
              onClick={() => setTemperature(t.val)}
              className="normal-case telemetry-mono text-xs"
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Mission 3: Gates
  const gates = ['H', 'X', 'Y', 'Z', 'S', 'T'] as const;
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-surface-2">
      <span className="text-xs telemetry-mono font-semibold text-quantum-emerald uppercase tracking-wider">
        {t('foundations.gate_palette')}
      </span>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {gates.map((g) => (
          <Button
            key={g}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => applyGate(g)}
            className="normal-case telemetry-mono text-xs font-bold"
          >
            Gate [{g}]
          </Button>
        ))}
      </div>
    </div>
  );
}