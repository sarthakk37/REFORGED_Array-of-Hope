// 404 Not Found fallback screen.
// Renders when a requested URL does not match any route.

import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-forge-surface-elevated border border-forge-border flex items-center justify-center text-forge-amber shadow-amber-glow">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-mono text-white">404: Route Not Found</h1>
        <p className="text-sm text-gray-400 max-w-sm">
          The requested path could not be located in the DriftSmith cockpit.
        </p>
      </div>

      <Link to="/">
        <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
