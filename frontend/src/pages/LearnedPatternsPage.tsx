// Learned Patterns repository page explaining and displaying zero-LLM memory cache hits.
// Details how DriftSmith stores diagnosed schema mutations to heal recurring issues instantly.

import React from 'react';
import { Brain, Zap, Fingerprint, ShieldCheck, Clock } from 'lucide-react';
import { usePatterns } from '@/hooks/usePatterns';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/formatDate';

export const LearnedPatternsPage: React.FC = () => {
  const { data: patterns = [], isLoading } = usePatterns();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-forge-border">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-purple-400" />
          <span>Learned Drift Patterns</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Instantaneous zero-LLM remediation engine for recurring API mutations
        </p>
      </div>

      {/* Concept Architecture Card */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-forge-surface to-forge-surface">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-300 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-forge-amber" />
                <span>Zero-Inference Self-Healing</span>
              </div>
              <h2 className="text-base font-bold text-white">
                What is a Learned Pattern?
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                When DriftSmith diagnoses a schema drift, synthesizes a patch, and verifies it in a sandbox, it calculates a cryptographic AST schema fingerprint. If another service or payload encounters that exact drift signature later, DriftSmith bypasses the LLM synthesis tier entirely. The verified patch recipe is applied instantly from memory in less than 5 seconds with 0 LLM queries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 flex flex-col items-center justify-center text-center min-w-[200px]">
              <span className="text-3xl font-extrabold font-mono text-purple-300">
                {patterns.reduce((acc, p) => acc + p.times_used, 0)}
              </span>
              <span className="text-xs font-mono text-gray-400 mt-1">Total Memory Cache Hits</span>
              <span className="text-[11px] text-forge-green font-mono mt-0.5">
                ~{patterns.reduce((acc, p) => acc + p.times_used, 0) * 3} LLM Calls Saved
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Table */}
      <Card className="overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-forge-border">
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-semibold text-white">Stored Pattern Recipes</h3>
              <p className="text-xs text-gray-400">Indexed schema fingerprints and re-use telemetry</p>
            </div>
            <Badge variant="purple" size="sm">
              {patterns.length} Active Recipes
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" variant="amber" />
              <span className="text-xs font-mono text-gray-400">Loading pattern registry...</span>
            </div>
          ) : patterns.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Brain className="w-6 h-6 text-purple-400" />}
                title="No learned patterns yet"
                description="As drift incidents are verified and approved, their AST patch recipes will appear here."
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-forge-bg/60 border-b border-forge-border text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3 font-medium">Recipe ID & Fingerprint</th>
                  <th className="px-6 py-3 font-medium">Drift Summary</th>
                  <th className="px-6 py-3 font-medium">Times Re-Used</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium text-right">Optimization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-border/40 font-mono">
                {patterns.map((pattern) => (
                  <tr
                    key={pattern.id}
                    className="hover:bg-forge-surface-elevated/70 transition-colors"
                  >
                    {/* Pattern ID & Fingerprint */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-purple-300 mb-1">{pattern.id}</div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-forge-border w-fit">
                        <Fingerprint className="w-3 h-3 text-gray-500" />
                        <span>{pattern.fingerprint}</span>
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="px-6 py-4 font-sans text-xs text-gray-200 max-w-md">
                      {pattern.summary}
                    </td>

                    {/* Times Used */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold text-xs">
                        <Zap className="w-3 h-3 text-forge-amber" />
                        {pattern.times_used} hits
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>{formatDateTime(pattern.created_at)}</span>
                      </div>
                    </td>

                    {/* Optimization Metric */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-forge-green text-xs font-semibold flex items-center justify-end gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>0ms LLM Overhead</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {pattern.times_used * 3} calls avoided
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
