import type { TrackingDriver } from "@/types/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEcho(): Promise<any> {
  if (echoInstance) return echoInstance;
  if (typeof window === "undefined") return null;

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echoInstance = new (Echo as any)({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: true,
    enabledTransports: ["ws", "wss"],
  });

  return echoInstance;
}

export interface DriverAssignedEvent {
  driver: TrackingDriver;
  assigned_at: string;
}

export interface DeliveryStatusChangedEvent {
  new_status: string;
  status_label: string;
  estimated_minutes: number;
}

export interface DriverLocationEvent {
  lat: number;
  lng: number;
  status: string;
}
