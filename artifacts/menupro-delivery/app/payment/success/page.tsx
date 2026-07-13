"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => router.replace(`/orders/track/${token}`), 1500);
      return () => clearTimeout(timer);
    }
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-xl font-bold text-slate-900 mb-2">Paiement réussi !</h1>
      <p className="text-slate-500">Redirection vers le suivi de commande...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SuccessContent />
    </Suspense>
  );
}
