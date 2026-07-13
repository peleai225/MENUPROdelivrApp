export function formatPrice(centimes: number): string {
  const fcfa = Math.round(centimes / 100);
  return fcfa.toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
