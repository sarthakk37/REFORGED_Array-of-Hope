// Role-based authorization gate to show, hide, or disable elements based on user role.
// Evaluates permissions against 'viewer', 'approver', and 'admin'.

import React from 'react';
import { Role } from '@/api/types';
import { useAuth } from './AuthContext';

export interface RoleGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable';
}

/**
 * Checks if a given role is included in allowedRoles.
 */
export function hasRole(currentRole: Role | undefined | null, allowedRoles: Role[]): boolean {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
}

export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  children,
  fallback = null,
  mode = 'hide',
}) => {
  const { user } = useAuth();
  const isAllowed = hasRole(user?.role, allowedRoles);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  // Disable mode: Wrap children in an unclickable container with tooltip/fallback
  return (
    <div className="relative group cursor-not-allowed">
      <div className="opacity-40 pointer-events-none select-none">{children}</div>
      {fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded">
          {fallback}
        </div>
      )}
    </div>
  );
};
