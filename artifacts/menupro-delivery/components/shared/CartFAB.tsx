"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/format";

export function CartFAB() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());

  if (items.length === 0) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[440px] bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-between px-5 h-13 z-40 hover:bg-orange-600 transition-colors"
    >
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        <span className="font-semibold text-sm">
          {itemCount} article{itemCount > 1 ? "s" : ""}
        </span>
      </div>
      <span className="font-bold text-sm">{formatPrice(subtotal)}</span>
    </Link>
  );
}
