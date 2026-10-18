// Top application header bar displaying user identity, role, system status pill, and logout.
// Placed at the top of the AppShell.

import React from 'react';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { config } from '@/config/env';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  const roleVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'amber';
      case 'approver':
        return 'green';
      default:
        return 'cyan';
    }
  };

  return (
    <header className="h-16 px-6 bg-forge-surface border-b border-forge-border flex items-center justify-between select-none">
      {/* Left side: Context badge */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forge-green/15 border border-forge-green/30 text-forge-green-light text-xs font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-forge-green" />
          <span>{config.useMock ? 'SYSTEM ACTIVE' : 'CONNECTED TO BACKEND'}</span>
        </div>
      </div>

      {/* Right side: User information and Logout */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-8 h-8 rounded-full bg-forge-surface-elevated border border-forge-border flex items-center justify-center text-gray-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-gray-200">{user.email}</span>
            </div>

            <Badge variant={roleVariant(user.role)} size="sm">
              {user.role}
            </Badge>

            <div className="h-5 w-px bg-forge-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-red-400 gap-1.5 font-medium"
              title="Sign out of DriftSmith"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldAlert className="w-4 h-4 text-forge-amber" />
            <span>Not Authenticated</span>
          </div>
        )}
      </div>
    </header>
  );
};
