// Handcrafted unified and side-by-side code diff viewer for synthesized patches.
// Highlights added/deleted lines, shows line numbers, and toggles views cleanly.

import React, { useState, useMemo } from 'react';
import { Columns, AlignJustify, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';
import { PatchInfo } from '@/api/types';
import { parseUnifiedDiff, buildSideBySideRows } from '@/lib/diff';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/classNames';

export interface DiffViewerProps {
  patch: PatchInfo | null;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patch }) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    return parseUnifiedDiff(patch?.diff_text || '');
  }, [patch?.diff_text]);

  if (!patch || !patch.diff_text) {
    return (
      <EmptyState
        icon={<FileCode className="w-6 h-6 text-gray-500" />}
        title="No patch generated"
        description="The agent has not yet produced a verified code diff for this run."
      />
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(patch.diff_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filePath = parsed.newPath || parsed.oldPath || 'services/payment_webhook.py';

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header with path, copy button, and view mode toggle */}
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-forge-amber" />
            <span className="font-mono text-xs font-semibold text-gray-200">
              {filePath}
            </span>
            {patch.verified && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-forge-green bg-forge-green/10 border border-forge-green/30 px-2 py-0.5 rounded-full ml-2">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-black/40 border border-forge-border rounded-md p-0.5">
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors',
                  viewMode === 'split'
                    ? 'bg-forge-surface-elevated text-forge-amber-light shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                )}
                title="Split Side-by-Side View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>

              <button
                onClick={() => setViewMode('unified')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors',
                  viewMode === 'unified'
                    ? 'bg-forge-surface-elevated text-forge-amber-light shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                )}
                title="Unified Diff View"
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unified</span>
              </button>
            </div>

            {/* Copy Diff Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs font-mono h-7 px-2.5"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-forge-green" />
                  <span className="text-forge-green">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-gray-400" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Plan Summary Callout */}
      {patch.plan_summary && (
        <div className="px-5 py-2.5 bg-forge-bg border-b border-forge-border text-xs text-gray-300 font-sans flex items-start gap-2">
          <span className="font-semibold text-forge-amber-light font-mono text-[11px] uppercase tracking-wider">
            Patch Strategy:
          </span>
          <span>{patch.plan_summary}</span>
        </div>
      )}

      {/* Diff Content View */}
      <CardContent className="p-0 overflow-x-auto flex-1 bg-[#090d14] font-mono text-xs">
        {viewMode === 'unified' ? (
          /* Unified Diff View */
          <div className="min-w-full divide-y divide-forge-border/30">
            {parsed.hunks.map((hunk, hIdx) => (
              <div key={hIdx}>
                {/* Hunk Header */}
                <div className="bg-[#101726] text-forge-cyan-light px-4 py-1 text-[11px] font-mono select-none border-y border-forge-border/40">
                  {hunk.header}
                </div>

                {/* Hunk Lines */}
                {hunk.lines.map((line, lIdx) => {
                  const isAdd = line.type === 'add';
                  const isDel = line.type === 'delete';

                  return (
                    <div
                      key={lIdx}
                      className={cn(
                        'flex items-stretch hover:bg-white/5 transition-colors',
                        isAdd && 'bg-emerald-950/25 text-emerald-200',
                        isDel && 'bg-rose-950/25 text-rose-300'
                      )}
                    >
                      {/* Old Line Number */}
                      <span className="w-12 py-0.5 px-2 text-right select-none text-[11px] text-gray-600 bg-black/30 border-r border-forge-border/30">
                        {line.oldLineNumber ?? ''}
                      </span>
                      {/* New Line Number */}
                      <span className="w-12 py-0.5 px-2 text-right select-none text-[11px] text-gray-600 bg-black/30 border-r border-forge-border/30">
                        {line.newLineNumber ?? ''}
                      </span>
                      {/* Diff Prefix (+ / - / ' ') */}
                      <span
                        className={cn(
                          'w-6 py-0.5 text-center select-none font-bold',
                          isAdd && 'text-emerald-400',
                          isDel && 'text-rose-400',
                          !isAdd && !isDel && 'text-gray-600'
                        )}
                      >
                        {isAdd ? '+' : isDel ? '-' : ' '}
                      </span>
                      {/* Code Content */}
                      <pre className="py-0.5 px-2 whitespace-pre overflow-x-visible font-mono text-xs">
                        {line.text}
                      </pre>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Side-by-Side Diff View */
          <div className="min-w-full divide-y divide-forge-border/30">
            {parsed.hunks.map((hunk, hIdx) => {
              const rows = buildSideBySideRows(hunk);

              return (
                <div key={hIdx}>
                  {/* Hunk Header */}
                  <div className="bg-[#101726] text-forge-cyan-light px-4 py-1 text-[11px] font-mono select-none border-y border-forge-border/40">
                    {hunk.header}
                  </div>

                  {rows.map((row, rIdx) => {
                    const left = row.left;
                    const right = row.right;

                    return (
                      <div
                        key={rIdx}
                        className="grid grid-cols-2 divide-x divide-forge-border/40 border-b border-forge-border/20 text-xs hover:bg-white/5 transition-colors"
                      >
                        {/* Left Side (Old) */}
                        <div
                          className={cn(
                            'flex items-stretch overflow-hidden',
                            left?.type === 'delete' && 'bg-rose-950/30 text-rose-200'
                          )}
                        >
                          <span className="w-11 py-0.5 px-2 text-right select-none text-[11px] text-gray-600 bg-black/30 border-r border-forge-border/30 flex-shrink-0">
                            {left?.oldLineNumber ?? ''}
                          </span>
                          <span className="w-5 py-0.5 text-center select-none font-bold text-rose-400 flex-shrink-0">
                            {left?.type === 'delete' ? '-' : ''}
                          </span>
                          <pre className="py-0.5 px-2 whitespace-pre overflow-x-auto font-mono text-xs flex-1">
                            {left?.text ?? ''}
                          </pre>
                        </div>

                        {/* Right Side (New) */}
                        <div
                          className={cn(
                            'flex items-stretch overflow-hidden',
                            right?.type === 'add' && 'bg-emerald-950/30 text-emerald-200'
                          )}
                        >
                          <span className="w-11 py-0.5 px-2 text-right select-none text-[11px] text-gray-600 bg-black/30 border-r border-forge-border/30 flex-shrink-0">
                            {right?.newLineNumber ?? ''}
                          </span>
                          <span className="w-5 py-0.5 text-center select-none font-bold text-emerald-400 flex-shrink-0">
                            {right?.type === 'add' ? '+' : ''}
                          </span>
                          <pre className="py-0.5 px-2 whitespace-pre overflow-x-auto font-mono text-xs flex-1">
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
        )}
      </CardContent>
    </Card>
  );
};
