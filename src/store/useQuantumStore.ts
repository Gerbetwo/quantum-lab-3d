import { create } from 'zustand';

export interface QuantumStoreState {
  temperatureK: number;
  theta: number;
  phi: number;
  setTemperature: (tempK: number) => void;
  setStateCoords: (coords: { theta: number; phi: number }) => void;
}

export const useQuantumStore = create<QuantumStoreState>((set) => ({
  temperatureK: 0.015,
  theta: 0,
  phi: 0,
  setTemperature: (tempK: number) => set({ temperatureK: tempK }),
  setStateCoords: (coords) => set(coords),
}));

export default useQuantumStore;
