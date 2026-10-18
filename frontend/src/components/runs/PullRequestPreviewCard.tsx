// Pull request preview card shown after a human approves a remediation run.
// Displays the generated PR title, git branch, and description with copy action.

import React, { useState } from 'react';
import { CheckCircle, Copy, Check, FileText, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PullRequestPreviewCardProps {
  prTitle: string;
  branchName: string;
  prDescription: string;
}

export const PullRequestPreviewCard: React.FC<PullRequestPreviewCardProps> = ({
  prTitle,
  branchName,
  prDescription,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(prDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
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
          leftIcon={
            copied ? (
              <Check className="w-3.5 h-3.5 text-forge-green" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )
          }
          className="text-xs font-mono"
        >
          {copied ? 'Copied description' : 'Copy PR description'}
        </Button>
      </div>

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
  );
};
