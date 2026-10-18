// Table list container rendering recent drift remediation runs.
// Includes filter search, status indicators, and empty state support.

import React, { useState } from 'react';
import { Search, Filter, History } from 'lucide-react';
import { Run } from '@/api/types';
import { RunListItem } from './RunListItem';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export interface RunListProps {
  runs: Run[];
  isLoading?: boolean;
}

export const RunList: React.FC<RunListProps> = ({ runs, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');

  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      run.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.service_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScenario =
      scenarioFilter === 'all' || run.scenario === scenarioFilter;

    return matchesSearch && matchesScenario;
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div>
          <h2 className="text-base font-semibold text-white">Remediation Activity</h2>
          <p className="text-xs text-gray-400">Live drift detections and autonomous sandbox repairs</p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search run ID or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-forge-bg border border-forge-border rounded-md text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-forge-amber font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-forge-bg border border-forge-border rounded-md px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              aria-label="Filter by scenario"
              className="bg-transparent text-gray-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Scenarios</option>
              <option value="rename">Rename</option>
              <option value="type">Type Shift</option>
              <option value="nested">Nested Path</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" variant="amber" />
            <span className="text-xs font-mono text-gray-400">Fetching runs from orchestrator...</span>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<History className="w-6 h-6 text-gray-400" />}
              title="No remediation runs found"
              description={
                searchTerm || scenarioFilter !== 'all'
                  ? 'No runs match your current search and filter criteria.'
                  : 'Trigger a drift using the test panel above to initiate an autonomous repair sequence.'
              }
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-forge-bg/60 border-b border-forge-border text-[11px] font-mono uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 font-medium">Run ID & Service</th>
                <th className="px-5 py-3 font-medium">Scenario</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Verification</th>
                <th className="px-5 py-3 font-medium">Telemetry</th>
                <th className="px-5 py-3 font-medium text-right">Elapsed</th>
                <th className="px-4 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forge-border/40">
              {filteredRuns.map((run) => (
                <RunListItem key={run.id} run={run} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};
