"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin } from "lucide-react";
import { restaurantsApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { RestaurantCard } from "@/components/shared/RestaurantCard";
import { RestaurantCardSkeleton } from "@/components/shared/RestaurantCardSkeleton";

const CATEGORIES = ["Tous", "Fast Food", "Restaurant", "Pizza", "Poulet", "Grillades"];

export default function HomePage() {
  const { coords, hasGps } = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");

  const { data: nearby, isLoading: loadingNearby } = useQuery({
    queryKey: ["restaurants", "nearby", coords],
    queryFn: () => restaurantsApi.nearby({ lat: coords.lat, lng: coords.lng }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: all, isLoading: loadingAll } = useQuery({
    queryKey: ["restaurants", "all"],
    queryFn: () => restaurantsApi.list(),
    staleTime: 5 * 60 * 1000,
    enabled: !hasGps,
  });

  const restaurants = hasGps ? (nearby ?? []) : (all ?? []);
  const isLoading = hasGps ? loadingNearby : loadingAll;

  const filtered = useMemo(() => {
    let list = restaurants;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (activeCategory !== "Tous") {
      list = list.filter((r) =>
        r.category.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }
    return list;
  }, [restaurants, search, activeCategory]);

  return (
    <main className="pb-24 min-h-screen">
      {/* Header */}
      <div className="bg-orange-500 px-4 pt-12 pb-6">
        <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
          <MapPin className="w-4 h-4" />
          <span>{hasGps ? "Position détectée" : "Abidjan, Côte d'Ivoire"}</span>
        </div>
        <h1 className="text-white text-2xl font-bold mb-4">
          Que voulez-vous manger ?
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-full bg-white text-slate-900 placeholder-slate-400 text-sm outline-none"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Restaurant grid */}
      <div className="px-4 grid grid-cols-1 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
          : filtered.length === 0
          ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-slate-500">Aucun restaurant trouvé</p>
            </div>
          )
          : filtered.map((r) => <RestaurantCard key={r.id} r={r} />)}
      </div>
    </main>
  );
}
