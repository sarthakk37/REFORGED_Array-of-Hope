// Smoke tests covering key end-to-end user workflows:
// 1. Login flow
// 2. Trigger drift simulation
// 3. View run details
// 4. Approve fix & open PR
// 5. Dashboard clean headline and manual controls render

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RunDetailPage } from '@/pages/RunDetailPage';
import * as AuthContextModule from '@/auth/AuthContext';
import { api } from '@/api';
import { ToastProvider } from '@/components/ui/Toast';
import { mockSmokeRun } from './smokeFixtures';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('DriftSmith Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Flow 1: Login flow submits credentials successfully', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      authEnabled: true,
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/approver@demo\.local/i);
    const passInput = screen.getByPlaceholderText(/••••••••/i);
    fireEvent.change(emailInput, { target: { value: 'engineer@demo.local' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'engineer@demo.local',
        password: 'password123',
      });
    });
  });

  it('Flow 2: Trigger drift simulation from live demo stage', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-1', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    const triggerSpy = vi.spyOn(api, 'triggerDrift').mockResolvedValue({
      run_id: 'run-smoke-test',
    });

    renderWithProviders(<DashboardPage />);

    const renameCard = screen.getByRole('button', { name: /field renamed/i });
    fireEvent.click(renameCard);

    const simulateBtn = screen.getByRole('button', { name: /simulate api change/i });
    fireEvent.click(simulateBtn);

    await waitFor(() => {
      expect(triggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: 'rename',
          service_name: 'Payment app',
        })
      );
    });
  });

  it('Flow 3: View run details on RunDetailPage', async () => {
    vi.spyOn(api, 'getRun').mockResolvedValue(mockSmokeRun);
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-1', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    renderWithProviders(
      <Routes>
        <Route path="/runs/:id" element={<RunDetailPage />} />
      </Routes>,
      '/runs/run-smoke-view'
    );

    await waitFor(() => {
      expect(screen.getByText(/remediation run: payment app/i)).toBeInTheDocument();
      expect(screen.getByText(/run-smoke-view/i)).toBeInTheDocument();
    });
  });

  it('Flow 4: Approve flow confirms and updates run', async () => {
    vi.spyOn(api, 'getRun').mockResolvedValue(mockSmokeRun);
    const approveSpy = vi.spyOn(api, 'approveRun').mockResolvedValue({
      status: 'approved',
      pull_request: {
        url: null,
        branch: 'driftsmith/fix-run-smoke-view',
        status: 'dry_run',
        dry_run: true,
      },
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-1', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    renderWithProviders(
      <Routes>
        <Route path="/runs/:id" element={<RunDetailPage />} />
      </Routes>,
      '/runs/run-smoke-view'
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve and open pull request/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /approve and open pull request/i }));

    const confirmBtn = screen.getByRole('button', { name: /^approve fix$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith('run-smoke-view');
    });
  });

  it('Flow 5: Dashboard renders clean value proposition headline and manual simulator controls', async () => {
    vi.spyOn(api, 'getRuns').mockResolvedValue([]);
    vi.spyOn(api, 'getPatterns').mockResolvedValue([]);
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-1', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByText(/When a company's API changes without warning/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simulate api change/i })).toBeInTheDocument();
    expect(screen.queryByTestId('start-guided-demo-btn')).not.toBeInTheDocument();
  });
});
