// Route definitions mapping URLs to components with authentication protection.
// Configures Live Demo, History, Remembered Fixes, RunDetail, and System Status pages.

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { RunDetailPage } from '@/pages/RunDetailPage';
import { RememberedFixesPage } from '@/pages/RememberedFixesPage';
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
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'runs/:id',
        element: <RunDetailPage />,
      },
      {
        path: 'fixes',
        element: <RememberedFixesPage />,
      },
      {
        // Backward-compatible alias for /patterns
        path: 'patterns',
        element: <Navigate to="/fixes" replace />,
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
