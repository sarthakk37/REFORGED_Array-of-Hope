// Card rendering the diagnosed API schema drift diagnosis and detected mutations.
// Displays individual field changes, risk level, and visual confidence meter bars.

import React from 'react';
import { AlertOctagon, Fingerprint, ArrowRight, Check } from 'lucide-react';
import { DriftReport } from '@/api/types';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export interface DriftReportCardProps {
  report: DriftReport | null;
}

export const DriftReportCard: React.FC<DriftReportCardProps> = ({ report }) => {
  if (!report) {
    return (
      <EmptyState
        icon={<AlertOctagon className="w-6 h-6 text-gray-500" />}
        title="No drift report available"
        description="The agent has not yet generated a structured schema divergence diagnosis for this run."
      />
    );
  }

  const getRiskVariant = (risk: DriftReport['risk']) => {
    switch (risk) {
      case 'high':
        return 'red';
      case 'medium':
        return 'amber';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getChangeTypeVariant = (type: string) => {
    switch (type) {
      case 'renamed':
        return 'amber';
      case 'type_changed':
        return 'cyan';
      case 'moved':
        return 'purple';
      case 'added':
        return 'green';
      case 'removed':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-forge-amber" />
            <h3 className="text-sm font-semibold text-white">Schema Drift Analysis</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded border border-forge-border">
              <Fingerprint className="w-3 h-3 text-gray-500" />
              <span>{report.fingerprint}</span>
            </div>
            <Badge variant={getRiskVariant(report.risk)} size="sm">
              {report.risk} risk
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Summary */}
        <div className="p-3.5 rounded-lg bg-forge-surface-elevated border border-forge-border text-xs text-gray-200 leading-relaxed font-sans">
          <span className="font-semibold text-white block mb-0.5">Diagnostic Finding:</span>
          {report.summary}
        </div>

        {/* Changes List */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
            Detected Schema Mutations ({report.changes.length})
          </h4>
          <div className="space-y-3">
            {report.changes.map((change, idx) => {
              const confidencePercent = Math.round(change.confidence * 100);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-forge-border bg-forge-bg/80 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getChangeTypeVariant(change.type)} size="sm">
                        {change.type.replace('_', ' ')}
                      </Badge>
                      <span className="font-mono text-xs font-semibold text-gray-200">
                        {change.path}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-semibold text-forge-green-light">
                      {confidencePercent}% confidence
                    </span>
                  </div>

                  {/* Schema Transformation Path */}
                  <div className="flex items-center gap-2 font-mono text-xs bg-black/40 p-2.5 rounded border border-forge-border/60">
                    <span className="text-red-400 bg-forge-red/10 px-2 py-0.5 rounded">
                      {change.from ?? 'null'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-forge-green-light bg-forge-green/10 px-2 py-0.5 rounded">
                      {change.to ?? 'null'}
                    </span>
                  </div>

                  {/* Confidence Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                      <span>Statistical certainty</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Check className="w-3 h-3 text-forge-green" />
                        Verified via AST
                      </span>
                    </div>
                    <div className="w-full bg-forge-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-forge-amber h-full rounded-full transition-all duration-500"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
