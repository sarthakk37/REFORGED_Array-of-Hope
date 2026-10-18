// Unit tests for ApprovalBar component checking approver vs viewer role behavior.
// Verifies approval buttons, confirmation dialogs, and read-only states.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalBar } from '@/components/runs/ApprovalBar';
import * as AuthContextModule from '@/auth/AuthContext';
import { RunDetail } from '@/api/types';

describe('components/runs/ApprovalBar', () => {
  const mockRun: RunDetail = {
    id: 'run-999',
    scenario: 'type',
    service_name: 'payment-gateway',
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
      branch: 'fix/drift-amount-type',
      status: 'dry_run',
      dry_run: true,
    },
  };

  it('renders Approve button for approver role and triggers confirmation modal', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-app', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    const mockApprove = vi.fn().mockResolvedValue(undefined);

    render(<ApprovalBar run={mockRun} onApprove={mockApprove} isApproving={false} />);

    const approveBtn = screen.getByRole('button', { name: /approve & open pr/i });
    expect(approveBtn).toBeInTheDocument();

    // Click opens confirmation modal
    fireEvent.click(approveBtn);
    expect(screen.getByText(/approve patch & open pull request/i)).toBeInTheDocument();

    // Confirm button in modal triggers onApprove
    const confirmBtn = screen.getByRole('button', { name: /confirm & open pr/i });
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

    render(<ApprovalBar run={mockRun} onApprove={mockApprove} isApproving={false} />);

    expect(screen.queryByRole('button', { name: /approve & open pr/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('viewer-readonly-badge')).toHaveTextContent(/read-only: approver role required/i);
  });

  it('displays approved state when status is approved', () => {
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
        url: 'https://github.com/driftsmith-demo/payment-gateway/pull/104',
        branch: 'fix/drift-amount-type',
        status: 'open',
        dry_run: false,
      },
    };

    render(<ApprovalBar run={approvedRun} onApprove={vi.fn()} isApproving={false} />);

    expect(screen.getByText(/approved & open/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view github pr/i })).toHaveAttribute(
      'href',
      'https://github.com/driftsmith-demo/payment-gateway/pull/104'
    );
  });
});
