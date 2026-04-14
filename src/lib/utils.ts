/**
 * utils.ts — Tailwind CSS class merger utility.
 *
 * Exports `cn()` which combines clsx + tailwind-merge for conflict-free
 * conditional class name composition.
 *
 * Used by: virtually all UI components (buttons, cards, inputs, badges, etc.)
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
