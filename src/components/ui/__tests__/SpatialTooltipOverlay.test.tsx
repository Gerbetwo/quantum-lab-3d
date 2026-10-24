import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';
import { SpatialTooltipOverlay, project3DTo2D } from '../SpatialTooltipOverlay';
import { useSpatialTelemetryBridge } from '@/hooks/useSpatialTelemetryBridge';

describe('SpatialTooltipOverlay', () => {
  beforeEach(() => {
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it('projects 3D world vector to 2D pixel coordinates using camera matrix', () => {
    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    // Center of view (0, 0, 0) projects to (width/2, height/2)
    const projected = project3DTo2D(new THREE.Vector3(0, 0, 0), camera, 800, 600);
    expect(projected.isVisible).toBe(true);
    expect(projected.x).toBeCloseTo(400, 1);
    expect(projected.y).toBeCloseTo(300, 1);
  });

  it('renders spatial tooltip when hovered via useSpatialTelemetryBridge', () => {
    useSpatialTelemetryBridge.getState().onPointerOver('state-vector');

    render(
      <SpatialTooltipOverlay
        spatialId="state-vector"
        position={new THREE.Vector3(0, 1, 0)}
      />
    );

    expect(screen.getByTestId('spatial-tooltip-overlay')).toBeInTheDocument();
    expect(screen.getByText('Quantum State Vector')).toBeInTheDocument();
  });

  it('renders custom children content when visible', () => {
    render(
      <SpatialTooltipOverlay
        position={new THREE.Vector3(0, 0, 0)}
        visible={true}
      >
        <span data-testid="custom-tooltip-text">Custom Tooltip Info</span>
      </SpatialTooltipOverlay>
    );

    expect(screen.getByTestId('custom-tooltip-text')).toBeInTheDocument();
  });

  it('renders real-time coordinates overlay badge anchored at arrow tip', () => {
    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    useSpatialTelemetryBridge.getState().setCamera(camera);
    useSpatialTelemetryBridge.getState().setVectorTip(new THREE.Vector3(0, 1.2, 0), {
      theta: Math.PI / 2,
      phi: 0,
    });

    render(
      <SpatialTooltipOverlay
        spatialId="state-vector"
        showCoordinates={true}
      />
    );

    expect(screen.getByTestId('vector-tip-badge')).toBeInTheDocument();
    expect(screen.getByText(/θ:\s*90°,\s*φ:\s*0°/)).toBeInTheDocument();
  });

  it('renders localized spatial tooltip in Spanish when locale is set', () => {
    localStorage.setItem('ql-lang', 'es');
    useSpatialTelemetryBridge.getState().onPointerOver('state-vector');

    render(
      <SpatialTooltipOverlay
        spatialId="state-vector"
        position={new THREE.Vector3(0, 1, 0)}
      />
    );

    expect(screen.getByTestId('spatial-tooltip-overlay')).toBeInTheDocument();
    expect(screen.getByText('Vector de estado cuántico')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Vector unitario de estado puro sobre la superficie de la esfera de Bloch'
      )
    ).toBeInTheDocument();
  });
});
