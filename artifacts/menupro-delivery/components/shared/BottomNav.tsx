"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/restaurants", icon: Search, label: "Explorer" },
  { href: "/cart", icon: ShoppingBag, label: "Panier" },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());
  const customer = useAuthStore((s) => s.customer);

  const profileHref = customer ? "/profile" : "/login";

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 bg-white border-t border-slate-100 shadow-lg z-50 flex items-center">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 text-xs transition-colors",
              active ? "text-orange-500" : "text-slate-400"
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {href === "/cart" && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
      <Link
        href={profileHref}
        className={cn(
          "flex-1 flex flex-col items-center gap-0.5 text-xs transition-colors",
          pathname.startsWith("/profile") || pathname === "/login"
            ? "text-orange-500"
            : "text-slate-400"
        )}
      >
        <User className="w-5 h-5" />
        <span>Profil</span>
      </Link>
    </nav>
  );
}
