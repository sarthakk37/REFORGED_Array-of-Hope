// Compact table displaying recent autonomous remediation runs on the live demo stage.
// Shows relative time, what changed, service name, AI calls, and status badges.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { Run } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { RunSourceBadge } from '@/components/runs/RunSourceBadge';
import { formatRelativeTime } from '@/lib/formatDate';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

export interface RecentRunsTableProps {
  runs: Run[];
  onSelectRun: (id: string) => void;
}

export const RecentRunsTable: React.FC<RecentRunsTableProps> = ({
  runs,
  onSelectRun,
}) => {
  return (
    <div className="rounded-2xl border border-forge-border bg-forge-surface p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-forge-border">
        <div>
          <h3 className="text-base font-bold text-white">Recent fixes</h3>
          <p className="text-xs text-gray-400">Past autonomous repairs verified in safe test room</p>
        </div>

        <Link
          to="/history"
          className="text-xs font-mono text-forge-amber hover:underline flex items-center gap-1 font-semibold"
        >
          <span>View all history</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="text-gray-400 font-mono text-[11px] uppercase border-b border-forge-border/60 pb-2">
              <th className="py-2.5 px-3">When</th>
              <th className="py-2.5 px-3">What changed</th>
              <th className="py-2.5 px-3">App</th>
              <th className="py-2.5 px-3">Result</th>
              <th className="py-2.5 px-3 text-right">Status</th>
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
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(r.started_at)}
                  </td>
                  <td className="py-3 px-3 text-white font-sans font-semibold group-hover:text-forge-amber-light">
                    {sc?.title || r.scenario}
                  </td>
                  <td className="py-3 px-3 text-gray-300 font-sans">
                    <div className="flex flex-col gap-1 items-start">
                      <span>{r.service_name}</span>
                      <RunSourceBadge source={r.source} externalRef={r.external_ref} size="sm" />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-300">
                    {r.healed_from_memory ? (
                      <span className="text-purple-300 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-forge-amber" />
                        Instant (0 AI calls)
                      </span>
                    ) : (
                      <span>Fixed ({r.llm_calls} AI calls)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
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
    </div>
  );
};
