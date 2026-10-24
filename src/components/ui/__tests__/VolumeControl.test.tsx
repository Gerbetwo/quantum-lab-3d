import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VolumeControl } from '../VolumeControl';
import * as soundEngineModule from '@/lib/audio/soundEngine';

describe('VolumeControl Component', () => {
  beforeEach(() => {
    soundEngineModule.setAudioEnabled(true);
    soundEngineModule.setVolume(0.8);
  });

  it('renders volume button and toggles mute state on click', () => {
    render(<VolumeControl />);

    const button = screen.getByTestId('volume-toggle-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Mute audio');

    // Click to mute
    fireEvent.click(button);
    expect(soundEngineModule.isAudioEnabled()).toBe(false);
    expect(button).toHaveAttribute('aria-label', 'Unmute audio');

    // Click to unmute
    fireEvent.click(button);
    expect(soundEngineModule.isAudioEnabled()).toBe(true);
    expect(button).toHaveAttribute('aria-label', 'Mute audio');
  });

  it('reveals volume slider popover on hover and updates volume on change', () => {
    render(<VolumeControl />);

    const container = screen.getByTestId('volume-control');
    expect(screen.queryByTestId('volume-slider-popover')).not.toBeInTheDocument();

    // Hover container
    fireEvent.mouseEnter(container);
    expect(screen.getByTestId('volume-slider-popover')).toBeInTheDocument();

    const slider = screen.getByTestId('volume-slider');
    expect(slider).toBeInTheDocument();

    // Change volume
    fireEvent.change(slider, { target: { value: '0.4' } });
    expect(soundEngineModule.getVolume()).toBe(0.4);

    // Leave container
    fireEvent.mouseLeave(container);
    expect(screen.queryByTestId('volume-slider-popover')).not.toBeInTheDocument();
  });

  it('unmutes audio when volume slider is dragged above zero while muted', () => {
    soundEngineModule.setAudioEnabled(false);
    render(<VolumeControl />);

    const container = screen.getByTestId('volume-control');
    fireEvent.mouseEnter(container);

    const slider = screen.getByTestId('volume-slider');
    fireEvent.change(slider, { target: { value: '0.6' } });

    expect(soundEngineModule.isAudioEnabled()).toBe(true);
    expect(soundEngineModule.getVolume()).toBe(0.6);
  });
});
