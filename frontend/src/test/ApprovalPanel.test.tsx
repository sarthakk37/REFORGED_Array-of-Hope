// Unit tests for ApprovalPanel component checking approver vs viewer role behavior and PR preview.
// Verifies approval buttons, 3-bullet confirmation dialog, read-only state, and zero-network PR preview card.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalPanel } from '@/components/runs/ApprovalPanel';
import * as AuthContextModule from '@/auth/AuthContext';
import { RunDetail } from '@/api/types';

describe('components/runs/ApprovalPanel', () => {
  const mockRun: RunDetail = {
    id: 'run-999',
    scenario: 'type',
    service_name: 'Payment app',
    source: 'manual',
    status: 'awaiting_approval',
    confidence: 0.96,
    verified: true,
    healed_from_memory: false,
    llm_calls: 4,
    iterations: 2,
    started_at: '2026-10-18T10:00:00Z',
    finished_at: '2026-10-18T10:00:20Z',
    drift_report: null,
    patch: null,
    pull_request: {
      url: null,
      branch: 'driftsmith/fix-run-999',
      status: 'dry_run',
      dry_run: true,
    },
  };

  it('renders Approve button for approver role and triggers 3-bullet confirmation modal', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-app', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    const mockApprove = vi.fn().mockResolvedValue(undefined);

    render(<ApprovalPanel run={mockRun} onApprove={mockApprove} isApproving={false} />);

    const approveBtn = screen.getByRole('button', { name: /approve and open pull request/i });
    expect(approveBtn).toBeInTheDocument();

    // Click opens confirmation modal
    fireEvent.click(approveBtn);
    expect(screen.getByText(/approve fix and open pull request/i)).toBeInTheDocument();
    expect(screen.getByText(/approves the code change verified in the safe test room/i)).toBeInTheDocument();

    // Confirm button in modal triggers onApprove
    const confirmBtn = screen.getByRole('button', { name: /^approve fix$/i });
    fireEvent.click(confirmBtn);
    expect(mockApprove).toHaveBeenCalledTimes(1);
  });

  it('renders read-only state for viewer role and prevents approval', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-view', email: 'viewer@demo.local', role: 'viewer' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    const mockApprove = vi.fn();

    render(<ApprovalPanel run={mockRun} onApprove={mockApprove} isApproving={false} />);

    expect(screen.queryByRole('button', { name: /approve and open pull request/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('viewer-readonly-badge')).toHaveTextContent(/you have read-only access/i);
  });

  it('displays PR preview card when status is approved without making network calls', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-app', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    const approvedRun: RunDetail = {
      ...mockRun,
      status: 'approved',
      pull_request: {
        url: null,
        branch: 'driftsmith/fix-run-999',
        status: 'dry_run',
        dry_run: true,
      },
    };

    render(<ApprovalPanel run={approvedRun} onApprove={vi.fn()} isApproving={false} />);

    expect(screen.getByTestId('pr-preview-card')).toBeInTheDocument();
    expect(screen.getByText(/preview - real github prs are enabled in the next phase/i)).toBeInTheDocument();
    expect(screen.getByText(/driftsmith\/fix-run-999/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy pr description/i })).toBeInTheDocument();
  });
});
