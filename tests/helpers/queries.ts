import { screen } from '@testing-library/react';

/** Locate the step-indicator tab by 1-based step number. */
export const goToStep = (n: number) =>
  screen.getByRole('tab', {
    name: new RegExp('^Ir al paso ' + n + '\\b', 'i'),
  });

/** Return all step tabs. */
export const getStepTabs = () => screen.getAllByRole('tab');
