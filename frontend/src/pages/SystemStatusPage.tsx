// System status page providing diagnostic observability over backend integrations.
// Displays live, dry_run, disabled, and down statuses for database, LLM, GitHub, Slack, Sandbox, and n8n.

import React from 'react';
import { Activity, ShieldCheck, AlertCircle, RefreshCw, Cpu, Lock } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';
import { IntegrationStatusCard } from '@/components/system/IntegrationStatusCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';

export const SystemStatusPage: React.FC = () => {
  const { data: health, isLoading, isError, refetch } = useHealth();

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" variant="amber" />
        <span className="text-xs font-mono text-gray-400">Querying subsystem status...</span>
      </div>
    );
  }

  if (isError || !health) {
    return (
      <div className="py-12">
        <ErrorState
          title="System Diagnostics Unavailable"
          message="Could not reach the DriftSmith health inspection endpoint. Subsystems may be offline."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isHealthy = health.status === 'ok';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-forge-border">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-forge-amber" />
            <span>System Status & Subsystems</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time health telemetry across LLM providers, sandbox runtimes, and integrations
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs font-mono"
        >
          Refresh Status
        </Button>
      </div>

      {/* Top Health Overview Card */}
      <Card className={isHealthy ? 'border-forge-green/30 bg-forge-green/5' : 'border-forge-red/30 bg-forge-red/5'}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  isHealthy
                    ? 'bg-forge-green/10 border-forge-green/30 text-forge-green'
                    : 'bg-forge-red/10 border-forge-red/30 text-forge-red'
                }`}
              >
                {isHealthy ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {isHealthy ? 'All Systems Operational' : 'Degraded System Performance'}
                  </h2>
                  <Badge variant={isHealthy ? 'green' : 'red'} size="sm">
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Autonomous self-healing agent pipelines and sandbox containers operating normally.
                </p>
              </div>
            </div>

            {/* Config Mode Indicators */}
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-forge-border text-gray-300">
                <Cpu className="w-3.5 h-3.5 text-forge-amber" />
                <span>LLM Mode:</span>
                <span className="font-bold text-forge-amber-light uppercase">{health.llm_mode}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-forge-border text-gray-300">
                <Lock className="w-3.5 h-3.5 text-forge-cyan" />
                <span>Auth:</span>
                <span className="font-bold text-forge-cyan-light uppercase">
                  {health.auth_enabled ? 'Enforced' : 'Bypassed'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Grid */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
          Integration Telemetry ({health.integrations.length} Components)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.integrations.map((integration) => (
            <IntegrationStatusCard key={integration.name} integration={integration} />
          ))}
        </div>
      </div>
    </div>
  );
};
