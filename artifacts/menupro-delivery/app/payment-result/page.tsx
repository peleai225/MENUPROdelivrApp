"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { paymentApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

function PaymentResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = Number(params.get("orderId"));
  const token = params.get("token");
  const pollCount = useRef(0);

  const { data, isError } = useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: async () => {
      pollCount.current++;
      return paymentApi.status(orderId);
    },
    refetchInterval: (query) => {
      const status = query.state.data?.payment_status;
      if (status === "paid" || status === "failed") return false;
      if (pollCount.current >= 20) return false;
      return 3000;
    },
    enabled: !!orderId,
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.payment_status === "paid" && token) {
      router.replace(`/orders/track/${token}`);
    }
  }, [data, token, router]);

  const status = data?.payment_status;

  if (isError || status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Paiement échoué</h1>
        <p className="text-slate-500 mb-6">Le paiement n&apos;a pas pu être traité.</p>
        <Button onClick={() => router.push("/checkout")}>Réessayer</Button>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Paiement confirmé !</h1>
        <p className="text-slate-500">Redirection vers le suivi...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
      <h1 className="text-xl font-bold text-slate-900 mb-2">En attente de paiement</h1>
      <p className="text-slate-500 text-sm">
        Finalisez votre paiement Wave. Cette page se met à jour automatiquement.
      </p>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
