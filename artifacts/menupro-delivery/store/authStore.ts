import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Customer } from "@/types/api";

interface AuthState {
  token: string | null;
  customer: Customer | null;
  setAuth: (token: string, customer: Customer) => void;
  setCustomer: (customer: Customer) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      setAuth(token, customer) {
        if (typeof window !== "undefined") {
          localStorage.setItem("menupro_token", token);
        }
        set({ token, customer });
      },
      setCustomer(customer) {
        set({ customer });
      },
      logout() {
        if (typeof window !== "undefined") {
          localStorage.removeItem("menupro_token");
        }
        set({ token: null, customer: null });
      },
    }),
    { name: "menupro-auth" }
  )
);
