"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronRight, LogOut, MapPin, Loader2, User } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const router = useRouter();
  const customer = useAuthStore((s) => s.customer);
  const setCustomer = useAuthStore((s) => s.setCustomer);
  const logout = useAuthStore((s) => s.logout);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      city: customer?.city ?? "",
    },
  });

  useEffect(() => {
    if (!customer) router.replace("/login");
  }, [customer, router]);

  if (!customer) return null;

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile(data);
      setCustomer(res.customer);
      toast.success("Profil mis à jour");
    } catch {
      toast.error("Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    router.push("/");
  };

  return (
    <main className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-orange-500 px-4 pt-12 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{customer.name}</h1>
            <p className="text-white/70 text-sm">{customer.phone}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Edit form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-slate-900 mb-3">Informations</h2>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Nom complet</label>
            <input
              {...register("name")}
              className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email (optionnel)</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ville</label>
            <select
              {...register("city")}
              className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
            >
              {["Abidjan", "Bouaké", "Yamoussoukro", "San Pedro", "Man"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement...</> : "Enregistrer"}
          </Button>
        </form>

        {/* Links */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
          <Link href="/profile/addresses" className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-semibold text-slate-800">Mes adresses</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/orders" className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg">📦</span>
              <span className="text-sm font-semibold text-slate-800">Mes commandes</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>
      </div>
    </main>
  );
}
