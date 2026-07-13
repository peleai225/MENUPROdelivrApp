"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, MapPin, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/format";
import { restaurantsApi, addressesApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartPage() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, updateQuantity, removeItem, subtotal } = useCartStore();
  const customer = useAuthStore((s) => s.customer);
  const { coords } = useLocation();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [manualAddress, setManualAddress] = useState({ address: "", city: "Abidjan" });

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressesApi.list(),
    enabled: !!customer,
  });

  const defaultAddress = addresses?.find((a) => a.is_default) ?? addresses?.[0];
  const activeAddressId = selectedAddressId ?? defaultAddress?.id ?? null;
  const activeAddress = addresses?.find((a) => a.id === activeAddressId);

  const { data: estimate, isLoading: loadingEstimate } = useQuery({
    queryKey: ["estimate-cart", restaurantId, activeAddressId, coords],
    queryFn: () => {
      const lat = activeAddress?.latitude ?? coords.lat;
      const lng = activeAddress?.longitude ?? coords.lng;
      return restaurantsApi.deliveryEstimate(restaurantId!, { lat, lng });
    },
    enabled: !!restaurantId && (!!activeAddress || true),
    staleTime: 0,
  });

  if (items.length === 0) {
    return (
      <main className="pb-24 flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Votre panier est vide</h2>
        <p className="text-slate-500 text-sm mb-6 text-center">
          Ajoutez des plats depuis un restaurant pour commander.
        </p>
        <Link href="/restaurants">
          <Button>Explorer les restaurants</Button>
        </Link>
      </main>
    );
  }

  const deliveryFee = estimate?.delivery_fee ?? 0;
  const total = subtotal() + deliveryFee;

  const handleOrder = () => {
    if (!customer) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <main className="pb-28 min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Votre panier</h1>
        {restaurantName && (
          <p className="text-sm text-slate-500">{restaurantName}</p>
        )}
      </div>

      {/* Cart items */}
      <div className="px-4 py-4 space-y-3">
        {items.map((item) => (
          <div key={item.dishId} className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
              <p className="text-orange-500 font-bold text-sm">{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={() => removeItem(item.dishId)}
                className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center ml-1"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Address section */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            Adresse de livraison
          </h2>

          {customer ? (
            loadingAddresses ? (
              <Skeleton className="h-10 w-full" />
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label key={addr.id} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="address"
                      checked={activeAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{addr.label}</p>
                      <p className="text-xs text-slate-500">{addr.address}, {addr.city}</p>
                    </div>
                  </label>
                ))}
                <Link href="/profile/addresses" className="flex items-center gap-1 text-orange-500 text-sm mt-2">
                  <span>Ajouter une adresse</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <Link href="/profile/addresses">
                <Button variant="outline" className="w-full text-sm">
                  + Ajouter une adresse
                </Button>
              </Link>
            )
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Votre adresse de livraison"
                value={manualAddress.address}
                onChange={(e) => setManualAddress((v) => ({ ...v, address: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
              />
              <select
                value={manualAddress.city}
                onChange={(e) => setManualAddress((v) => ({ ...v, city: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
              >
                {["Abidjan", "Bouaké", "Yamoussoukro", "San Pedro"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="font-bold text-slate-900 mb-2">Récapitulatif</h2>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Frais de livraison</span>
            <span>
              {loadingEstimate ? (
                <Skeleton className="h-4 w-20 inline-block" />
              ) : (
                formatPrice(deliveryFee)
              )}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span className="text-orange-500">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4">
        <Button className="w-full h-13 text-base" onClick={handleOrder}>
          Commander · {formatPrice(total)}
        </Button>
      </div>
    </main>
  );
}
