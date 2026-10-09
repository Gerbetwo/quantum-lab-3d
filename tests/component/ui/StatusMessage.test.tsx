import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { StatusMessage } from '@/shared/ui/StatusMessage';

describe('StatusMessage Component', () => {
  test('renderiza el mensaje con región accesible', () => {
    render(<StatusMessage variant="success">Operación exitosa</StatusMessage>);

    const region = screen.getByRole('region');
    expect(region).toHaveTextContent('Operación exitosa');
  });
});
