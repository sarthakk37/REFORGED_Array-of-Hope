// Calculate and format duration between two ISO timestamps or elapsed seconds.
// Used for run elapsed time and sandbox execution metrics.

export function formatDuration(startedAt: string | null | undefined, finishedAt: string | null | undefined): string {
  if (!startedAt) return '—';
  try {
    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    const diffMs = Math.max(0, end - start);
    return formatMilliseconds(diffMs);
  } catch {
    return '—';
  }
}

export function formatMilliseconds(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = (ms / 1000).toFixed(1);
  if (Number(seconds) < 60) return `${seconds}s`;
  const minutes = Math.floor(Number(seconds) / 60);
  const remSec = Math.round(Number(seconds) % 60);
  return `${minutes}m ${remSec}s`;
}
