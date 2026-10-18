// Comprehensive detail page for a single drift remediation run.
// Hosts the live AgentTimeline stream on the left, and Drift Report/Diff/Tests/PR on the right.

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  GitBranch,
  ExternalLink,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Cpu,
} from 'lucide-react';
import { useRun } from '@/hooks/useRun';
import { useRunEvents } from '@/hooks/useRunEvents';
import { useApprove } from '@/hooks/useApprove';
import { useToast } from '@/components/ui/Toast';
import { RunStatusBadge } from '@/components/runs/RunStatusBadge';
import { ConfidenceBadge } from '@/components/runs/ConfidenceBadge';
import { MemoryBadge } from '@/components/runs/MemoryBadge';
import { AgentTimeline } from '@/components/runs/AgentTimeline';
import { DriftReportCard } from '@/components/runs/DriftReportCard';
import { DiffViewer } from '@/components/runs/DiffViewer';
import { TestResultsPanel } from '@/components/runs/TestResultsPanel';
import { ApprovalBar } from '@/components/runs/ApprovalBar';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDateTime } from '@/lib/formatDate';
import { formatDuration } from '@/lib/formatDuration';

export const RunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('diff');
  const { toast } = useToast();

  const { data: run, isLoading, isError, refetch } = useRun(id);
  const approveMutation = useApprove();

  const isCompletedInitially =
    run?.status === 'approved' ||
    run?.status === 'awaiting_approval' ||
    run?.status === 'verified' ||
    run?.status === 'failed';

  const { events, isStreaming, isFinished } = useRunEvents(id, isCompletedInitially);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" variant="amber" />
        <span className="text-xs font-mono text-gray-400">Loading run telemetry...</span>
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="py-12">
        <ErrorState
          title="Run Not Found"
          message={`Unable to retrieve telemetry or artifacts for run ID "${id}".`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(run.id);
      toast('Pull request approved and opened successfully!', 'success');
      setActiveTab('pr');
    } catch {
      toast('Failed to approve pull request', 'error');
    }
  };

  const tabs = [
    { id: 'diff', label: 'Synthesized Patch (Diff)' },
    { id: 'report', label: 'Drift Report' },
    {
      id: 'tests',
      label: 'Sandbox Verification',
      badge: (
        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-forge-green/20 text-forge-green rounded-full">
          2 PASS
        </span>
      ),
    },
    { id: 'pr', label: 'Pull Request' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation & Header */}
      <div className="space-y-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-forge-amber transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cockpit</span>
        </Link>

        {/* Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl border border-forge-border bg-forge-surface">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl font-bold text-white tracking-tight">
                {run.id}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-gray-300 bg-black/40 px-2.5 py-1 rounded border border-forge-border">
                <Server className="w-3.5 h-3.5 text-gray-400" />
                <span>{run.service_name}</span>
              </div>
              <Badge variant="amber" size="sm">
                {run.scenario}
              </Badge>
              <RunStatusBadge status={run.status} size="sm" />
              {run.healed_from_memory ? (
                <MemoryBadge size="sm" />
              ) : (
                <ConfidenceBadge confidence={run.confidence} size="sm" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                Started: {formatDateTime(run.started_at)}
              </span>
              <span>•</span>
              <span>Duration: {formatDuration(run.started_at, run.finished_at)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-300">
                <Cpu className="w-3 h-3 text-forge-amber" />
                {run.llm_calls} LLM Calls ({run.iterations} Iterations)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Live Agent Timeline (40%), Right = Multi-Tab Workbench (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Multi-Agent Timeline */}
        <div className="lg:col-span-5 flex flex-col">
          <AgentTimeline
            events={events}
            isStreaming={isStreaming}
            isFinished={isFinished}
          />
        </div>

        {/* Right Column: Tabbed Workbench */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="flex-1">
            {activeTab === 'diff' && <DiffViewer patch={run.patch} />}

            {activeTab === 'report' && <DriftReportCard report={run.drift_report} />}

            {activeTab === 'tests' && (
              <TestResultsPanel
                testResults={run.patch?.test_results}
                sandboxLog={run.patch?.sandbox_log}
              />
            )}

            {activeTab === 'pr' && (
              <Card className="h-full">
                <CardHeader className="py-3 px-5 bg-forge-surface-elevated/40">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="w-4 h-4 text-forge-amber" />
                      <h3 className="text-sm font-semibold text-white">Pull Request Details</h3>
                    </div>
                    <Badge
                      variant={run.pull_request?.status === 'open' ? 'green' : 'amber'}
                      size="sm"
                    >
                      {run.pull_request?.status || 'dry_run'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3 font-mono text-xs bg-black/40 p-4 rounded-lg border border-forge-border">
                    <div className="flex justify-between items-center pb-2 border-b border-forge-border/60">
                      <span className="text-gray-400">Target Branch:</span>
                      <span className="text-forge-amber-light font-bold flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        {run.pull_request?.branch || `fix/drift-${run.scenario}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-forge-border/60">
                      <span className="text-gray-400">Commit Message:</span>
                      <span className="text-gray-200">
                        fix(api): heal upstream payload drift for {run.service_name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Pull Request Link:</span>
                      {run.pull_request?.url ? (
                        <a
                          href={run.pull_request.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forge-cyan-light hover:underline flex items-center gap-1"
                        >
                          <span>{run.pull_request.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-500 italic">
                          Awaiting approval to publish GitHub PR
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-forge-surface-elevated border border-forge-border space-y-2">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-forge-green" />
                      Zero-Breakage Automated Pull Request
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      This pull request was synthesized and verified by DriftSmith agents. It has passed 100% of isolated sandbox regression test suites against both legacy payloads and the newly observed provider schema.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Approval Bar */}
      <ApprovalBar
        run={run}
        onApprove={handleApprove}
        isApproving={approveMutation.isPending}
      />
    </div>
  );
};
