import { create } from 'zustand';
import type { DeliveryEstimate } from '@/types';

export interface CheckoutAddress {
  label: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  instructions?: string;
}

interface CheckoutState {
  address: CheckoutAddress | null;
  estimate: DeliveryEstimate | null;
  setAddress: (address: CheckoutAddress) => void;
  setEstimate: (estimate: DeliveryEstimate | null) => void;
  reset: () => void;
}

/** Ephemeral (non-persisted) bridge between the cart and checkout screens. */
export const useCheckoutStore = create<CheckoutState>((set) => ({
  address: null,
  estimate: null,
  setAddress: (address) => set({ address }),
  setEstimate: (estimate) => set({ estimate }),
  reset: () => set({ address: null, estimate: null }),
}));
