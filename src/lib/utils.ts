import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes free-typed decimal input (handles both "." and ","
 * as decimal separators, strips anything else) so that numeric
 * fields never silently reject keystrokes. Use with
 * `type="text" inputMode="decimal"` instead of `type="number"`,
 * which can appear "stuck"/unusable when a user types a comma or
 * a locale-unexpected character.
 */
export function sanitizeDecimalInput(raw: string): string {
  let v = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  return v;
}
