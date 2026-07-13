"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Loader2 } from "lucide-react";
import { ordersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/types/api";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-slate-100 text-slate-600" },
  pending_payment: { label: "Paiement en attente", color: "bg-orange-100 text-orange-700" },
  confirmed: { label: "Confirmé", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "En préparation", color: "bg-blue-100 text-blue-700" },
  ready: { label: "Prêt", color: "bg-indigo-100 text-indigo-700" },
  delivering: { label: "En livraison", color: "bg-violet-100 text-violet-700" },
  completed: { label: "Livré", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

const ACTIVE_STATUSES: OrderStatus[] = ["confirmed", "preparing", "ready", "delivering"];

export default function OrdersPage() {
  const router = useRouter();
  const customer = useAuthStore((s) => s.customer);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!customer) router.replace("/login?redirect=/orders");
  }, [customer, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["orders-history", page],
    queryFn: () => ordersApi.history(page),
    staleTime: 0,
    enabled: !!customer,
  });

  if (!customer) return null;

  return (
    <main className="pb-24 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">Mes commandes</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))
          : data?.data.length === 0
          ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-slate-500 mb-4">Aucune commande pour le moment</p>
              <Link href="/">
                <Button>Commander maintenant</Button>
              </Link>
            </div>
          )
          : data?.data.map((order) => {
              const config = STATUS_CONFIG[order.status];
              const isActive = ACTIVE_STATUSES.includes(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {order.restaurant?.name ?? `Commande #${order.reference}`}
                      </p>
                      {order.created_at && (
                        <p className="text-xs text-slate-400">
                          {format(new Date(order.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{formatPrice(order.total)}</p>
                  {isActive && order.tracking_token && (
                    <Link href={`/orders/track/${order.tracking_token}`}>
                      <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        Suivre
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
      </div>

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex justify-center gap-3 px-4 pb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-slate-500 self-center">
            {page} / {data.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.last_page}
          >
            Suivant
          </Button>
        </div>
      )}
    </main>
  );
}
