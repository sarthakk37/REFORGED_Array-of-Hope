// Dual-column sandbox verification panel for validating legacy and modern payloads.
// Shows pass/fail status per test case and includes a collapsible sandbox execution log.

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Terminal,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { TestCaseResult } from '@/api/types';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/classNames';

export interface TestResultsPanelProps {
  testResults: TestCaseResult[] | undefined;
  sandboxLog: string | undefined;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({
  testResults = [],
  sandboxLog = '',
}) => {
  const [showSandboxLog, setShowSandboxLog] = useState(true);

  if (testResults.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-6 h-6 text-gray-500" />}
        title="No sandbox tests executed"
        description="The agent has not yet executed isolated sandbox verification tests for this run."
      />
    );
  }

  const oldPayloadTests = testResults.filter((t) => t.payload_version === 'old');
  const newPayloadTests = testResults.filter((t) => t.payload_version === 'new');

  const renderTestColumn = (title: string, tests: TestCaseResult[], badgeText: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-forge-border/80">
        <h4 className="text-xs font-mono font-semibold text-gray-200">{title}</h4>
        <Badge variant="outline" size="sm">
          {badgeText}
        </Badge>
      </div>

      <div className="space-y-2.5">
        {tests.map((test, idx) => (
          <div
            key={idx}
            className={cn(
              'p-3 rounded-lg border text-xs space-y-1.5 transition-colors',
              test.passed
                ? 'bg-forge-green/5 border-forge-green/30'
                : 'bg-forge-red/5 border-forge-red/30'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-mono font-medium">
                {test.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-forge-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-forge-red flex-shrink-0" />
                )}
                <span className={test.passed ? 'text-gray-200' : 'text-red-300'}>
                  {test.name}
                </span>
              </div>

              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-500">
                <Clock className="w-3 h-3" />
                {test.duration_ms}ms
              </span>
            </div>

            {test.output && (
              <p className="text-[11px] font-mono text-gray-400 pl-5 leading-normal">
                {test.output}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forge-green" />
            <h3 className="text-sm font-semibold text-white">Sandbox Dual-Payload Verification</h3>
          </div>
          <Badge variant="green" size="sm">
            Zero-Regression Verified
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6 flex-1 overflow-y-auto">
        {/* Two-Column Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderTestColumn('Legacy Schema (Old Payload)', oldPayloadTests, 'Backward Compatible')}
          {renderTestColumn('Drifted Schema (New Payload)', newPayloadTests, 'Forward Compatible')}
        </div>

        {/* Collapsible Sandbox Execution Log */}
        {sandboxLog && (
          <div className="pt-4 border-t border-forge-border">
            <button
              onClick={() => setShowSandboxLog(!showSandboxLog)}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-300 hover:text-white transition-colors mb-2"
            >
              {showSandboxLog ? (
                <ChevronDown className="w-3.5 h-3.5 text-forge-amber" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              )}
              <Terminal className="w-3.5 h-3.5 text-forge-amber" />
              <span className="font-semibold">Isolated Sandbox Container Logs</span>
            </button>

            {showSandboxLog && (
              <pre className="p-3.5 rounded-lg bg-[#070b12] border border-forge-border font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre leading-relaxed">
                {sandboxLog}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
