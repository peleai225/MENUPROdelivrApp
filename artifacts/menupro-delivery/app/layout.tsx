import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/shared/BottomNav";
import { CartSwitchDialog } from "@/components/shared/CartSwitchDialog";

export const metadata: Metadata = {
  title: "MenuPro Delivery",
  description: "Commandez vos repas préférés à Abidjan",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "MenuPro" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <div className="mx-auto max-w-[480px] min-h-screen bg-white relative">
            {children}
            <BottomNav />
            <CartSwitchDialog />
          </div>
        </Providers>
      </body>
    </html>
  );
}
