"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

const schema = z.object({
  phone: z.string().regex(/^(0[157]\d{8})$/, "Numéro CI invalide (ex: 0708121520)"),
  password: z.string().min(8, "Minimum 8 caractères"),
});

type FormData = z.infer<typeof schema>;

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.token, res.customer);
      toast.success(`Bienvenue ${res.customer.name} !`);
      router.push(redirect);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Téléphone ou mot de passe incorrect";
      toast.error(msg);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col px-6 pb-8">
      {/* Logo */}
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
          <span className="text-3xl font-black text-white">M</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="text-slate-500 text-sm mt-1">Bon retour sur MenuPro !</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Téléphone</label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="07 08 12 15 20"
            className="w-full border border-slate-200 rounded-2xl px-4 h-12 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Mot de passe</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-2xl px-4 h-12 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full h-12 text-base mt-6" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />Connexion...</> : "Se connecter"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-orange-500 font-semibold">
          S&apos;inscrire
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  );
}
