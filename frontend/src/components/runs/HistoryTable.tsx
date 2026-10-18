// Table view of historical remediation runs with sorting, source badges, and status pills.
// Used by HistoryPage to list all past self-healing attempts.

import React from 'react';
import { Zap } from 'lucide-react';
import { Run } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { RunSourceBadge } from '@/components/runs/RunSourceBadge';
import { formatRelativeTime } from '@/lib/formatDate';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

export interface HistoryTableProps {
  runs: Run[];
  isLoading: boolean;
  onSelectRun: (id: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  runs,
  isLoading,
  onSelectRun,
}) => {
  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" variant="amber" />
        <span className="text-xs font-mono text-gray-400">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="bg-forge-bg/60 border-b border-forge-border text-gray-400 font-mono text-[11px] uppercase">
            <th className="py-3 px-6 font-semibold">Run ID</th>
            <th className="py-3 px-6 font-semibold">When</th>
            <th className="py-3 px-6 font-semibold">What Changed</th>
            <th className="py-3 px-6 font-semibold">App & Source</th>
            <th className="py-3 px-6 font-semibold">Repair Result</th>
            <th className="py-3 px-6 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-forge-border/40 font-mono">
          {runs.map((r) => {
            const sc = DRIFT_SCENARIOS[r.scenario];
            return (
              <tr
                key={r.id}
                onClick={() => onSelectRun(r.id)}
                className="hover:bg-forge-surface-elevated/70 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-6 font-bold text-forge-amber-light group-hover:underline">
                  {r.id}
                </td>
                <td className="py-3.5 px-6 text-gray-400 whitespace-nowrap">
                  {formatRelativeTime(r.started_at)}
                </td>
                <td className="py-3.5 px-6 text-white font-sans font-semibold">
                  {sc?.title || r.scenario}
                </td>
                <td className="py-3.5 px-6 text-gray-300 font-sans">
                  <div className="flex flex-col gap-1 items-start">
                    <span>{r.service_name}</span>
                    <RunSourceBadge source={r.source} externalRef={r.external_ref} size="sm" />
                  </div>
                </td>
                <td className="py-3.5 px-6 text-gray-300">
                  {r.healed_from_memory ? (
                    <span className="text-purple-300 font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-forge-amber" />
                      Instant memory fix (0 AI calls)
                    </span>
                  ) : (
                    <span>Fixed in ~22s ({r.llm_calls} AI calls)</span>
                  )}
                </td>
                <td className="py-3.5 px-6 text-right">
                  <Badge
                    variant={
                      r.status === 'approved'
                        ? 'green'
                        : r.status === 'awaiting_approval'
                        ? 'amber'
                        : r.status === 'failed'
                        ? 'red'
                        : 'cyan'
                    }
                    size="sm"
                  >
                    {r.status === 'awaiting_approval'
                      ? 'Ready for approval'
                      : r.status === 'approved'
                      ? 'Approved'
                      : r.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
