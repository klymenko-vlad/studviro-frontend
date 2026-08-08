import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves Tailwind conflicts, so a caller's
 * `className="p-8"` beats a component's built-in `p-4` instead of both landing
 * in the DOM and the winner being decided by stylesheet order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
