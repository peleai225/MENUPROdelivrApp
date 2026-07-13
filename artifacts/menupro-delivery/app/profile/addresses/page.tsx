"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Star, Trash2, Plus, Loader2 } from "lucide-react";
import { addressesApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Address } from "@/types/api";

const LABELS = ["Maison", "Bureau", "Autre"];

function AddressForm({ onSave, onCancel }: { onSave: (data: Omit<Address, "id">) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Address, "id">>({
    label: "Maison",
    address: "",
    city: "Abidjan",
    is_default: false,
  });

  return (
    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-900 text-sm">Nouvelle adresse</h3>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Label</label>
        <select
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
        >
          {LABELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Adresse</label>
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="Ex: Cocody Angré 7e tranche"
          className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Ville</label>
        <select
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
        >
          {["Abidjan", "Bouaké", "Yamoussoukro", "San Pedro"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Instructions (optionnel)</label>
        <input
          value={form.instructions ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          placeholder="Ex: Portail bleu, 2e étage"
          className="w-full border border-slate-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-orange-400"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          className="accent-orange-500"
        />
        <span className="text-sm text-slate-700">Définir comme adresse par défaut</span>
      </label>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Annuler</Button>
        <Button size="sm" className="flex-1" onClick={() => onSave(form)} disabled={!form.address}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const router = useRouter();
  const customer = useAuthStore((s) => s.customer);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressesApi.list(),
    enabled: !!customer,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Address, "id">) => addressesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setShowForm(false);
      toast.success("Adresse ajoutée");
    },
    onError: () => toast.error("Impossible d'ajouter l'adresse"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adresse supprimée");
    },
    onError: () => toast.error("Impossible de supprimer l'adresse"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => addressesApi.update(id, { is_default: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });

  useEffect(() => {
    if (!customer) router.replace("/login");
  }, [customer, router]);

  if (!customer) return null;

  return (
    <main className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-slate-100 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Mes adresses</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : addresses?.length === 0 && !showForm ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">📍</p>
            <p className="text-slate-500 mb-4">Aucune adresse sauvegardée</p>
          </div>
        ) : (
          addresses?.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{addr.label}</p>
                  {addr.is_default && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
                      Par défaut
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{addr.address}, {addr.city}</p>
                {addr.instructions && (
                  <p className="text-xs text-slate-400 mt-0.5">{addr.instructions}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {!addr.is_default && (
                  <button
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                    className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"
                    title="Définir par défaut"
                  >
                    <Star className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}

        {showForm ? (
          <AddressForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Ajouter une adresse
          </Button>
        )}
      </div>
    </main>
  );
}
