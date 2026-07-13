"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Bike, MapPin, ChevronRight } from "lucide-react";
import { restaurantsApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { formatPrice, formatDistance } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { coords } = useLocation();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => restaurantsApi.get(Number(id)),
    staleTime: 5 * 60 * 1000,
  });

  const { data: estimate } = useQuery({
    queryKey: ["delivery-estimate", id, coords],
    queryFn: () => restaurantsApi.deliveryEstimate(Number(id), coords),
    staleTime: 0,
    enabled: !!restaurant,
  });

  if (isLoading) {
    return (
      <div className="pb-24">
        <Skeleton className="h-52 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <main className="pb-24">
      {/* Banner */}
      <div className="relative h-52">
        {restaurant.banner_url ? (
          <Image src={restaurant.banner_url} alt={restaurant.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-300" />
        )}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="px-4 -mt-6 relative">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-start gap-3">
            {restaurant.logo_url && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                <Image src={restaurant.logo_url} alt={restaurant.name} fill className="object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
              <p className="text-sm text-slate-500 capitalize">{restaurant.category} · {restaurant.city}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {restaurant.address}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                restaurant.is_open
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {restaurant.is_open ? "Ouvert" : "Fermé"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {restaurant.avg_prep_time} min de préparation
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex items-center gap-1">
              <Bike className="w-3 h-3" />
              {formatPrice(restaurant.delivery_fee)}
            </span>
          </div>

          {/* Delivery estimate */}
          {estimate && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              {estimate.deliverable ? (
                <div className="flex justify-between text-slate-700">
                  <span>Livraison estimée</span>
                  <span className="font-semibold text-orange-500">
                    ~{estimate.estimated_minutes} min · {formatPrice(estimate.delivery_fee)}
                    {estimate.distance_km && (
                      <span className="text-slate-400 font-normal ml-1">({formatDistance(estimate.distance_km)})</span>
                    )}
                  </span>
                </div>
              ) : (
                <p className="text-red-600 text-center text-sm">Zone hors livraison</p>
              )}
            </div>
          )}

          <Link href={`/restaurants/${id}/menu`}>
            <Button className="w-full" disabled={!restaurant.is_open}>
              {restaurant.is_open ? "Voir le menu" : "Restaurant fermé"}
              {restaurant.is_open && <ChevronRight className="w-4 h-4" />}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
