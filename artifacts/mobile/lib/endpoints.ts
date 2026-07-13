import api from '@/lib/api';
import type {
  Address,
  AuthResponse,
  Customer,
  CreateOrderPayload,
  CreateOrderResponse,
  DeliveryEstimate,
  MenuResponse,
  PaginatedOrders,
  Restaurant,
  TrackingResponse,
} from '@/types';

// ---- Auth ----

export async function registerClient(payload: {
  name: string;
  phone: string;
  password: string;
  email?: string;
  city?: string;
}) {
  const { data } = await api.post<AuthResponse>('/client/auth/register', payload);
  return data;
}

export async function loginClient(payload: { phone: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/client/auth/login', payload);
  return data;
}

/** Firebase Phone Auth — exchange a Firebase idToken for a MENUPro session token. */
export async function loginWithFirebasePhone(payload: { firebase_id_token: string; phone: string }) {
  const { data } = await api.post<AuthResponse>('/client/auth/firebase-phone', payload);
  return data;
}

/** Firebase Phone Auth — register a new account after phone verification. */
export async function registerWithFirebasePhone(payload: {
  firebase_id_token: string;
  phone: string;
  name: string;
  password: string;
  email?: string;
  city?: string;
}) {
  const { data } = await api.post<AuthResponse>('/client/auth/register', {
    name: payload.name,
    phone: payload.phone,
    password: payload.password,
    email: payload.email,
    city: payload.city,
    firebase_id_token: payload.firebase_id_token,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ customer: Customer } | Customer>('/client/auth/me');
  return 'customer' in data ? data.customer : data;
}

export async function logoutClient() {
  await api.post('/client/auth/logout');
}

export async function updateProfile(payload: { name?: string; email?: string; city?: string }) {
  const { data } = await api.patch<{ customer: Customer } | Customer>('/client/auth/profile', payload);
  return 'customer' in data ? data.customer : data;
}

// ---- Restaurants ----

export interface RestaurantListParams {
  city?: string;
  category?: string;
  lat?: number;
  lng?: number;
  open_now?: boolean;
}

function toApiList(list: unknown): Restaurant[] {
  if (Array.isArray(list)) return list as Restaurant[];
  if (list && typeof list === 'object' && Array.isArray((list as { data?: unknown }).data)) {
    return (list as { data: Restaurant[] }).data;
  }
  return [];
}

export async function fetchRestaurants(params: RestaurantListParams = {}) {
  const { data } = await api.get('/restaurants', { params });
  return toApiList(data);
}

export async function fetchNearbyRestaurants(params: { lat: number; lng: number; radius_km?: number }) {
  const { data } = await api.get('/restaurants/nearby', { params });
  return toApiList(data);
}

export async function fetchRestaurant(id: number | string) {
  const { data } = await api.get<Restaurant | { data: Restaurant }>(`/restaurants/${id}`);
  return 'data' in data ? data.data : data;
}

export async function fetchMenu(id: number | string) {
  const { data } = await api.get<MenuResponse>(`/restaurants/${id}/menu`);
  return data;
}

export async function fetchDeliveryEstimate(id: number | string, lat: number, lng: number) {
  const { data } = await api.get<DeliveryEstimate>(`/restaurants/${id}/delivery-estimate`, {
    params: { lat, lng },
  });
  return data;
}

// ---- Addresses ----

export async function fetchAddresses() {
  const { data } = await api.get<Address[] | { data: Address[] }>('/client/addresses');
  return Array.isArray(data) ? data : data.data;
}

export async function createAddress(payload: Omit<Address, 'id'>) {
  const { data } = await api.post<Address>('/client/addresses', payload);
  return data;
}

export async function updateAddress(id: number, payload: Partial<Omit<Address, 'id'>>) {
  const { data } = await api.patch<Address>(`/client/addresses/${id}`, payload);
  return data;
}

export async function deleteAddress(id: number) {
  await api.delete(`/client/addresses/${id}`);
}

// ---- Orders ----

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<CreateOrderResponse>('/client/orders', payload);
  return data;
}

export async function fetchOrderHistory(page = 1) {
  const { data } = await api.get<PaginatedOrders | { data: PaginatedOrders['data'] }>('/client/orders/history', {
    params: { page },
  });
  if ('current_page' in data) return data as PaginatedOrders;
  return { data: data.data, current_page: page, last_page: page, total: data.data.length };
}

export async function trackOrder(token: string) {
  const { data } = await api.get<TrackingResponse>(`/client/orders/track/${token}`);
  return data;
}

export async function cancelOrder(id: number) {
  await api.post(`/client/orders/${id}/cancel`);
}

// ---- Payment ----

export async function initiatePayment(orderId: number) {
  const { data } = await api.post<{ payment_url: string }>(`/client/payment/${orderId}/initiate`);
  return data;
}

export async function fetchPaymentStatus(orderId: number) {
  const { data } = await api.get<{ payment_status: string; order_status: string }>(
    `/client/payment/${orderId}/status`,
  );
  return data;
}
