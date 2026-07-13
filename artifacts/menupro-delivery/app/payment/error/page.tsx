"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentErrorPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <XCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-slate-900 mb-2">Paiement échoué</h1>
      <p className="text-slate-500 mb-6">
        Le paiement Wave n&apos;a pas pu être traité. Votre commande est conservée.
      </p>
      <Button onClick={() => router.push("/checkout")}>Réessayer le paiement</Button>
    </div>
  );
}
