import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseNameFromEmail(email: string | undefined): string {
  if (!email) return "Unknown";
  const userPart = email.split('@')[0];
  const parts = userPart.split('.');

  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
