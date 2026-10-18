// Detailed full-page view for an individual remediation run.
// Reuses the unified RemediationStage component so all stage features are identical.

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRun } from '@/hooks/useRun';
import { useRunEvents } from '@/hooks/useRunEvents';
import { useApprove } from '@/hooks/useApprove';
import { useToast } from '@/components/ui/Toast';
import { RemediationStage } from '@/components/runs/RemediationStage';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';

export const RunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: run, isLoading, isError, refetch } = useRun(id);
  const approveMutation = useApprove();

  const isCompletedInitially =
    run?.status === 'approved' ||
    run?.status === 'awaiting_approval' ||
    run?.status === 'failed';

  const { events, isStreaming, isFinished } = useRunEvents(id, isCompletedInitially);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" variant="amber" />
        <span className="text-xs font-mono text-gray-400">Loading remediation telemetry...</span>
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="py-12">
        <ErrorState
          title="Run Not Found"
          message={`Unable to find run with ID "${id}".`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(run.id);
      toast('Fix approved! Pull request preview is ready for your team.', 'success');
      refetch();
    } catch {
      toast('Could not approve fix. Please try again.', 'error');
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 py-2">
      {/* Back button and page header */}
      <div className="space-y-3">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-forge-amber transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All History</span>
        </Link>

        <div className="flex items-center justify-between pb-3 border-b border-forge-border">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Remediation Run: {run.service_name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-gray-300 border border-forge-border">
                {run.id}
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Complete diagnosis, safe test room logs, and pull request preview
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-mono"
          >
            Refresh Stage
          </Button>
        </div>
      </div>

      {/* Unified Remediation Stage */}
      <RemediationStage
        run={run}
        events={events}
        isStreaming={isStreaming}
        isFinished={isFinished}
        onApprove={handleApprove}
        isApproving={approveMutation.isPending}
      />
    </div>
  );
};
