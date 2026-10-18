// Interactive demo panel for simulating third-party upstream API schema drift incidents.
// Allows selection of drift scenarios, services, and highlights the target-app-b memory moment.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Brain, Sparkles, AlertCircle } from 'lucide-react';
import { Scenario } from '@/api/types';
import { useTriggerDrift } from '@/hooks/useTriggerDrift';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/classNames';

export const TriggerDriftPanel: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario>('type');
  const [serviceName, setServiceName] = useState('payment-gateway');
  const triggerMutation = useTriggerDrift();
  const navigate = useNavigate();
  const { toast } = useToast();

  const scenarios: {
    id: Scenario;
    title: string;
    description: string;
    tag: string;
  }[] = [
    {
      id: 'type',
      title: 'Type Shift Mutation',
      description: 'Integer paise (49900) changes to decimal string rupees ("499.00"). Requires critic retry.',
      tag: 'Full Multi-Agent Loop',
    },
    {
      id: 'rename',
      title: 'Field Rename Drift',
      description: 'Upstream payment webhook renames `amount_in_cents` to `total_amount`.',
      tag: 'AST Dual Compat',
    },
    {
      id: 'nested',
      title: 'Object Restructure',
      description: '`customer.email` moves deeper into nested `payer.contact.email`.',
      tag: 'Hierarchy Traversal',
    },
  ];

  const handleTrigger = async () => {
    try {
      const res = await triggerMutation.mutateAsync({
        scenario,
        service_name: serviceName,
      });

      const isMemory =
        serviceName.trim().toLowerCase() === 'target-app-b' ||
        serviceName.trim().toLowerCase().includes('target-app-b');

      if (isMemory) {
        toast(`Memory Hit! Drift for ${serviceName} is healing with 0 LLM calls!`, 'success');
      } else {
        toast(`API drift injected for ${serviceName}. Sentinel agent activated!`, 'warning');
      }

      // Navigate to the newly triggered run detail view
      navigate(`/runs/${res.run_id}`);
    } catch {
      toast('Failed to trigger drift simulation', 'error');
    }
  };

  const isMemoryDemoTarget = serviceName.trim().toLowerCase() === 'target-app-b';

  return (
    <Card className="mb-8 border-forge-amber/30 bg-gradient-to-b from-forge-surface-elevated/80 to-forge-surface">
      <CardHeader className="py-4 px-6 border-b border-forge-border/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-forge-amber/15 text-forge-amber border border-forge-amber/30">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Drift Injection Simulator
              </h2>
              <p className="text-xs text-gray-400">
                Simulate third-party schema breakage and watch DriftSmith self-heal the service
              </p>
            </div>
          </div>

          {/* Memory Demo Pill */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400">Pro-tip:</span>
            <button
              onClick={() => setServiceName('target-app-b')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all border',
                isMemoryDemoTarget
                  ? 'bg-purple-900/30 border-purple-500 text-purple-300 shadow-sm'
                  : 'bg-black/30 border-forge-border text-gray-400 hover:text-purple-300 hover:border-purple-500/40'
              )}
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Use target-app-b (Instant Memory Heal)</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Scenario Selection Cards */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-gray-400 block mb-2.5">
            Select Drift Scenario
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc) => {
              const isSelected = scenario === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setScenario(sc.id)}
                  className={cn(
                    'p-4 rounded-lg border text-left cursor-pointer transition-all duration-150 relative group',
                    isSelected
                      ? 'bg-forge-amber/10 border-forge-amber shadow-amber-glow/40'
                      : 'bg-forge-bg/60 border-forge-border hover:border-gray-500 hover:bg-forge-surface-elevated'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        'text-xs font-bold font-mono',
                        isSelected ? 'text-forge-amber-light' : 'text-gray-200'
                      )}
                    >
                      {sc.title}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-black/40 px-1.5 py-0.5 rounded border border-forge-border/40">
                      {sc.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-normal">{sc.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Input & Trigger Button */}
        <div className="flex flex-col sm:flex-row items-end gap-4 pt-2">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Target Microservice</span>
              <span className="text-[11px] text-gray-500">
                {isMemoryDemoTarget
                  ? '⚡ Memory recipe match: 0 LLM calls (~5s)'
                  : 'Full synthesis loop (~20-22s)'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. payment-gateway or target-app-b"
                className="flex-1 px-3.5 py-2.5 bg-forge-bg border border-forge-border rounded-md text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-forge-amber"
              />
              <button
                type="button"
                onClick={() => setServiceName('payment-gateway')}
                className="px-2.5 py-1 text-xs font-mono text-gray-400 bg-forge-surface border border-forge-border rounded hover:text-white"
              >
                payment-gateway
              </button>
              <button
                type="button"
                onClick={() => setServiceName('target-app-b')}
                className="px-2.5 py-1 text-xs font-mono text-purple-400 bg-purple-950/20 border border-purple-500/30 rounded hover:text-purple-200"
              >
                target-app-b
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleTrigger}
            isLoading={triggerMutation.isPending}
            leftIcon={
              isMemoryDemoTarget ? (
                <Sparkles className="w-5 h-5 text-black" />
              ) : (
                <Flame className="w-5 h-5 text-black animate-pulse" />
              )
            }
            className="w-full sm:w-auto font-mono text-xs uppercase tracking-wider px-6 py-3 font-bold"
          >
            {isMemoryDemoTarget ? 'Heal From Memory' : 'Break The API'}
          </Button>
        </div>

        {/* Helper Note */}
        {isMemoryDemoTarget && (
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 flex items-center gap-2 text-xs text-purple-200 font-mono">
            <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>
              Targeting <strong>target-app-b</strong> triggers the instant memory path. The agent will retrieve the pre-learned patch recipe, skip LLM calls, and verify in ~5 seconds!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
