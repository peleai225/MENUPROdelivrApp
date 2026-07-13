"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  name: z.string().min(2, "Minimum 2 caractères"),
  phone: z.string().regex(/^(0[157]\d{8})$/, "Format CI requis (ex: 0708121520)"),
  password: z.string().min(8, "Minimum 8 caractères"),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { city: "Abidjan" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data);
      setAuth(res.token, res.customer);
      toast.success("Bienvenue sur MenuPro !");
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Inscription échouée. Vérifiez vos informations.";
      toast.error(msg);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col px-6 pb-8">
      <div className="flex flex-col items-center pt-12 pb-6">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
          <span className="text-3xl font-black text-white">M</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
        <p className="text-slate-500 text-sm mt-1">C&apos;est rapide et gratuit</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Nom complet</label>
          <input
            {...register("name")}
            placeholder="Kouassi Amed"
            className="w-full border border-slate-200 rounded-2xl px-4 h-12 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

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
              placeholder="Minimum 8 caractères"
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

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Ville (optionnel)</label>
          <select
            {...register("city")}
            className="w-full border border-slate-200 rounded-2xl px-4 h-12 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            {["Abidjan", "Bouaké", "Yamoussoukro", "San Pedro", "Man"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full h-12 text-base mt-4" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />Inscription...</> : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-orange-500 font-semibold">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
