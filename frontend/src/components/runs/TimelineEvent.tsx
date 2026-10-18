// Single event node in the AgentTimeline.
// Color codes agent personas and formats thought traces, actions, and errors.

import React, { useState } from 'react';
import {
  Radar,
  Sparkles,
  Target,
  Code2,
  AlertCircle,
  FlaskConical,
  Brain,
  GitPullRequest,
  Cpu,
  ChevronDown,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { RunEvent, AgentName } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/classNames';

export interface TimelineEventProps {
  event: RunEvent;
  isLast?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ event, isLast = false }) => {
  const [showPayload, setShowPayload] = useState(false);

  const getAgentConfig = (agent: AgentName) => {
    switch (agent) {
      case 'sentinel':
        return {
          label: 'Sentinel',
          icon: Radar,
          color: 'text-forge-cyan',
          border: 'border-forge-cyan/40',
          bg: 'bg-forge-cyan/10',
        };
      case 'triage':
        return {
          label: 'Triage Agent',
          icon: Sparkles,
          color: 'text-forge-amber',
          border: 'border-forge-amber/40',
          bg: 'bg-forge-amber/10',
        };
      case 'locator':
        return {
          label: 'Code Locator',
          icon: Target,
          color: 'text-blue-400',
          border: 'border-blue-500/40',
          bg: 'bg-blue-500/10',
        };
      case 'coder':
        return {
          label: 'Patch Synthesizer',
          icon: Code2,
          color: 'text-forge-amber-light',
          border: 'border-forge-amber/50',
          bg: 'bg-forge-amber/15',
        };
      case 'critic':
        return {
          label: 'Critic & Reviewer',
          icon: AlertCircle,
          color: 'text-pink-400',
          border: 'border-pink-500/40',
          bg: 'bg-pink-500/10',
        };
      case 'verifier':
        return {
          label: 'Sandbox Verifier',
          icon: FlaskConical,
          color: 'text-forge-green',
          border: 'border-forge-green/40',
          bg: 'bg-forge-green/10',
        };
      case 'memory':
        return {
          label: 'Pattern Memory',
          icon: Brain,
          color: 'text-purple-400',
          border: 'border-purple-500/40',
          bg: 'bg-purple-500/10',
        };
      case 'pr':
        return {
          label: 'PR Automator',
          icon: GitPullRequest,
          color: 'text-emerald-400',
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
        };
      case 'system':
      default:
        return {
          label: 'System',
          icon: Cpu,
          color: 'text-gray-400',
          border: 'border-forge-border',
          bg: 'bg-forge-surface-elevated',
        };
    }
  };

  const agentConfig = getAgentConfig(event.agent);
  const Icon = agentConfig.icon;

  const getKindBadgeVariant = (kind: RunEvent['kind']) => {
    switch (kind) {
      case 'thought':
        return 'cyan';
      case 'action':
        return 'amber';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'amber';
      default:
        return 'default';
    }
  };

  return (
    <div className="relative pl-8 pb-6 last:pb-2 group">
      {/* Vertical connection line */}
      {!isLast && (
        <div className="absolute left-3.5 top-8 bottom-0 w-px bg-forge-border group-last:hidden" />
      )}

      {/* Node Icon */}
      <div
        className={cn(
          'absolute left-0 top-0.5 w-7 h-7 rounded-full border flex items-center justify-center transition-all',
          agentConfig.bg,
          agentConfig.border,
          agentConfig.color
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Event Content Card */}
      <div className="rounded-lg border border-forge-border bg-forge-surface p-3.5 transition-colors hover:border-forge-border/80">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-mono font-semibold', agentConfig.color)}>
              {agentConfig.label}
            </span>
            <Badge variant={getKindBadgeVariant(event.kind)} size="sm">
              {event.kind}
            </Badge>
          </div>
          <span className="text-[11px] font-mono text-gray-500">
            #{event.seq}
          </span>
        </div>

        {/* Message */}
        <p
          className={cn(
            'text-xs leading-relaxed',
            event.kind === 'thought'
              ? 'italic text-gray-300 font-mono'
              : event.kind === 'error'
              ? 'text-red-300 font-mono font-medium'
              : event.kind === 'success'
              ? 'text-green-200'
              : 'text-gray-200'
          )}
        >
          {event.message}
        </p>

        {/* Collapsible Telemetry / Payload */}
        {event.payload && Object.keys(event.payload).length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-forge-border/50">
            <button
              onClick={() => setShowPayload(!showPayload)}
              className="flex items-center gap-1 text-[11px] font-mono text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showPayload ? (
                <ChevronDown className="w-3 h-3 text-forge-amber" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
              <Terminal className="w-3 h-3 text-forge-amber" />
              <span>Diagnostic Payload</span>
            </button>

            {showPayload && (
              <pre className="mt-2 p-2 rounded bg-black/40 border border-forge-border text-[11px] font-mono text-gray-300 overflow-x-auto">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
