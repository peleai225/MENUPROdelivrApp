"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { restaurantsApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { RestaurantCard } from "@/components/shared/RestaurantCard";
import { RestaurantCardSkeleton } from "@/components/shared/RestaurantCardSkeleton";

const CITIES = ["Toutes", "Abidjan", "Bouaké", "Yamoussoukro", "San Pedro"];
const CATEGORIES = ["Tous", "Fast Food", "Restaurant", "Pizza", "Poulet", "Grillades"];

export default function RestaurantsPage() {
  const { coords, hasGps } = useLocation();
  const [city, setCity] = useState("Toutes");
  const [category, setCategory] = useState("Tous");
  const [openOnly, setOpenOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["restaurants", "explore", city, category, openOnly],
    queryFn: () =>
      restaurantsApi.list({
        city: city !== "Toutes" ? city : undefined,
        category: category !== "Tous" ? category.toLowerCase() : undefined,
        open_now: openOnly || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const restaurants = useMemo(() => {
    if (!data) return [];
    if (hasGps) {
      return [...data].sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
    }
    return data;
  }, [data, hasGps]);

  return (
    <main className="pb-24 min-h-screen">
      <div className="bg-white sticky top-0 z-10 border-b border-slate-100">
        <div className="px-4 pt-12 pb-3">
          <h1 className="text-xl font-bold text-slate-900">Explorer</h1>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`shrink-0 px-3 h-7 rounded-full text-xs font-semibold transition-colors ${
                  city === c ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 h-7 rounded-full text-xs font-semibold transition-colors ${
                  category === cat ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => setOpenOnly((v) => !v)}
              className={`shrink-0 flex items-center gap-1 px-3 h-7 rounded-full text-xs font-semibold transition-colors ml-auto ${
                openOnly ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Ouvert
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-1 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
          : restaurants.length === 0
          ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-slate-500">Aucun restaurant pour ces filtres</p>
            </div>
          )
          : restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
      </div>
    </main>
  );
}
