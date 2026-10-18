// Visual badge for run lifecycle states with distinct colors and live pulses.
// Handles queued, running, verified, failed, awaiting_approval, approved, and rejected.

import React from 'react';
import { RunStatus } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Clock, XCircle, AlertTriangle, PlayCircle } from 'lucide-react';

export interface RunStatusBadgeProps {
  status: RunStatus;
  size?: 'sm' | 'md';
}

export const RunStatusBadge: React.FC<RunStatusBadgeProps> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'running':
      return (
        <Badge variant="amber" size={size} pulse>
          <PlayCircle className="w-3.5 h-3.5" />
          <span>RUNNING</span>
        </Badge>
      );
    case 'queued':
      return (
        <Badge variant="default" size={size}>
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>QUEUED</span>
        </Badge>
      );
    case 'verified':
      return (
        <Badge variant="cyan" size={size}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>VERIFIED</span>
        </Badge>
      );
    case 'awaiting_approval':
      return (
        <Badge variant="amber" size={size}>
          <AlertTriangle className="w-3.5 h-3.5 text-forge-amber" />
          <span>AWAITING APPROVAL</span>
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="green" size={size}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>APPROVED</span>
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="red" size={size}>
          <XCircle className="w-3.5 h-3.5" />
          <span>REJECTED</span>
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="red" size={size}>
          <XCircle className="w-3.5 h-3.5" />
          <span>FAILED</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size={size}>
          <span>{status}</span>
        </Badge>
      );
  }
};
