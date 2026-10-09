import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MissionShell } from '@/features/missions/components/MissionShell';

describe('Mission Component Tests', () => {
  it('renders MissionShell correctly', () => {
    const { container } = render(<MissionShell config={{ id: 'test', title: 'Test', subtitle: 'Test Subtitle', sceneType: 'bloch', steps: [] }} />);
    expect(container).toBeInTheDocument();
  });
});
