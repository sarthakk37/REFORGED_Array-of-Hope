// Login page providing credential authentication and quick demo persona switching.
// Displays demo credentials banner when in mock mode.

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Key, UserCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { config } from '@/config/env';
import { DriftSmithLogo } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('approver@demo.local');
  const [password, setPassword] = useState('demo1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid credentials. Please verify your details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center p-4 bg-forge-bg bg-radial-grid">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Wordmark */}
        <div className="flex flex-col items-center text-center space-y-2">
          <DriftSmithLogo className="h-10 justify-center" />
          <p className="text-xs text-gray-400 font-sans max-w-xs">
            When an API changes without warning, DriftSmith fixes your code automatically, tests the fix, and asks you to approve.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-forge-border bg-forge-surface p-8 shadow-2xl space-y-6">
          <div className="border-b border-forge-border/80 pb-4">
            <h1 className="text-lg font-bold text-white tracking-tight">Sign In to DriftSmith</h1>
            <p className="text-xs text-gray-400 mt-1">
              Select a demo role below to explore the prototype.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-forge-red/10 border border-forge-red/30 flex items-start gap-2.5 text-xs text-forge-red-light font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-forge-red" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-gray-400 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="approver@demo.local"
                  className="w-full pl-9 pr-3 py-2 bg-forge-bg border border-forge-border rounded-md text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-forge-amber"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-gray-400 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-forge-bg border border-forge-border rounded-md text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-forge-amber"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full font-mono text-xs uppercase tracking-wider mt-2 py-2.5 font-bold"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Personas Quick Select */}
          {config.useMock && (
            <div className="pt-4 border-t border-forge-border space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center gap-1 text-forge-amber-light font-semibold">
                  <Key className="w-3.5 h-3.5" />
                  Demo Roles (Password: demo1234)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoUser('approver@demo.local')}
                  className="p-2.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-amber/15 border border-forge-border hover:border-forge-amber/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-forge-green-light">
                    <UserCheck className="w-3.5 h-3.5" />
                    Approver
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Can approve</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser('admin@demo.local')}
                  className="p-2.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-amber/15 border border-forge-border hover:border-forge-amber/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-forge-amber-light">
                    <UserCheck className="w-3.5 h-3.5" />
                    Admin
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Full access</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser('viewer@demo.local')}
                  className="p-2.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-amber/15 border border-forge-border hover:border-forge-amber/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-forge-cyan-light">
                    <UserCheck className="w-3.5 h-3.5" />
                    Viewer
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Read-only</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
