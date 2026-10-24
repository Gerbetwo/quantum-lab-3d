import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen, DEVELOPERS } from '../TitleScreen';

describe('TitleScreen Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders hero title, subtitle, and CTA button', () => {
    const handleEnter = vi.fn();
    render(<TitleScreen onEnter={handleEnter} />);

    expect(screen.getByTestId('title-screen')).toBeInTheDocument();
    expect(screen.getAllByText('QuantumLab 3D').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Interactive Quantum Mechanics & Kinematics Simulator')
    ).toBeInTheDocument();

    const enterButton = screen.getByTestId('enter-workspace-button');
    expect(enterButton).toBeInTheDocument();
    expect(enterButton).toHaveTextContent('Enter Workspace');

    fireEvent.click(enterButton);
    expect(handleEnter).toHaveBeenCalledTimes(1);
  });

  it('renders developer showcase cards with avatar, handle, link, and security attributes', () => {
    render(<TitleScreen onEnter={vi.fn()} />);

    expect(screen.getByText('Created by')).toBeInTheDocument();

    for (const dev of DEVELOPERS) {
      const card = screen.getByTestId(`dev-card-${dev.name.toLowerCase()}`);
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('href', dev.github);
      expect(card).toHaveAttribute('target', '_blank');
      expect(card).toHaveAttribute('rel', 'noopener noreferrer');

      // Verify name and handle
      expect(card).toHaveTextContent(dev.name);
      expect(card).toHaveTextContent(dev.handle);

      // Verify avatar image
      const avatar = screen.getByAltText(dev.name);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', dev.avatar);
    }
  });

  it('handles image error gracefully by hiding broken image', () => {
    render(<TitleScreen onEnter={vi.fn()} />);

    const gerbetwoAvatar = screen.getByAltText('Gerbetwo');
    fireEvent.error(gerbetwoAvatar);
    expect(gerbetwoAvatar).toHaveStyle('display: none');
  });

  it('supports interactive language toggling on the title screen', () => {
    render(<TitleScreen onEnter={vi.fn()} />);

    const langToggle = screen.getByTestId('title-language-toggle');
    expect(langToggle).toHaveTextContent('EN');

    // Toggle to Spanish
    fireEvent.click(langToggle);
    expect(langToggle).toHaveTextContent('ES');
    expect(
      screen.getByText('Simulador Interactivo de Mecánica Cuántica y Cinemática')
    ).toBeInTheDocument();
    expect(screen.getByText('Iniciar Experimento')).toBeInTheDocument();
    expect(screen.getByText('Desarrollado por')).toBeInTheDocument();

    // Toggle back to English
    fireEvent.click(langToggle);
    expect(langToggle).toHaveTextContent('EN');
    expect(
      screen.getByText('Interactive Quantum Mechanics & Kinematics Simulator')
    ).toBeInTheDocument();
    expect(screen.getByText('Enter Workspace')).toBeInTheDocument();
  });

  it('supports interactive theme toggling on the title screen', () => {
    render(<TitleScreen onEnter={vi.fn()} />);

    const themeToggle = screen.getByTestId('title-theme-toggle');
    expect(themeToggle).toBeInTheDocument();

    fireEvent.click(themeToggle);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);

    fireEvent.click(themeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
