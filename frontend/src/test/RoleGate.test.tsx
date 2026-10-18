// Unit tests for RoleGate component and hasRole helper.
// Tests role authorization, conditional rendering, and fallback behavior.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGate, hasRole } from '@/auth/RoleGate';
import * as AuthContextModule from '@/auth/AuthContext';

describe('auth/RoleGate', () => {
  it('hasRole helper correctly evaluates permissions', () => {
    expect(hasRole('admin', ['admin', 'approver'])).toBe(true);
    expect(hasRole('approver', ['admin', 'approver'])).toBe(true);
    expect(hasRole('viewer', ['admin', 'approver'])).toBe(false);
    expect(hasRole(undefined, ['admin'])).toBe(false);
  });

  it('renders children when user role matches allowedRoles', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-1', email: 'approver@demo.local', role: 'approver' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    render(
      <RoleGate allowedRoles={['approver', 'admin']}>
        <div data-testid="protected-content">Authorized Action</div>
      </RoleGate>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('hides children and displays fallback when role is disallowed in hide mode', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-2', email: 'viewer@demo.local', role: 'viewer' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      authEnabled: true,
    });

    render(
      <RoleGate
        allowedRoles={['approver', 'admin']}
        fallback={<div data-testid="fallback">Access Denied</div>}
      >
        <div data-testid="protected-content">Authorized Action</div>
      </RoleGate>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
});
