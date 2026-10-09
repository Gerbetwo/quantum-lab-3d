import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { RangeControl } from '@/components/ui/RangeControl';

describe('RangeControl Component', () => {
  test('muestra la etiqueta y el valor actual con unidad', () => {
    render(
      <RangeControl
        label="Ángulo Theta"
        value={1.57}
        min={0}
        max={3.14}
        unit="rad"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Ángulo Theta')).toBeInTheDocument();
    expect(screen.getByText('1.57 rad')).toBeInTheDocument();
  });
});
