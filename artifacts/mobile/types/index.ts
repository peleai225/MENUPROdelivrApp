export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  total_orders?: number;
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
  latitude: string | number;
  longitude: string | number;
  distance_km?: number | null;
  delivery_fee?: number | null;
  estimated_minutes?: number | null;
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
  prep_time: number;
  calories: number | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  dishes: Dish[];
}

export interface MenuResponse {
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
  zone?: string | null;
  latitude: number;
  longitude: number;
  instructions?: string | null;
  is_default: boolean;
}

export interface CartItem {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  notes?: string;
}

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
  status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  estimated_minutes: number;
  items: OrderItem[];
  created_at?: string;
}

export type PaymentMethod = 'wave' | 'cash';

export interface CreateOrderPayload {
  restaurant_id: number;
  items: { dish_id: number; quantity: number; notes?: string }[];
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  delivery_city: string;
  delivery_instructions?: string;
  payment_method: 'wave';  // L'API n'accepte que 'wave' — 'cash' est géré côté app
}

export interface CreateOrderResponse {
  order: Order;
  tracking_token: string;
  payment_url: string;
}

export interface TrackingDriver {
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: string;
}

export interface TrackingResponse {
  order_status: string;
  estimated_minutes: number;
  delivery: {
    status: string;
    status_label: string;
    driver: TrackingDriver | null;
  } | null;
  timeline: {
    ordered_at: string | null;
    confirmed_at: string | null;
    preparing_at: string | null;
    ready_at: string | null;
    driver_assigned_at: string | null;
    picked_up_at: string | null;
    completed_at: string | null;
  };
}

export interface PaginatedOrders {
  data: Order[];
  current_page: number;
  last_page: number;
  total: number;
}
