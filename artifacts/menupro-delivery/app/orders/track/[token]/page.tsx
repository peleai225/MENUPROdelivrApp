"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Star, Clock } from "lucide-react";
import { ordersApi } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import { TrackingMap } from "@/components/shared/TrackingMap";
import type { TrackingDriver, TrackingResponse, OrderStatus } from "@/types/api";
import type { DriverAssignedEvent, DeliveryStatusChangedEvent, DriverLocationEvent } from "@/lib/echo";

const STATUS_STEPS: { key: keyof typeof STATUS_LABELS; label: string }[] = [
  { key: "pending", label: "Commandé" },
  { key: "confirmed", label: "Confirmé par le restaurant" },
  { key: "preparing", label: "En préparation" },
  { key: "ready", label: "Livreur assigné" },
  { key: "delivering", label: "En livraison" },
  { key: "completed", label: "Livré" },
];

const STATUS_LABELS = {
  pending: 0,
  pending_payment: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivering: 4,
  completed: 5,
  cancelled: -1,
};

function getStepIndex(status: OrderStatus) {
  return STATUS_LABELS[status] ?? 0;
}

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const queryClient = useQueryClient();
  const [liveDriver, setLiveDriver] = useState<TrackingDriver | null>(null);

  const { data: tracking } = useQuery<TrackingResponse>({
    queryKey: ["tracking", token],
    queryFn: () => ordersApi.track(token),
    staleTime: 0,
  });

  const driver = liveDriver ?? tracking?.delivery?.driver ?? null;
  const stepIndex = getStepIndex(tracking?.order_status ?? "pending");

  // WebSocket subscription
  useEffect(() => {
    let channel: { stopListening: (e: string) => void } | null = null;
    let echoRef: Awaited<ReturnType<typeof getEcho>> | null = null;

    getEcho().then((echo) => {
      if (!echo) return;
      echoRef = echo;

      const ch = echo.channel(`order.${token}`);
      channel = ch as typeof channel;

      ch.listen(".driver.assigned", (e: DriverAssignedEvent) => {
        setLiveDriver(e.driver);
        queryClient.invalidateQueries({ queryKey: ["tracking", token] });
      });

      ch.listen(".delivery.status_changed", (_e: DeliveryStatusChangedEvent) => {
        queryClient.invalidateQueries({ queryKey: ["tracking", token] });
      });

      ch.listen(".driver.location", (e: DriverLocationEvent) => {
        setLiveDriver((prev) => (prev ? { ...prev, latitude: e.lat, longitude: e.lng } : null));
      });
    });

    return () => {
      if (echoRef && channel) {
        channel.stopListening(".driver.assigned");
        channel.stopListening(".delivery.status_changed");
        channel.stopListening(".driver.location");
        echoRef.leave(`order.${token}`);
      }
    };
  }, [token, queryClient]);

  return (
    <main className="pb-8 min-h-screen flex flex-col">
      {/* Map — 60% height */}
      <div className="relative" style={{ height: "60vh" }}>
        <TrackingMap
          deliveryLat={undefined}
          deliveryLng={undefined}
          driver={driver}
        />

        {tracking?.estimated_minutes != null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow px-4 py-2 flex items-center gap-2 text-sm font-semibold text-slate-800 z-[1000]">
            <Clock className="w-4 h-4 text-orange-500" />
            ~{tracking.estimated_minutes} min
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 px-4 pt-5 pb-6 space-y-4 shadow-lg">
        <h1 className="text-xl font-bold text-slate-900">
          {tracking?.delivery?.status_label ?? "Suivi de commande"}
        </h1>

        {/* Driver card */}
        {driver && (
          <div className="flex items-center gap-3 bg-orange-50 rounded-2xl p-3">
            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center text-lg">
              🛵
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">{driver.name}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                {driver.rating}
              </p>
            </div>
            <a
              href={`tel:${driver.phone}`}
              className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          {STATUS_STEPS.map((step, idx) => {
            const done = stepIndex >= idx;
            const current = stepIndex === idx;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      done
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    } ${current ? "ring-2 ring-orange-300 ring-offset-1" : ""}`}
                  >
                    {done ? "✓" : idx + 1}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-6 mt-1 ${done ? "bg-orange-300" : "bg-slate-100"}`}
                    />
                  )}
                </div>
                <div className="pt-0.5">
                  <p
                    className={`text-sm font-semibold ${
                      done ? "text-slate-900" : "text-slate-400"
                    } ${current ? "text-orange-500" : ""}`}
                  >
                    {step.label}
                  </p>
                  {current && (
                    <p className="text-xs text-orange-400 mt-0.5 animate-pulse">En cours...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
