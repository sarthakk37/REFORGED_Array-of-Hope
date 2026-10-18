// Side-by-side code diff panel explaining what changed and why the fix is safe.
// Explains backward and forward data safety in plain English.

import React from 'react';
import { FileCode, CheckCircle2 } from 'lucide-react';
import { PatchInfo } from '@/api/types';
import { parseUnifiedDiff, buildSideBySideRows } from '@/lib/diff';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/classNames';

export interface FixDiffProps {
  patch: PatchInfo | null;
  plainCaption?: string;
}

export const FixDiff: React.FC<FixDiffProps> = ({ patch, plainCaption }) => {
  if (!patch || !patch.diff_text) {
    return null;
  }

  const parsed = parseUnifiedDiff(patch.diff_text);
  const filePath = parsed.newPath || parsed.oldPath || 'services/payment_webhook.py';
  const explanation =
    plainCaption ||
    patch.plan_summary ||
    'Safe fix: Designed to handle the new format while keeping the old format working.';

  return (
    <Card className="overflow-hidden" data-testid="remediation-diff">
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-forge-amber" />
            <h3 className="text-sm font-bold text-white">The fix (Code change)</h3>
            <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-forge-border ml-2">
              {filePath}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-forge-green font-mono bg-forge-green/10 border border-forge-green/30 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Safe: works with old & new data</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Plain caption */}
        <div className="p-3.5 rounded-lg bg-forge-surface-elevated border border-forge-border text-xs text-gray-200 leading-relaxed font-sans">
          <span className="font-bold text-white block mb-0.5">How this fix works:</span>
          {explanation}
        </div>

        {/* Side-by-side diff */}
        <div className="rounded-lg border border-forge-border overflow-hidden bg-[#090d14] font-mono text-xs">
          <div className="grid grid-cols-2 divide-x divide-forge-border bg-forge-bg text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-forge-border select-none px-3 py-1.5">
            <span className="text-rose-400">YOUR OLD CODE (Breaks with new data)</span>
            <span className="text-emerald-400 pl-3">DRIFTSMITH FIX (Works with both)</span>
          </div>

          <div className="divide-y divide-forge-border/30 overflow-x-auto">
            {parsed.hunks.map((hunk, hIdx) => {
              const rows = buildSideBySideRows(hunk);

              return (
                <div key={hIdx}>
                  {rows.map((row, rIdx) => {
                    const left = row.left;
                    const right = row.right;

                    return (
                      <div
                        key={rIdx}
                        className="grid grid-cols-2 divide-x divide-forge-border/40 text-xs hover:bg-white/5 transition-colors"
                      >
                        {/* Left Side (Old) */}
                        <div
                          className={cn(
                            'flex items-stretch overflow-hidden py-1 px-2.5',
                            left?.type === 'delete' && 'bg-rose-950/30 text-rose-200 font-semibold'
                          )}
                        >
                          <span className="w-8 text-right select-none text-[11px] text-gray-600 mr-2 flex-shrink-0">
                            {left?.oldLineNumber ?? ''}
                          </span>
                          <span className="w-4 text-center select-none font-bold text-rose-400 flex-shrink-0">
                            {left?.type === 'delete' ? '-' : ''}
                          </span>
                          <pre className="whitespace-pre overflow-x-auto font-mono text-xs flex-1">
                            {left?.text ?? ''}
                          </pre>
                        </div>

                        {/* Right Side (New) */}
                        <div
                          className={cn(
                            'flex items-stretch overflow-hidden py-1 px-2.5',
                            right?.type === 'add' && 'bg-emerald-950/30 text-emerald-200 font-semibold'
                          )}
                        >
                          <span className="w-8 text-right select-none text-[11px] text-gray-600 mr-2 flex-shrink-0">
                            {right?.newLineNumber ?? ''}
                          </span>
                          <span className="w-4 text-center select-none font-bold text-emerald-400 flex-shrink-0">
                            {right?.type === 'add' ? '+' : ''}
                          </span>
                          <pre className="whitespace-pre overflow-x-auto font-mono text-xs flex-1">
                            {right?.text ?? ''}
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
