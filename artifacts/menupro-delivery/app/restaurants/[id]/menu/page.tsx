"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Leaf, Plus, Minus } from "lucide-react";
import { restaurantsApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/format";
import { CartFAB } from "@/components/shared/CartFAB";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dish } from "@/types/api";

export default function MenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => restaurantsApi.menu(Number(id)),
    staleTime: 10 * 60 * 1000,
  });

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => restaurantsApi.get(Number(id)),
    staleTime: 5 * 60 * 1000,
  });

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const getQty = (dishId: number) => items.find((i) => i.dishId === dishId)?.quantity ?? 0;

  const handleAdd = (dish: Dish) => {
    if (!restaurant) return;
    addItem(restaurant.id, restaurant.name, {
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
    });
  };

  const displayedCategories = menu?.categories ?? [];
  const focusedId = activeCategory ?? displayedCategories[0]?.id;

  return (
    <main className="pb-36 min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-20 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-12 pb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="font-bold text-slate-900 truncate">
            {restaurant?.name ?? "Menu"}
          </h1>
        </div>

        {/* Category tabs */}
        {!isLoading && displayedCategories.length > 0 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {displayedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
                  focusedId === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 flex gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="px-4 py-4 space-y-6">
        {displayedCategories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`}>
            <h2 className="font-bold text-slate-900 mb-3">{cat.name}</h2>
            <div className="space-y-3">
              {cat.dishes.map((dish) => {
                const qty = getQty(dish.id);
                return (
                  <div
                    key={dish.id}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden flex gap-3 p-3 ${
                      !dish.is_available ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-sm">{dish.name}</h3>
                        {dish.is_spicy && <Flame className="w-3 h-3 text-red-500 shrink-0" />}
                        {dish.is_vegetarian && <Leaf className="w-3 h-3 text-green-500 shrink-0" />}
                      </div>
                      {dish.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{dish.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-orange-500 text-sm">
                          {formatPrice(dish.price)}
                        </span>
                        {dish.is_available && (
                          <div className="flex items-center gap-2">
                            {qty > 0 ? (
                              <>
                                <button
                                  onClick={() => updateQuantity(dish.id, qty - 1)}
                                  className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-500"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-semibold w-5 text-center">{qty}</span>
                                <button
                                  onClick={() => handleAdd(dish)}
                                  className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleAdd(dish)}
                                className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                        {!dish.is_available && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Indisponible
                          </span>
                        )}
                      </div>
                    </div>
                    {dish.image_url && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <Image src={dish.image_url} alt={dish.name} fill className="object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <CartFAB />
    </main>
  );
}
