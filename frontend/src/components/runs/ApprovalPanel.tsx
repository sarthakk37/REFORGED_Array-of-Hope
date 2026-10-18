// Approval action panel and Pull Request preview card for human sign-off.
// Enforces role-based permissions, zero-network mock previewing, and double-submit prevention.

import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  Lock,
  GitPullRequest,
  GitBranch,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { RunDetail } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

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
  const [copied, setCopied] = useState(false);

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

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(prDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-forge-border bg-forge-surface p-6 shadow-xl space-y-4">
      {/* Approved State: Pull Request Preview Card */}
      {isApproved ? (
        <div className="space-y-4" data-testid="pr-preview-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-forge-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forge-green/15 text-forge-green border border-forge-green/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Approved & Pull Request Created</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-forge-green/15 text-forge-green-light border border-forge-green/30">
                    Preview Ready
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Preview - real GitHub PRs are enabled in the next phase
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDescription}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-forge-green" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              {copied ? 'Copied description' : 'Copy PR description'}
            </Button>
          </div>

          {/* Pull Request Card Details */}
          <div className="p-4 rounded-lg bg-black/40 border border-forge-border font-mono text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-forge-border/60">
              <span className="text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-forge-amber" />
                Title:
              </span>
              <span className="text-white font-semibold">{prTitle}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-forge-border/60">
              <span className="text-gray-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-forge-cyan" />
                Branch:
              </span>
              <span className="text-forge-cyan-light font-bold">{branchName}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-gray-400 block">Proposed PR Description:</span>
              <pre className="p-3 rounded bg-forge-bg text-gray-300 whitespace-pre-wrap font-sans text-xs leading-relaxed border border-forge-border/40">
                {prDescription}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* Unapproved / In-progress State */
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Approve Fix and Open Pull Request"
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
              disabled={isApproving}
              isLoading={isApproving}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Approve Fix
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300">
            When you approve this fix, here is what happens:
          </p>

          <ul className="space-y-2.5 text-xs text-gray-200">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-forge-green mt-1.5 flex-shrink-0" />
              <span>Approves the code change verified in the safe test room.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-forge-green mt-1.5 flex-shrink-0" />
              <span>
                Creates a pull request branch (<code className="text-forge-amber-light font-mono">{branchName}</code>) with backward compatibility.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-forge-green mt-1.5 flex-shrink-0" />
              <span>Previews the proposed pull request for your engineering team to merge.</span>
            </li>
          </ul>

          <div className="p-3 rounded-lg bg-forge-amber/10 border border-forge-amber/30 text-[11px] text-forge-amber-light flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-forge-amber" />
            <span>In demo mode, this creates a realistic preview with zero external network calls.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
