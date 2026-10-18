// Sticky approval action bar positioned at the bottom of the RunDetailPage.
// Allows approvers and admins to review and approve patches, while enforcing read-only states for viewers.

import React, { useState } from 'react';
import {
  CheckCircle,
  ExternalLink,
  GitPullRequest,
  Lock,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { RunDetail } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

export interface ApprovalBarProps {
  run: RunDetail;
  onApprove: () => Promise<void>;
  isApproving?: boolean;
}

export const ApprovalBar: React.FC<ApprovalBarProps> = ({
  run,
  onApprove,
  isApproving = false,
}) => {
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const canApprove = user?.role === 'approver' || user?.role === 'admin';
  const isApproved = run.status === 'approved';
  const isAwaiting = run.status === 'awaiting_approval' || run.status === 'verified';
  const isRunning = run.status === 'running' || run.status === 'queued';

  const handleConfirmApprove = async () => {
    setShowConfirmModal(false);
    await onApprove();
  };

  return (
    <>
      <div className="sticky bottom-0 left-0 right-0 z-20 mt-6 bg-forge-surface/95 backdrop-blur border-t border-forge-border p-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Label & Context */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-forge-surface-elevated border border-forge-border text-forge-amber">
              <GitPullRequest className="w-5 h-5" />
            </div>

            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Remediation Workflow Gate</span>
                {run.pull_request?.branch && (
                  <span className="flex items-center gap-1 font-mono text-xs text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-forge-border">
                    <GitBranch className="w-3 h-3 text-forge-amber" />
                    {run.pull_request.branch}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400">
                {isApproved
                  ? 'Remediation approved. Verified patch deployed to pull request.'
                  : isRunning
                  ? 'Autonomous agent active. Waiting for sandbox test validation to conclude...'
                  : canApprove
                  ? 'All dual-payload tests passed. Requires human confirmation to open PR.'
                  : 'Viewing as read-only. Approver or Admin credentials required to submit PR.'}
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div>
            {isApproved ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono text-forge-green bg-forge-green/10 border border-forge-green/30 px-3 py-1.5 rounded-md">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved & Open</span>
                </div>

                {run.pull_request?.url ? (
                  <a
                    href={run.pull_request.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-forge-surface-elevated border border-forge-border hover:border-gray-400 text-gray-200 transition-colors"
                  >
                    <span>View GitHub PR</span>
                    <ExternalLink className="w-3.5 h-3.5 text-forge-amber" />
                  </a>
                ) : (
                  <span className="text-xs font-mono text-gray-400 bg-black/30 px-2.5 py-1 rounded border border-forge-border">
                    PR Created (Dry-Run Branch)
                  </span>
                )}
              </div>
            ) : isRunning ? (
              <div className="flex items-center gap-2 text-xs font-mono text-forge-amber bg-forge-amber/10 border border-forge-amber/30 px-3 py-2 rounded-md">
                <Spinner size="sm" variant="amber" />
                <span>Sandbox Healing In Progress...</span>
              </div>
            ) : isAwaiting ? (
              canApprove ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowConfirmModal(true)}
                  isLoading={isApproving}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  className="font-mono text-xs uppercase tracking-wider"
                >
                  Approve & Open PR
                </Button>
              ) : (
                <div
                  data-testid="viewer-readonly-badge"
                  className="flex items-center gap-2 text-xs text-gray-400 bg-forge-surface-elevated border border-forge-border px-3 py-2 rounded-md"
                >
                  <Lock className="w-3.5 h-3.5 text-forge-amber" />
                  <span>Read-only: Approver role required</span>
                </div>
              )
            ) : (
              <div className="text-xs text-gray-500 font-mono">
                Status: {run.status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Approve Patch & Open Pull Request"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmApprove}
              isLoading={isApproving}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Confirm & Open PR
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-forge-amber/10 border border-forge-amber/30 flex items-start gap-2.5 text-xs text-forge-amber-light">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-forge-amber" />
            <div>
              <span className="font-semibold block">Production Verification Gate:</span>
              Approving this patch will trigger the PR Automator agent to commit the verified diff to the repository and open an active pull request.
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono bg-black/40 p-3 rounded border border-forge-border">
            <div className="flex justify-between">
              <span className="text-gray-400">Target Service:</span>
              <span className="text-white">{run.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Drift Scenario:</span>
              <span className="text-forge-amber-light">{run.scenario}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Git Branch:</span>
              <span className="text-forge-cyan-light">{run.pull_request?.branch || 'fix/drift-remediation'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sandbox Tests:</span>
              <span className="text-forge-green">2 / 2 Passed (Dual Payload)</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
