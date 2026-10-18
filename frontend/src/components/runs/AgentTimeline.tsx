// Real-time multi-agent activity stream container.
// Auto-scrolls as agents generate thoughts, actions, and sandbox verification passes.

import React, { useEffect, useRef } from 'react';
import { Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { RunEvent } from '@/api/types';
import { TimelineEvent } from './TimelineEvent';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export interface AgentTimelineProps {
  events: RunEvent[];
  isStreaming: boolean;
  isFinished: boolean;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  events,
  isStreaming,
  isFinished,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest event
  useEffect(() => {
    if (scrollRef.current && isStreaming) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [events.length, isStreaming]);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="py-3 px-4 bg-forge-surface-elevated/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-forge-amber" />
            <h3 className="text-sm font-semibold text-white">Agent Execution Trace</h3>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-xs text-forge-amber font-mono">
                <span className="w-2 h-2 rounded-full bg-forge-amber animate-ping" />
                Active Run
              </span>
            )}
            {isFinished && (
              <span className="flex items-center gap-1 text-xs text-forge-green font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finished
              </span>
            )}
            <span className="text-xs font-mono text-gray-500">
              {events.length} {events.length === 1 ? 'step' : 'steps'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto max-h-[640px] space-y-1"
      >
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-xs flex flex-col items-center gap-2">
            <Sparkles className="w-5 h-5 text-forge-amber animate-spin" />
            <span>Awaiting telemetry stream from autonomous agent...</span>
          </div>
        ) : (
          events.map((evt, idx) => (
            <TimelineEvent
              key={evt.id || idx}
              event={evt}
              isLast={idx === events.length - 1 && !isStreaming}
            />
          ))
        )}

        {/* Shimmer Thinking Indicator for active step */}
        {isStreaming && (
          <div className="relative pl-8 pt-2 pb-2">
            <div className="absolute left-0 top-2.5 w-7 h-7 rounded-full border border-forge-amber/40 bg-forge-amber/10 text-forge-amber flex items-center justify-center animate-spin">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="shimmer-bg rounded-lg border border-forge-amber/30 p-3 text-xs font-mono text-forge-amber-light flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forge-amber animate-ping" />
                Agent actively reasoning in sandbox container...
              </span>
              <span className="text-[10px] text-gray-500 font-mono uppercase">Thinking</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
