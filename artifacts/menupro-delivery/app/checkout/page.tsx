"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi, addressesApi, restaurantsApi, paymentApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const router = useRouter();
  const { coords } = useLocation();
  const [loading, setLoading] = useState(false);
  const { items, restaurantId, restaurantName, subtotal, clear } = useCartStore();
  const customer = useAuthStore((s) => s.customer);

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressesApi.list(),
    enabled: !!customer,
  });

  const defaultAddress = addresses?.find((a) => a.is_default) ?? addresses?.[0];
  const lat = defaultAddress?.latitude ?? coords.lat;
  const lng = defaultAddress?.longitude ?? coords.lng;
  const deliveryAddress = defaultAddress?.address ?? "Abidjan, Côte d'Ivoire";
  const deliveryCity = defaultAddress?.city ?? "Abidjan";

  const { data: estimate } = useQuery({
    queryKey: ["estimate-checkout", restaurantId, lat, lng],
    queryFn: () => restaurantsApi.deliveryEstimate(restaurantId!, { lat, lng }),
    enabled: !!restaurantId,
    staleTime: 0,
  });

  const deliveryFee = estimate?.delivery_fee ?? 0;
  const total = subtotal() + deliveryFee;

  const handlePay = async () => {
    if (!restaurantId || items.length === 0) return;
    setLoading(true);
    try {
      const orderRes = await ordersApi.create({
        restaurant_id: restaurantId,
        items: items.map((i) => ({ dish_id: i.dishId, quantity: i.quantity, notes: i.notes })),
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        payment_method: "wave",
      });

      const payRes = await paymentApi.initiate(orderRes.order.id);
      clear();

      if (payRes.payment_url.startsWith("http")) {
        window.location.href = payRes.payment_url;
      } else {
        // Relative URL: store token + redirect to payment-result
        router.push(`/payment-result?orderId=${orderRes.order.id}&token=${orderRes.tracking_token}`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Une erreur est survenue. Réessayez.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customer) router.replace("/login?redirect=/checkout");
  }, [customer, router]);

  if (!customer) return null;

  return (
    <main className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button onClick={() => router.back()} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Confirmer la commande</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Restaurant */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Restaurant</p>
          <p className="font-semibold text-slate-900">{restaurantName}</p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-3">Articles</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.dishId} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {item.quantity}× {item.name}
                </span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Adresse de livraison</p>
          <p className="font-semibold text-slate-900">{deliveryAddress}</p>
          <p className="text-sm text-slate-500">{deliveryCity}</p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Livraison</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          {estimate?.estimated_minutes && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Délai estimé</span>
              <span>~{estimate.estimated_minutes} min</span>
            </div>
          )}
          <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-base">
            <span>Total</span>
            <span className="text-orange-500">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-2">Moyen de paiement</p>
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
            <Smartphone className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Wave Mobile Money</p>
              <p className="text-xs text-blue-600">Paiement sécurisé</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4">
        <Button className="w-full h-13 text-base" onClick={handlePay} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5" />
              Payer avec Wave · {formatPrice(total)}
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
