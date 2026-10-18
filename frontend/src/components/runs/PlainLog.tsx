// Live event feed with friendly role names (Detector, Investigator, Code writer, Reviewer, Tester, Reporter).
// Each entry features a plain-English explanation and an expandable technical details dropdown.

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Bot,
  Radar,
  FileCode,
  ShieldCheck,
  Brain,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { RunEvent } from '@/api/types';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/classNames';

export interface PlainLogProps {
  events: RunEvent[];
  isStreaming: boolean;
  isFinished: boolean;
}

export const PlainLog: React.FC<PlainLogProps> = ({ events, isStreaming, isFinished }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isStreaming) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [events.length, isStreaming]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'detector':
        return Radar;
      case 'investigator':
        return AlertTriangle;
      case 'code writer':
        return FileCode;
      case 'reviewer':
        return AlertTriangle;
      case 'tester':
        return ShieldCheck;
      case 'memory':
        return Brain;
      default:
        return Bot;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-forge-amber" />
            <h3 className="text-sm font-bold text-white">What DriftSmith is doing</h3>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-xs text-forge-amber font-mono">
                <span className="w-2 h-2 rounded-full bg-forge-amber animate-ping" />
                Working...
              </span>
            )}
            {isFinished && (
              <span className="text-xs text-forge-green font-mono">
                ✓ All steps complete
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        ref={scrollRef}
        className="p-4 max-h-80 overflow-y-auto space-y-2.5 font-sans"
      >
        {events.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
            <Sparkles className="w-5 h-5 text-forge-amber animate-spin" />
            <span>Connecting to live activity stream...</span>
          </div>
        ) : (
          events.map((evt) => {
            const friendlyRole =
              (evt.payload?.friendlyRole as string) ||
              (evt.agent === 'sentinel'
                ? 'Detector'
                : evt.agent === 'triage'
                ? 'Investigator'
                : evt.agent === 'coder' || evt.agent === 'locator'
                ? 'Code writer'
                : evt.agent === 'critic'
                ? 'Reviewer'
                : evt.agent === 'verifier'
                ? 'Tester'
                : evt.agent === 'memory'
                ? 'Memory'
                : 'Reporter');

            const isError = evt.kind === 'error';
            const isRetry = Boolean(evt.payload?.isRetry);
            const isExpanded = Boolean(expandedIds[evt.id]);
            const Icon = getRoleIcon(friendlyRole);

            // Filter out system run_finished event from the user-facing log
            if (evt.message === 'run_finished') return null;

            return (
              <div
                key={evt.id}
                className={cn(
                  'p-3 rounded-lg border text-xs transition-all duration-200 animate-fadeIn',
                  isError
                    ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                    : isRetry
                    ? 'bg-forge-amber/10 border-forge-amber/30 text-forge-amber-light'
                    : 'bg-forge-surface-elevated/70 border-forge-border text-gray-200'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
                        isError
                          ? 'bg-rose-900/40 text-rose-300'
                          : isRetry
                          ? 'bg-forge-amber/20 text-forge-amber'
                          : 'bg-forge-bg text-gray-300'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white font-mono text-[11px]">
                          {friendlyRole}
                        </span>
                        {isRetry && (
                          <span className="text-[10px] font-mono uppercase bg-forge-amber/20 text-forge-amber px-1.5 py-0.2 rounded font-semibold">
                            Retrying
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed text-xs">{evt.message}</p>
                    </div>
                  </div>

                  {/* Toggle technical details */}
                  {evt.payload && Object.keys(evt.payload).length > 0 && (
                    <button
                      onClick={() => toggleExpand(evt.id)}
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-0.5 text-[11px] font-mono flex-shrink-0 focus:outline-none"
                    >
                      <span>details</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expandable Technical Details */}
                {isExpanded && evt.payload && (
                  <div className="mt-2.5 pt-2 border-t border-forge-border/60">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 mb-1">
                      <Terminal className="w-3 h-3 text-forge-amber" />
                      <span>Technical log payload</span>
                    </div>
                    <pre className="p-2 rounded bg-black/50 text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
