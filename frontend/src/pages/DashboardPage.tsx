// Main cockpit dashboard displaying remediation statistics, the drift simulator, and recent runs.
// Includes a connectivity warning banner if the real backend is unreachable.

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRuns } from '@/hooks/useRuns';
import { usePatterns } from '@/hooks/usePatterns';
import { useHealth } from '@/hooks/useHealth';
import { config } from '@/config/env';
import { RunStats } from '@/components/runs/RunStats';
import { TriggerDriftPanel } from '@/components/demo/TriggerDriftPanel';
import { RunList } from '@/components/runs/RunList';
import { Button } from '@/components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { data: runs = [], isLoading: runsLoading, isError: runsError, refetch: refetchRuns } = useRuns();
  const { data: patterns = [] } = usePatterns();
  const { isError: healthError } = useHealth();

  const isBackendUnreachable = !config.useMock && (runsError || healthError);

  return (
    <div className="space-y-6">
      {/* Backend Connectivity Down Banner */}
      {isBackendUnreachable && (
        <div className="p-4 rounded-lg bg-forge-red/15 border border-forge-red/40 flex items-center justify-between text-xs text-forge-red-light font-mono shadow-red-glow">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-forge-red flex-shrink-0" />
            <div>
              <span className="font-bold block">Backend Disconnected:</span>
              Cannot connect to DriftSmith API at {config.apiUrl}. Verify backend service is running or switch to Mock Mode.
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchRuns()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-forge-border">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Remediation Cockpit</h1>
          <p className="text-xs text-gray-400">
            Real-time third-party API drift detection, AST patching, and sandbox verification
          </p>
        </div>
        <div className="text-xs font-mono text-gray-400">
          Autonomous Agent: <span className="text-forge-green font-semibold">Online</span>
        </div>
      </div>

      {/* Aggregate Stats */}
      <RunStats runs={runs} patterns={patterns} />

      {/* Drift Injection Simulator */}
      <TriggerDriftPanel />

      {/* Runs Table List */}
      <RunList runs={runs} isLoading={runsLoading} />
    </div>
  );
};
