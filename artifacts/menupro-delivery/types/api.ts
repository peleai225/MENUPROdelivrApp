export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  total_orders: number;
}

export interface AuthResponse {
  token: string;
  customer: Customer;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  logo_url: string | null;
  banner_url: string | null;
  is_open: boolean;
  min_order_amount: number;
  avg_prep_time: number;
  latitude: string;
  longitude: string;
  distance_km?: number;
  delivery_fee: number;
}

export interface Dish {
  id: number;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  is_vegetarian: boolean;
  prep_time: number | null;
  calories: number | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  dishes: Dish[];
}

export interface Menu {
  restaurant_id: number;
  currency: string;
  categories: MenuCategory[];
}

export interface DeliveryEstimate {
  deliverable: boolean;
  delivery_fee: number;
  distance_km: number;
  estimated_minutes: number;
  is_peak_hour: boolean;
  breakdown: {
    base_fee: number;
    distance_fee: number;
    peak_surcharge: number;
    prep_minutes: number;
    transit_minutes: number;
  };
}

export interface Address {
  id: number;
  label: string;
  address: string;
  city: string;
  zone?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  is_default: boolean;
}

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: number;
  reference: string;
  tracking_token: string;
  status: OrderStatus;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  estimated_minutes: number;
  items: OrderItem[];
  restaurant?: { name: string };
  created_at?: string;
}

export interface CreateOrderResponse {
  order: Order;
  tracking_token: string;
  payment_url: string;
}

export interface TrackingTimeline {
  ordered_at: string | null;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  driver_assigned_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
}

export interface TrackingDriver {
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: string;
}

export interface TrackingResponse {
  order_status: OrderStatus;
  estimated_minutes: number | null;
  delivery: {
    status: string;
    status_label: string;
    driver: TrackingDriver | null;
  } | null;
  timeline: TrackingTimeline;
}

export interface PaymentStatus {
  payment_status: string;
  order_status: OrderStatus;
}
