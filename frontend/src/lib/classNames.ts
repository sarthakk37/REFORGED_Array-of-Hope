// Utility function for conditionally joining Tailwind CSS class strings together.
// Used across all UI components for clean, dynamic class combination.

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
