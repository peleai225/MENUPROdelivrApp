"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Bike } from "lucide-react";
import { formatPrice, formatDistance } from "@/lib/format";
import type { Restaurant } from "@/types/api";

export function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <Link href={`/restaurants/${r.id}`}>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-36 bg-slate-100">
          {r.banner_url ? (
            <Image src={r.banner_url} alt={r.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <span className="text-3xl">🍽️</span>
            </div>
          )}
          {!r.is_open && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                Fermé
              </span>
            </div>
          )}
          {r.is_open && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Ouvert
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start gap-2">
            {r.logo_url && (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 -mt-6 bg-white shadow">
                <Image src={r.logo_url} alt={r.name} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate text-sm">{r.name}</h3>
              <p className="text-xs text-slate-500 capitalize">{r.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {r.avg_prep_time} min
            </span>
            {r.distance_km !== undefined && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(r.distance_km)}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Bike className="w-3 h-3 text-orange-500" />
              <span className="text-orange-500 font-medium">{formatPrice(r.delivery_fee)}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
