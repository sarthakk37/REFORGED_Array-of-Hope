// Card rendering individual system subsystem integration status.
// Displays connection states: live, dry_run, disabled, and down.

import React from 'react';
import {
  Database,
  Cpu,
  GitBranch,
  MessageSquare,
  Box,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import { IntegrationState, IntegrationName } from '@/api/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface IntegrationStatusCardProps {
  integration: IntegrationState;
}

export const IntegrationStatusCard: React.FC<IntegrationStatusCardProps> = ({ integration }) => {
  const getIntegrationIcon = (name: IntegrationName) => {
    switch (name) {
      case 'database':
        return Database;
      case 'llm':
        return Cpu;
      case 'github':
        return GitBranch;
      case 'slack':
        return MessageSquare;
      case 'sandbox':
        return Box;
      case 'n8n':
        return Workflow;
      default:
        return Cpu;
    }
  };

  const getStatusConfig = (status: IntegrationState['status']) => {
    switch (status) {
      case 'live':
        return {
          variant: 'green' as const,
          label: 'LIVE',
          icon: CheckCircle2,
          color: 'text-forge-green',
        };
      case 'dry_run':
        return {
          variant: 'amber' as const,
          label: 'DRY RUN',
          icon: AlertTriangle,
          color: 'text-forge-amber',
        };
      case 'disabled':
        return {
          variant: 'default' as const,
          label: 'DISABLED',
          icon: PauseCircle,
          color: 'text-gray-400',
        };
      case 'down':
        return {
          variant: 'red' as const,
          label: 'OFFLINE',
          icon: XCircle,
          color: 'text-forge-red',
        };
    }
  };

  const Icon = getIntegrationIcon(integration.name);
  const statusCfg = getStatusConfig(integration.status);
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="hover:border-forge-border/90 transition-all">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-forge-surface-elevated border border-forge-border text-gray-200">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                {integration.name}
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">Subsystem</span>
            </div>
          </div>

          <Badge variant={statusCfg.variant} size="sm">
            <StatusIcon className="w-3 h-3" />
            <span>{statusCfg.label}</span>
          </Badge>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed font-sans bg-forge-bg/60 p-3 rounded border border-forge-border/40">
          {integration.detail}
        </p>
      </CardContent>
    </Card>
  );
};
