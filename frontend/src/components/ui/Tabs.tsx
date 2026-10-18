// Accessible hand-crafted Tabs component for switching panels.
// Used in the RunDetailPage to navigate between Drift Report, Diff, Tests, and PR.

import React from 'react';
import { cn } from '@/lib/classNames';

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div
      className={cn('flex items-center space-x-1 border-b border-forge-border overflow-x-auto', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap focus:outline-none',
              isActive
                ? 'border-forge-amber text-forge-amber-light bg-forge-amber/5'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
