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
