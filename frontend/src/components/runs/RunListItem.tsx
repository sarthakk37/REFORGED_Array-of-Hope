// Single row item in the runs table displaying status, scenario, service, and timing.
// Navigates directly to the RunDetailPage when clicked.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Server, GitFork } from 'lucide-react';
import { Run } from '@/api/types';
import { RunStatusBadge } from './RunStatusBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { MemoryBadge } from './MemoryBadge';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/formatDate';
import { formatDuration } from '@/lib/formatDuration';

export interface RunListItemProps {
  run: Run;
}

export const RunListItem: React.FC<RunListItemProps> = ({ run }) => {
  const navigate = useNavigate();

  const scenarioVariant = (scenario: string) => {
    switch (scenario) {
      case 'rename':
        return 'amber';
      case 'type':
        return 'cyan';
      case 'nested':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <tr
      onClick={() => navigate(`/runs/${run.id}`)}
      className="group hover:bg-forge-surface-elevated/80 transition-colors cursor-pointer border-b border-forge-border/60"
    >
      {/* Run ID & Service */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-forge-amber-light group-hover:underline">
            {run.id}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-forge-bg px-2 py-0.5 rounded border border-forge-border font-mono">
            <Server className="w-3 h-3 text-gray-500" />
            <span>{run.service_name}</span>
          </div>
        </div>
      </td>

      {/* Scenario Type */}
      <td className="px-5 py-4 whitespace-nowrap">
        <Badge variant={scenarioVariant(run.scenario)} size="sm">
          {run.scenario}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-5 py-4 whitespace-nowrap">
        <RunStatusBadge status={run.status} size="sm" />
      </td>

      {/* Verification / Memory */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {run.healed_from_memory ? (
            <MemoryBadge size="sm" />
          ) : (
            <ConfidenceBadge confidence={run.confidence} size="sm" />
          )}
        </div>
      </td>

      {/* LLM Iterations */}
      <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-gray-400">
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3 text-gray-500" />
          <span>{run.llm_calls} calls</span>
          <span className="text-gray-600">({run.iterations} iter)</span>
        </div>
      </td>

      {/* Time & Duration */}
      <td className="px-5 py-4 whitespace-nowrap text-right">
        <div className="text-xs font-mono text-gray-300">
          {formatRelativeTime(run.started_at)}
        </div>
        <div className="text-[11px] font-mono text-gray-500">
          {formatDuration(run.started_at, run.finished_at)}
        </div>
      </td>

      {/* Action Chevron */}
      <td className="px-4 py-4 whitespace-nowrap text-right text-gray-500 group-hover:text-forge-amber transition-colors">
        <ChevronRight className="w-4 h-4 ml-auto" />
      </td>
    </tr>
  );
};
