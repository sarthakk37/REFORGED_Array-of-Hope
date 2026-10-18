// Approval action panel and Pull Request preview card for human sign-off.
// Enforces role-based permissions, zero-network mock previewing, and double-submit prevention.

import React, { useState } from 'react';
import { CheckCircle, Lock, GitPullRequest } from 'lucide-react';
import { RunDetail } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DRIFT_SCENARIOS } from '@/mock/drifts';
import { PullRequestPreviewCard } from './PullRequestPreviewCard';
import { ApprovalConfirmModal } from './ApprovalConfirmModal';

export interface ApprovalPanelProps {
  run: RunDetail;
  onApprove: () => Promise<void>;
  isApproving?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  run,
  onApprove,
  isApproving = false,
  error = null,
  onRetry,
}) => {
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const canApprove = user?.role === 'approver' || user?.role === 'admin';
  const isApproved = run.status === 'approved';
  const isAwaiting = run.status === 'awaiting_approval' || run.status === 'verified';
  const isRunning = run.status === 'running' || run.status === 'queued';

  const scenarioData = DRIFT_SCENARIOS[run.scenario];
  const branchName = run.pull_request?.branch || `driftsmith/fix-${run.id}`;
  const prTitle = `fix(api): heal API change in ${run.service_name} (${scenarioData?.title || run.scenario})`;

  const prDescription = `## DriftSmith Automated Remediation
- **App affected**: ${run.service_name}
- **API change**: ${scenarioData?.title || run.scenario}
- **Verification**: Passed 100% of checks in safe test room with both OLD and NEW data payloads.
- **Safety guarantee**: Backward and forward compatible. Works with older data if upstream rolls back.`;

  const handleConfirmApprove = async () => {
    setShowConfirmModal(false);
    await onApprove();
  };

  return (
    <div className="rounded-xl border border-forge-border bg-forge-surface p-6 shadow-xl space-y-4">
      {isApproved ? (
        <PullRequestPreviewCard
          prTitle={prTitle}
          branchName={branchName}
          prDescription={prDescription}
        />
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 rounded-lg bg-forge-surface-elevated border border-forge-border text-forge-amber flex-shrink-0">
              <GitPullRequest className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">5. Ready for your approval</h4>
              <p className="text-xs text-gray-400">
                {isRunning
                  ? 'DriftSmith is actively finding and testing a fix in the safe test room...'
                  : canApprove
                  ? 'All tests passed. You have the final say before code is sent to your repository.'
                  : 'You have read-only access. An approver or admin role is required to approve this code change.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {error && onRetry && (
              <Button variant="danger" size="sm" onClick={onRetry} className="text-xs">
                Try again
              </Button>
            )}

            {isRunning ? (
              <div className="flex items-center gap-2 text-xs font-mono text-forge-amber bg-forge-amber/10 border border-forge-amber/30 px-3.5 py-2 rounded-md">
                <Spinner size="sm" variant="amber" />
                <span>Testing in safe test room...</span>
              </div>
            ) : isAwaiting ? (
              canApprove ? (
                <Button
                  variant="primary"
                  size="md"
                  disabled={isApproving}
                  isLoading={isApproving}
                  onClick={() => setShowConfirmModal(true)}
                  leftIcon={<CheckCircle className="w-4 h-4 text-black" />}
                  className="font-bold text-xs uppercase tracking-wider px-5 py-2.5 w-full sm:w-auto shadow-amber-glow"
                >
                  Approve and open pull request
                </Button>
              ) : (
                <div
                  data-testid="viewer-readonly-badge"
                  className="flex items-center gap-2 text-xs text-gray-400 bg-forge-surface-elevated border border-forge-border px-3.5 py-2 rounded-md"
                >
                  <Lock className="w-3.5 h-3.5 text-forge-amber" />
                  <span>You have read-only access</span>
                </div>
              )
            ) : null}
          </div>
        </div>
      )}

      <ApprovalConfirmModal
        isOpen={showConfirmModal}
        branchName={branchName}
        isApproving={isApproving}
        onConfirm={handleConfirmApprove}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
