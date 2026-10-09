import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { MissionShell } from '@/features/missions/components/MissionShell';
import { MISSIONS } from '@/features/missions/config/missions';

describe('Suite de Integración Parametrizada de Misiones', () => {
  test.each(MISSIONS)(
    'renderiza correctamente la misión $id ($title)',
    (mission) => {
      render(<MissionShell mission={mission} />);
      expect(screen.getByText(new RegExp(mission.title, 'i'))).toBeInTheDocument();
    }
  );
});
