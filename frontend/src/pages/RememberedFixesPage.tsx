// Remembered Fixes page showing recipes stored in memory for instant zero-AI remediation.
// Plain English cards explaining what fix is applied with consistent times used and AI calls saved.

import React from 'react';
import { Brain, Zap, Clock, ShieldCheck } from 'lucide-react';
import { usePatterns } from '@/hooks/usePatterns';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/formatDate';

export const RememberedFixesPage: React.FC = () => {
  const { data: patterns = [], isLoading } = usePatterns();

  // Consistent metric: 4 AI calls saved per remembered fix application
  const totalTimesUsed = patterns.reduce((sum, p) => sum + p.times_used, 0);
  const totalAiCallsSaved = totalTimesUsed * 4;

  return (
    <div className="max-w-[1100px] mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="pb-3 border-b border-forge-border">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-purple-400" />
          <span>Fixes DriftSmith remembers</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          When a problem has been solved once, DriftSmith fixes it instantly next time with 0 AI calls
        </p>
      </div>

      {/* Explainer Summary Box */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-forge-surface to-forge-surface">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-forge-amber" />
                <span>Instant fix from memory (no AI needed)</span>
              </div>
              <h2 className="text-base font-bold text-white">
                How remembered fixes work
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                When DriftSmith investigates a breaking API change and proves a fix in the safe test room, it saves the verified fix recipe. If another app or future request encounters that exact change, DriftSmith skips the AI code-writing step completely and applies the safe fix in ~5 seconds.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/30 flex flex-col items-center justify-center text-center min-w-[220px]">
              <span className="text-3xl font-extrabold font-mono text-purple-300">
                {totalAiCallsSaved}
              </span>
              <span className="text-xs font-mono text-gray-300 mt-1">Total AI Calls Saved</span>
              <span className="text-[11px] text-forge-green font-mono mt-0.5 font-semibold">
                Used {totalTimesUsed} times across your apps
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Remembered Fix Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Active Remembered Fixes ({patterns.length})
          </h3>
          <Badge variant="purple" size="sm">
            Demo Data
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" variant="amber" />
            <span className="text-xs font-mono text-gray-400">Loading remembered fixes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pat) => (
              <Card key={pat.id} className="border-forge-border hover:border-purple-500/40 transition-colors">
                <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {pat.id}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-forge-green bg-forge-green/10 border border-forge-green/30 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Ready to apply
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-white leading-relaxed font-sans">
                    "{pat.summary}"
                  </p>

                  <div className="pt-3 border-t border-forge-border/60 flex items-center justify-between text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-1.5 text-purple-200">
                      <Zap className="w-3.5 h-3.5 text-forge-amber" />
                      <span>Used {pat.times_used} times</span>
                      <span className="text-gray-500">({pat.times_used * 4} AI calls saved)</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(pat.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
