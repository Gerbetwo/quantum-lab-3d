import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  test('ejecuta onClick cuando es presionado', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Acción</Button>);

    const btn = screen.getByRole('button', { name: /acción/i });
    fireEvent.click(btn);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('respeta el estado disabled', () => {
    render(<Button disabled>Deshabilitado</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
