'use client';

import { useVectorKeyboardControl, type UseVectorKeyboardControlOptions } from './useVectorKeyboardControl';
import type { QubitState } from '@/core/qubitMath';

export type UseBlochKeyboardOptions = UseVectorKeyboardControlOptions;

export function useBlochKeyboard(
  stateRef: React.RefObject<QubitState | null>,
  options: UseBlochKeyboardOptions = {}
) {
  return useVectorKeyboardControl(stateRef, options);
}

export default useBlochKeyboard;
