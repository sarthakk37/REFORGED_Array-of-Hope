// Full history log page listing all past API change remediation runs.
// Composes HistoryTable and RemediationStage for deep inspection of past runs.

import React, { useState } from 'react';
import { History, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRuns } from '@/hooks/useRuns';
import { useRun } from '@/hooks/useRun';
import { useRunEvents } from '@/hooks/useRunEvents';
import { useApprove } from '@/hooks/useApprove';
import { useToast } from '@/components/ui/Toast';
import { RemediationStage } from '@/components/runs/RemediationStage';
import { HistoryTable } from '@/components/runs/HistoryTable';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const HistoryPage: React.FC = () => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { data: runs = [], isLoading, refetch } = useRuns();
  const { data: selectedRun, refetch: refetchRun } = useRun(selectedRunId || undefined);
  const approveMutation = useApprove();
  const { toast } = useToast();

  const isCompletedInitially =
    selectedRun?.status === 'approved' ||
    selectedRun?.status === 'awaiting_approval' ||
    selectedRun?.status === 'failed';

  const { events, isStreaming, isFinished } = useRunEvents(
    selectedRunId || undefined,
    isCompletedInitially
  );

  const handleApprove = async () => {
    if (!selectedRunId) return;
    try {
      await approveMutation.mutateAsync(selectedRunId);
      toast('Fix approved! Pull request preview is ready for your team.', 'success');
      refetchRun();
      refetch();
    } catch {
      toast('Could not approve fix. Please try again.', 'error');
    }
  };

  if (selectedRun) {
    return (
      <div className="max-w-[1100px] mx-auto space-y-6 py-2">
        <button
          onClick={() => setSelectedRunId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-forge-amber transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All History</span>
        </button>

        <div className="flex items-center justify-between pb-3 border-b border-forge-border">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Remediation History: {selectedRun.service_name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-gray-300 border border-forge-border">
                {selectedRun.id}
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Inspecting past automated repair and verification results
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchRun()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Refresh
          </Button>
        </div>

        <RemediationStage
          run={selectedRun}
          events={events}
          isStreaming={isStreaming}
          isFinished={isFinished}
          onApprove={handleApprove}
          isApproving={approveMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 py-2">
      <div className="flex items-center justify-between pb-3 border-b border-forge-border">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <History className="w-5 h-5 text-forge-amber" />
            <span>Remediation History</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete archive of past API changes and self-healing test results
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-mono"
        >
          Refresh History
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-forge-border">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-sm font-bold text-white">All Past API Changes</h2>
              <p className="text-xs text-gray-400">Click any row to inspect the full fix and test results</p>
            </div>
            <Badge variant="default" size="sm">
              {runs.length} Total Runs
            </Badge>
          </div>
        </CardHeader>

        <HistoryTable
          runs={runs}
          isLoading={isLoading}
          onSelectRun={(id) => setSelectedRunId(id)}
        />
      </Card>
    </div>
  );
};
