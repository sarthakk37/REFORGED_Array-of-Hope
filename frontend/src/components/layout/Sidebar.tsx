// Sidebar navigation for DriftSmith with custom hand-crafted Anvil/Spark logo.
// Features four clean navigation items: Demo, History, Remembered Fixes, and System Status.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlayCircle, History, Brain, Activity } from 'lucide-react';
import { cn } from '@/lib/classNames';

export const DriftSmithLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        className="w-8 h-8 text-forge-amber flex-shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Molten Anvil Base */}
        <path
          d="M4 14C4 12.8954 4.89543 12 6 12H26C27.1046 12 28 12.8954 28 14V16C28 17.1046 27.1046 18 26 18H23L24 25C24 26.1046 23.1046 27 22 27H10C8.89543 27 8 26.1046 8 25L9 18H6C4.89543 18 4 17.1046 4 16V14Z"
          fill="currentColor"
        />
        {/* Anvil Horn */}
        <path d="M26 14H30C30 14 30 17 26 18V14Z" fill="#d97706" />
        {/* Molten Sparks */}
        <path
          d="M16 3L17.5 7L21 8.5L17.5 10L16 14L14.5 10L11 8.5L14.5 7L16 3Z"
          fill="#fbbf24"
          className="animate-pulse"
        />
        <circle cx="23" cy="5" r="1.5" fill="#f59e0b" />
        <circle cx="9" cy="6" r="1.5" fill="#fbbf24" />
      </svg>
      <div className="flex flex-col">
        <span className="font-bold text-lg tracking-tight text-white flex items-center">
          Drift<span className="text-forge-amber">Smith</span>
        </span>
        <span className="text-[10px] tracking-widest uppercase font-mono text-gray-400">
          Self-Healing Code
        </span>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/',
      label: 'Demo',
      icon: PlayCircle,
    },
    {
      to: '/history',
      label: 'History',
      icon: History,
    },
    {
      to: '/fixes',
      label: 'Remembered Fixes',
      icon: Brain,
    },
    {
      to: '/status',
      label: 'System Status',
      icon: Activity,
    },
  ];

  return (
    <aside className="w-64 bg-forge-surface border-r border-forge-border flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-forge-border flex items-center">
        <NavLink to="/" className="flex items-center">
          <DriftSmithLogo />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 font-mono">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-forge-amber/15 text-forge-amber-light border border-forge-amber/30 shadow-sm font-semibold'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-forge-surface-elevated'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-forge-amber' : 'text-gray-400 group-hover:text-gray-200'
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-forge-border bg-black/20 text-xs text-gray-400 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span>DriftSmith Prototype</span>
          <span className="text-forge-green font-medium">Ready</span>
        </div>
        <p className="text-[11px] text-gray-500">Autonomous API Drift Remediation</p>
      </div>
    </aside>
  );
};
