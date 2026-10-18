// Card displaying n8n webhook integration endpoints, auth headers, curl commands, and test triggers.
// Allows developers and judges to test n8n-orchestrated drift repair in mock and live modes.

import React, { useState } from 'react';
import { Workflow, Copy, Check, Send, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { config } from '@/config/env';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const SAMPLE_KEY = 'ds_n8n_sec_99341';
const WEBHOOK_PATH = '/api/v1/webhooks/drift';

export const N8nWebhookCard: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const baseUrl = config.apiUrl || 'http://localhost:8000';
  const fullWebhookUrl = `${baseUrl}${WEBHOOK_PATH}`;

  const sampleCurl = `curl -X POST ${fullWebhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-DriftSmith-Key: ${SAMPLE_KEY}" \\
  -d '{
    "service_name": "Stripe Webhook Listener",
    "scenario": "rename",
    "external_ref": "n8n-exec-9412",
    "payload": {
      "id": "evt_101",
      "total_amount": "499.00"
    }
  }'`;

  const copyToClipboard = async (text: string, type: 'key' | 'curl') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      }
      toast('Copied to clipboard!', 'info');
    } catch {
      toast('Failed to copy to clipboard', 'error');
    }
  };

  const handleSendTestWebhook = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.triggerWebhook({
        scenario: 'rename',
        service_name: 'Stripe Webhook Listener',
        source: 'n8n',
        external_ref: `workflow-drift-heal-${Math.floor(100 + Math.random() * 900)}`,
        payload: {
          id: 'evt_simulated',
          total_amount: '499.00',
        },
      });

      await queryClient.invalidateQueries({ queryKey: ['runs'] });
      toast(`Test webhook delivered! Run ${res.run_id} started via n8n.`, 'success');
    } catch {
      toast('Failed to deliver test webhook.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-orange-500/30 bg-orange-950/10 shadow-lg">
      <CardHeader className="py-4 px-6 border-b border-forge-border/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">n8n Ingestion Webhook</h2>
              <Badge variant="orange" size="sm">
                n8n ready
              </Badge>
            </div>
            <p className="text-xs text-gray-400">
              Orchestrate automated drift repairs and Slack approvals via n8n workflows
            </p>
          </div>
        </div>

        {config.useMock && (
          <Button
            data-testid="send-test-webhook-btn"
            variant="primary"
            size="sm"
            onClick={handleSendTestWebhook}
            disabled={isSubmitting}
            leftIcon={isSubmitting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            className="text-xs bg-orange-500 hover:bg-orange-600 text-black font-bold border-orange-400"
          >
            {isSubmitting ? 'Delivering...' : 'Send test webhook'}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Endpoint & Auth Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-black/40 border border-forge-border space-y-1">
            <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold block">
              Webhook Endpoint
            </span>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-forge-green/20 text-forge-green-light border border-forge-green/30">
                POST
              </span>
              <code className="text-xs font-mono text-white select-all break-all">
                {WEBHOOK_PATH}
              </code>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-forge-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold block">
                Required Auth Header
              </span>
              <button
                onClick={() => copyToClipboard(`X-DriftSmith-Key: ${SAMPLE_KEY}`, 'key')}
                className="text-[11px] font-mono text-forge-amber hover:underline flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3 h-3 text-forge-green" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-xs font-mono text-orange-300 block select-all">
              X-DriftSmith-Key: {SAMPLE_KEY}
            </code>
          </div>
        </div>

        {/* Sample cURL snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-300 font-semibold">
              Sample cURL for n8n HTTP Request Node
            </span>
            <button
              data-testid="copy-curl-btn"
              onClick={() => copyToClipboard(sampleCurl, 'curl')}
              className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-forge-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Copied to clipboard' : 'Copy curl'}</span>
            </button>
          </div>
          <pre
            data-testid="n8n-curl-snippet"
            className="p-3 rounded-lg bg-black/60 border border-forge-border text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed"
          >
            {sampleCurl}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
