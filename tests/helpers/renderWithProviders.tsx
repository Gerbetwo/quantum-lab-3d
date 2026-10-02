import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Uniform render wrapper. Currently a passthrough; reserved for future
 * providers (cookies context, feature flags, i18n, etc.).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, options);
}
