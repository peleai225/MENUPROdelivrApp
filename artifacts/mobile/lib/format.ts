function groupThousands(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = Math.abs(Math.round(n)).toString();
  const groups: string[] = [];
  for (let i = digits.length; i > 0; i -= 3) {
    groups.unshift(digits.slice(Math.max(0, i - 3), i));
  }
  return sign + groups.join(' ');
}

/** Prices are in XOF (FCFA) — already full units, no division needed. */
export function formatPrice(amount: number | null | undefined): string {
  return `${groupThousands(Math.round(amount ?? 0))} FCFA`;
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '';
  return `${Math.round(minutes)} min`;
}

export function formatOrderDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const months = [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ];
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[date.getMonth()]} · ${hours}:${mins}`;
}

export interface OrderStatusMeta {
  label: string;
  color: string;
  softColor: string;
}

export const ORDER_STATUS_META: Record<string, OrderStatusMeta> = {
  pending_payment: { label: 'Paiement en attente', color: '#f97316', softColor: '#fef3e0' },
  pending: { label: 'En attente', color: '#f97316', softColor: '#fef3e0' },
  confirmed: { label: 'Confirmée', color: '#2563eb', softColor: '#e6effe' },
  preparing: { label: 'En préparation', color: '#2563eb', softColor: '#e6effe' },
  ready: { label: 'Prête', color: '#2563eb', softColor: '#e6effe' },
  delivering: { label: 'En livraison', color: '#7c3aed', softColor: '#f2ecfd' },
  completed: { label: 'Livrée', color: '#16a34a', softColor: '#e9f8ee' },
  cancelled: { label: 'Annulée', color: '#dc2626', softColor: '#fdeaea' },
};

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  return ORDER_STATUS_META[status] ?? { label: status, color: '#64748b', softColor: '#f8fafc' };
}

export function isPhoneCI(phone: string): boolean {
  return /^(01|05|07)\d{8}$/.test(phone.replace(/\s+/g, ''));
}
