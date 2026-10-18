// Ingestion source indicator badge (n8n, webhook, CI, manual) with external reference pill.
// Highlights n8n workflow triggers in orange with an execution link/reference.

import React from 'react';
import { Workflow, Globe, GitPullRequest, Terminal } from 'lucide-react';
import { RunSource } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/classNames';

export interface RunSourceBadgeProps {
  source?: RunSource;
  externalRef?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export const RunSourceBadge: React.FC<RunSourceBadgeProps> = ({
  source = 'manual',
  externalRef,
  size = 'sm',
  className,
}) => {
  const isN8n = source === 'n8n';

  return (
    <div
      data-testid="run-source-indicator"
      className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}
    >
      {isN8n && (
        <Badge
          data-testid="n8n-badge"
          variant="orange"
          size={size}
          className="font-bold tracking-normal normal-case"
        >
          <Workflow className="w-3 h-3 text-orange-400" />
          <span>n8n</span>
        </Badge>
      )}

      {source === 'webhook' && (
        <Badge
          variant="cyan"
          size={size}
          className="font-mono tracking-normal normal-case"
        >
          <Globe className="w-3 h-3 text-forge-cyan" />
          <span>webhook</span>
        </Badge>
      )}

      {source === 'ci' && (
        <Badge
          variant="purple"
          size={size}
          className="font-mono tracking-normal normal-case"
        >
          <GitPullRequest className="w-3 h-3 text-purple-400" />
          <span>CI</span>
        </Badge>
      )}

      {source === 'manual' && (
        <Badge
          variant="default"
          size={size}
          className="font-mono tracking-normal normal-case"
        >
          <Terminal className="w-3 h-3 text-gray-400" />
          <span>manual</span>
        </Badge>
      )}

      {externalRef && (
        <span
          data-testid="external-ref-pill"
          title={`External reference: ${externalRef}`}
          className={cn(
            'inline-flex items-center gap-0.5 font-mono text-[10px] px-1.5 py-0.5 rounded border shadow-sm',
            isN8n
              ? 'bg-orange-950/40 text-orange-300 border-orange-500/30'
              : 'bg-black/40 text-gray-400 border-forge-border'
          )}
        >
          <span className="opacity-60">{isN8n ? 'n8n #' : '#'}</span>
          <span>{externalRef.replace(/^(workflow-|n8n-exec-)/, '')}</span>
        </span>
      )}
    </div>
  );
};
