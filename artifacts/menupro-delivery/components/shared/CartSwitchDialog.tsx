"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";

export function CartSwitchDialog() {
  const pendingAdd = useCartStore((s) => s.pendingAdd);
  const confirmSwitch = useCartStore((s) => s.confirmSwitch);
  const cancelSwitch = useCartStore((s) => s.cancelSwitch);

  if (!pendingAdd) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-slate-900 text-lg">Nouveau restaurant</h2>
        <p className="text-slate-600 text-sm">
          Votre panier contient des articles d&apos;un autre restaurant. Voulez-vous vider le panier et
          commander chez <strong>{pendingAdd.restaurantName}</strong> ?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={cancelSwitch}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={confirmSwitch}>
            Vider et continuer
          </Button>
        </div>
      </div>
    </div>
  );
}
