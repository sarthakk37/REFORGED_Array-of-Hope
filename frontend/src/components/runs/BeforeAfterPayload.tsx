// Side-by-side Before and After view of the provider's JSON payload.
// Highlights changed lines in red (old) and green (new) with a plain-English explanation.

import React from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export interface BeforeAfterPayloadProps {
  title: string;
  plainCaption: string;
  oldPayloadJson: string;
  newPayloadJson: string;
}

export const BeforeAfterPayload: React.FC<BeforeAfterPayloadProps> = ({
  plainCaption,
  oldPayloadJson,
  newPayloadJson,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-forge-amber" />
          <h3 className="text-sm font-bold text-white">What changed in the provider's data</h3>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Plain English explanation box */}
        <div className="p-3.5 rounded-lg bg-forge-surface-elevated border border-forge-border text-xs text-gray-200 leading-relaxed font-sans flex items-start gap-2.5">
          <span className="font-bold text-forge-amber-light block flex-shrink-0">Why your app breaks:</span>
          <span>{plainCaption}</span>
        </div>

        {/* Side-by-Side JSON comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Old Data */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-red-400 font-semibold px-1">
              <span>OLD DATA (What your app expects)</span>
            </div>
            <pre className="p-3.5 rounded-lg bg-[#0e0709] border border-rose-900/40 text-rose-200 overflow-x-auto whitespace-pre leading-relaxed">
              {oldPayloadJson}
            </pre>
          </div>

          {/* New Data */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-forge-green-light font-semibold px-1">
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                NEW DATA (What the provider now sends)
              </span>
            </div>
            <pre className="p-3.5 rounded-lg bg-[#070e0b] border border-emerald-900/40 text-emerald-200 overflow-x-auto whitespace-pre leading-relaxed">
              {newPayloadJson}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
