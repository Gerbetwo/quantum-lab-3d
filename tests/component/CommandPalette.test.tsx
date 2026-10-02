import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import CommandPalette, { type Command } from '@/components/CommandPalette';

function makeCommands(handlers = { a: vi.fn(), b: vi.fn(), c: vi.fn() }): Command[] {
  return [
    { id: 'a', label: 'Ir a Tarea 1', keywords: ['mision', 'superposicion'], action: handlers.a },
    { id: 'b', label: 'Reiniciar laboratorio', keywords: ['restart', 'reset'], action: handlers.b },
    { id: 'c', label: 'Pantalla completa', keywords: ['fullscreen'], action: handlers.c },
  ];
}

describe('Phase 3 - CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette isOpen={false} onClose={vi.fn()} commands={makeCommands()} />);
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('renders dialog with combobox and all options when open', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /buscar comandos/i })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('autofocuses the search input', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    // Focus is deferred via setTimeout(0); jsdom runs it synchronously enough for this assertion.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(screen.getByRole('combobox')).toHaveFocus();
        resolve();
      }, 5);
    });
  });

  it('filters options by query', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'restart' } });
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(1);
    expect(opts[0]).toHaveTextContent(/Reiniciar/i);
  });

  it('shows empty state when no matches', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText(/Sin coincidencias/i)).toBeInTheDocument();
  });

  it('executes command on click', () => {
    const handlers = { a: vi.fn(), b: vi.fn(), c: vi.fn() };
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands(handlers)} />);
    fireEvent.click(screen.getByRole('option', { name: /Reiniciar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(handlers.b).toHaveBeenCalledTimes(1);
  });

  it('executes command on Enter', () => {
    const handlers = { a: vi.fn(), b: vi.fn(), c: vi.fn() };
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands(handlers)} />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(handlers.a).toHaveBeenCalledTimes(1);
  });

  it('navigates with ArrowDown/ArrowUp and wraps', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={makeCommands()} />);
    const input = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    fireEvent.keyDown(screen.getByTestId('command-palette'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking the backdrop', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={makeCommands()} />);
    fireEvent.mouseDown(screen.getByTestId('command-palette'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
