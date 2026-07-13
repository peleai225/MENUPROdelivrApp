import { api } from "./axios";
import type {
  AuthResponse,
  Customer,
  Restaurant,
  Menu,
  DeliveryEstimate,
  Address,
  Order,
  CreateOrderResponse,
  TrackingResponse,
  PaymentStatus,
} from "@/types/api";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { name: string; phone: string; password: string; email?: string; city?: string }) =>
    api.post<AuthResponse>("/client/auth/register", body).then((r) => r.data),

  login: (body: { phone: string; password: string }) =>
    api.post<AuthResponse>("/client/auth/login", body).then((r) => r.data),

  me: () => api.get<Customer>("/client/auth/me").then((r) => r.data),

  logout: () => api.post("/client/auth/logout"),

  updateProfile: (body: { name?: string; email?: string; city?: string }) =>
    api.patch<{ customer: Customer }>("/client/auth/profile", body).then((r) => r.data),
};

// ── Restaurants ───────────────────────────────────────────────────────────────
export const restaurantsApi = {
  list: (params?: { city?: string; category?: string; lat?: number; lng?: number; open_now?: boolean }) =>
    api.get<Restaurant[]>("/restaurants", { params }).then((r) => r.data),

  nearby: (params: { lat: number; lng: number; radius_km?: number }) =>
    api.get<Restaurant[]>("/restaurants/nearby", { params }).then((r) => r.data),

  get: (id: number) => api.get<Restaurant>(`/restaurants/${id}`).then((r) => r.data),

  menu: (id: number) => api.get<Menu>(`/restaurants/${id}/menu`).then((r) => r.data),

  deliveryEstimate: (id: number, params: { lat: number; lng: number }) =>
    api.get<DeliveryEstimate>(`/restaurants/${id}/delivery-estimate`, { params }).then((r) => r.data),
};

// ── Addresses ─────────────────────────────────────────────────────────────────
export const addressesApi = {
  list: () => api.get<Address[]>("/client/addresses").then((r) => r.data),

  create: (body: Omit<Address, "id">) =>
    api.post<Address>("/client/addresses", body).then((r) => r.data),

  update: (id: number, body: Partial<Omit<Address, "id">>) =>
    api.patch<Address>(`/client/addresses/${id}`, body).then((r) => r.data),

  delete: (id: number) => api.delete(`/client/addresses/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (body: {
    restaurant_id: number;
    items: { dish_id: number; quantity: number; notes?: string }[];
    delivery_lat: number;
    delivery_lng: number;
    delivery_address: string;
    delivery_city: string;
    delivery_instructions?: string;
    payment_method: "wave";
  }) => api.post<CreateOrderResponse>("/client/orders", body).then((r) => r.data),

  history: (page = 1) =>
    api.get<{ data: Order[]; current_page: number; last_page: number }>("/client/orders/history", { params: { page } }).then((r) => r.data),

  track: (token: string) =>
    api.get<TrackingResponse>(`/client/orders/track/${token}`).then((r) => r.data),

  cancel: (id: number) => api.post(`/client/orders/${id}/cancel`),
};

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (orderId: number) =>
    api.post<{ payment_url: string }>(`/client/payment/${orderId}/initiate`).then((r) => r.data),

  status: (orderId: number) =>
    api.get<PaymentStatus>(`/client/payment/${orderId}/status`).then((r) => r.data),
};
