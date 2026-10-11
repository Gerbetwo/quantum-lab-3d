import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { AppShell } from '@/shared/layout/AppShell';

describe('AppShell Component', () => {
  test('renders header, main content, and footer slots correctly', () => {
    render(
      <AppShell
        header={<header>Header Content</header>}
        footer={<footer>Footer Content</footer>}
      >
        <div>Main Content Area</div>
      </AppShell>
    );

    // Verify main landmark element exists
    const mainEl = screen.getByRole('main');
    expect(mainEl).toBeInTheDocument();

    // Verify slot content rendering
    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Main Content Area')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  test('applies custom className to the shell container', () => {
    const { container } = render(
      <AppShell className="custom-shell-class">
        <div>Content</div>
      </AppShell>
    );

    expect(container.firstChild).toHaveClass('custom-shell-class');
  });
});