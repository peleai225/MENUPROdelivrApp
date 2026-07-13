import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CartState {
  restaurantId: number | null;
  restaurantName: string | null;
  items: CartItem[];
  pendingAdd: {
    restaurantId: number;
    restaurantName: string;
    item: Omit<CartItem, "quantity"> & { quantity?: number };
  } | null;

  addItem: (
    restaurantId: number,
    restaurantName: string,
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => "added" | "confirm_needed";
  confirmSwitch: () => void;
  cancelSwitch: () => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  removeItem: (dishId: number) => void;
  clear: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      pendingAdd: null,

      addItem(restaurantId, restaurantName, item) {
        const state = get();
        if (state.restaurantId !== null && state.restaurantId !== restaurantId && state.items.length > 0) {
          set({ pendingAdd: { restaurantId, restaurantName, item } });
          return "confirm_needed";
        }
        set((s) => {
          const existing = s.items.find((i) => i.dishId === item.dishId);
          const qty = item.quantity ?? 1;
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.dishId === item.dishId ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return {
            restaurantId,
            restaurantName,
            items: [...s.items, { ...item, quantity: qty }],
          };
        });
        return "added";
      },

      confirmSwitch() {
        const { pendingAdd } = get();
        if (!pendingAdd) return;
        const { restaurantId, restaurantName, item } = pendingAdd;
        set({
          restaurantId,
          restaurantName,
          items: [{ ...item, quantity: item.quantity ?? 1 }],
          pendingAdd: null,
        });
      },

      cancelSwitch() {
        set({ pendingAdd: null });
      },

      updateQuantity(dishId, quantity) {
        if (quantity <= 0) {
          get().removeItem(dishId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.dishId === dishId ? { ...i, quantity } : i)),
        }));
      },

      removeItem(dishId) {
        set((s) => {
          const items = s.items.filter((i) => i.dishId !== dishId);
          return {
            items,
            restaurantId: items.length === 0 ? null : s.restaurantId,
            restaurantName: items.length === 0 ? null : s.restaurantName,
          };
        });
      },

      clear() {
        set({ restaurantId: null, restaurantName: null, items: [], pendingAdd: null });
      },

      subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: "menupro-cart" }
  )
);
