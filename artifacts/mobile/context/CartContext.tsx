import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  restaurantId: number | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (
    restaurantId: number,
    restaurantName: string,
    item: Omit<CartItem, 'quantity'> & { quantity?: number },
  ) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  removeItem: (dishId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      addItem: (restaurantId, restaurantName, item) => {
        const state = get();
        if (state.restaurantId !== null && state.restaurantId !== restaurantId && state.items.length > 0) {
          // Caller must clear() and confirm before switching restaurants. See addToCartWithConfirm.
          return;
        }
        const existing = state.items.find((i) => i.dishId === item.dishId);
        if (existing) {
          set({
            restaurantId,
            restaurantName,
            items: state.items.map((i) =>
              i.dishId === item.dishId ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i,
            ),
          });
        } else {
          set({
            restaurantId,
            restaurantName,
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
          });
        }
      },
      updateQuantity: (dishId, quantity) => {
        const state = get();
        if (quantity <= 0) {
          const items = state.items.filter((i) => i.dishId !== dishId);
          set({
            items,
            restaurantId: items.length ? state.restaurantId : null,
            restaurantName: items.length ? state.restaurantName : null,
          });
          return;
        }
        set({ items: state.items.map((i) => (i.dishId === dishId ? { ...i, quantity } : i)) });
      },
      removeItem: (dishId) => {
        const state = get();
        const items = state.items.filter((i) => i.dishId !== dishId);
        set({
          items,
          restaurantId: items.length ? state.restaurantId : null,
          restaurantName: items.length ? state.restaurantName : null,
        });
      },
      clear: () => set({ restaurantId: null, restaurantName: null, items: [] }),
    }),
    {
      name: 'menupro-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useCartSubtotal() {
  return useCartStore((state) => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
}

export function useCartItemCount() {
  return useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));
}

export function useDishQuantity(dishId: number) {
  return useCartStore((state) => state.items.find((i) => i.dishId === dishId)?.quantity ?? 0);
}

/**
 * Adds an item to the cart. If the cart already holds items from a different
 * restaurant, asks for confirmation before clearing it — the cart must never
 * be wiped silently.
 */
export function addToCartWithConfirm(
  restaurantId: number,
  restaurantName: string,
  item: Omit<CartItem, 'quantity'> & { quantity?: number },
) {
  const state = useCartStore.getState();
  if (state.restaurantId !== null && state.restaurantId !== restaurantId && state.items.length > 0) {
    Alert.alert(
      'Vider le panier ?',
      `Votre panier contient déjà des articles de ${state.restaurantName}. Voulez-vous le vider pour commander chez ${restaurantName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider et continuer',
          style: 'destructive',
          onPress: () => {
            useCartStore.getState().clear();
            useCartStore.getState().addItem(restaurantId, restaurantName, item);
          },
        },
      ],
    );
    return;
  }
  state.addItem(restaurantId, restaurantName, item);
}
