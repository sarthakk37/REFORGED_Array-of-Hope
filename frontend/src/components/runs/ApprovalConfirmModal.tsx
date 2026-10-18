// Confirmation modal dialog presented before approving an automated code fix.
// Informs the operator of the exact branch creation and test verification guarantees.

import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface ApprovalConfirmModalProps {
  isOpen: boolean;
  branchName: string;
  isApproving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ApprovalConfirmModal: React.FC<ApprovalConfirmModalProps> = ({
  isOpen,
  branchName,
  isApproving,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Fix and Open Pull Request"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isApproving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
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
  );
};
