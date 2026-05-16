import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts a masjid name to Title Case, e.g. "masjid al-falah" → "Masjid Al-Falah" */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/(?:^|[\s\-])\S/g, (ch) => ch.toUpperCase());
}

// ── Reputation Tiers ──────────────────────────────────────────────

export type ReputationTier = "jemaah_baru" | "ahli_tetap" | "penjaga_masjid" | "tok_imam";

export const TIER_CONFIG: Record<ReputationTier, {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  min: number;
  next: number | null;
  desc: string;
}> = {
  jemaah_baru:    { label: "Jemaah Baru",    emoji: "🌱", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", min: 0,    next: 100,  desc: "Mulakan perjalanan anda" },
  ahli_tetap:     { label: "Ahli Tetap",     emoji: "⭐", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  min: 100,  next: 500,  desc: "Pelawat setia masjid" },
  penjaga_masjid: { label: "Penjaga Masjid", emoji: "🏅", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200",min: 500,  next: 1000, desc: "Penjaga komuniti masjid" },
  tok_imam:       { label: "Tok Imam",       emoji: "👑", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", min: 1000, next: null, desc: "Pemimpin komuniti tertinggi" },
};

export function getReputationTier(points: number): ReputationTier {
  if (points >= 1000) return "tok_imam";
  if (points >= 500)  return "penjaga_masjid";
  if (points >= 100)  return "ahli_tetap";
  return "jemaah_baru";
}

/** Progress (0–1) within the current tier toward the next tier. */
export function getTierProgress(points: number): number {
  const tier = getReputationTier(points);
  const cfg = TIER_CONFIG[tier];
  if (!cfg.next) return 1;
  return Math.min((points - cfg.min) / (cfg.next - cfg.min), 1);
}
