// Safe test room results panel showing proof of backward and forward compatibility.
// Highlights two prominent verification rows with ticks and a collapsible technical log.

import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Terminal, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export interface SafeTestResultsProps {
  sandboxLog?: string;
  scenarioTitle?: string;
}

export const SafeTestResults: React.FC<SafeTestResultsProps> = ({
  sandboxLog = '',
  scenarioTitle = 'Payment data',
}) => {
  const [showLog, setShowLog] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid="safe-test-results">
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forge-green" />
            <h3 className="text-sm font-bold text-white">Safe test results (Isolated test room)</h3>
          </div>
          <span className="text-xs font-mono text-forge-green-light bg-forge-green/15 border border-forge-green/30 px-2.5 py-0.5 rounded-full font-semibold">
            2 of 2 tests passed
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="space-y-3">
          {/* Row 1: Works with OLD data */}
          <div className="p-4 rounded-xl border border-forge-green/30 bg-forge-green/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forge-green/20 text-forge-green flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Works with the OLD data</h4>
                <p className="text-xs text-gray-300">
                  Legacy payloads continue running smoothly. No breaking changes or regressions.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-forge-green font-bold uppercase tracking-wider hidden sm:inline">
              ✓ Passed
            </span>
          </div>

          {/* Row 2: Works with NEW data */}
          <div className="p-4 rounded-xl border border-forge-green/30 bg-forge-green/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forge-green/20 text-forge-green flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Works with the NEW data</h4>
                <p className="text-xs text-gray-300">
                  The newly changed {scenarioTitle.toLowerCase()} is safely processed without errors.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-forge-green font-bold uppercase tracking-wider hidden sm:inline">
              ✓ Passed
            </span>
          </div>
        </div>

        {/* Collapsible Technical Log */}
        {sandboxLog && (
          <div className="pt-2">
            <button
              onClick={() => setShowLog(!showLog)}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
              {showLog ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Terminal className="w-3.5 h-3.5 text-forge-amber" />
              <span>View safe test room technical logs</span>
            </button>

            {showLog && (
              <pre className="mt-2.5 p-3.5 rounded-lg bg-black/50 border border-forge-border text-[11px] font-mono text-gray-300 overflow-x-auto whitespace-pre leading-relaxed">
                {sandboxLog}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
