import {
  type Base4Digit,
  DEFAULT_PARAMS,
  type OctaveParams,
  type Order,
} from "@/lib/octave";
import { create } from "zustand";

/**
 * The shared octave state. Every page reads the same parameters, so
 * changing the calculator on any page updates that page's visualization
 * and the current parameters stay visible everywhere.
 */
interface OctaveState {
  params: OctaveParams;
  setIntegralLevel: (level: number) => void;
  setDigit: (digit: Base4Digit) => void;
  setK: (k: number) => void;
  setL: (L: number) => void;
  setZoom: (zoom: number) => void;
  setOrder: (order: Order) => void;
  reset: () => void;
}

export const useOctaveStore = create<OctaveState>((set) => ({
  params: DEFAULT_PARAMS,
  setIntegralLevel: (integralLevel) =>
    set((state) => ({ params: { ...state.params, integralLevel } })),
  setDigit: (digit) => set((state) => ({ params: { ...state.params, digit } })),
  setK: (k) => set((state) => ({ params: { ...state.params, k } })),
  setL: (L) => set((state) => ({ params: { ...state.params, L } })),
  setZoom: (zoom) => set((state) => ({ params: { ...state.params, zoom } })),
  setOrder: (order) => set((state) => ({ params: { ...state.params, order } })),
  reset: () => set({ params: DEFAULT_PARAMS }),
}));
