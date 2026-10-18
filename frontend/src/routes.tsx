// Route definitions mapping URLs to components with authentication protection.
// Configures Dashboard, RunDetail, LearnedPatterns, and SystemStatus pages.

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RunDetailPage } from '@/pages/RunDetailPage';
import { LearnedPatternsPage } from '@/pages/LearnedPatternsPage';
import { SystemStatusPage } from '@/pages/SystemStatusPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'runs/:id',
        element: <RunDetailPage />,
      },
      {
        path: 'patterns',
        element: <LearnedPatternsPage />,
      },
      {
        path: 'status',
        element: <SystemStatusPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
