// Mock user credentials and persona fixtures for standalone demo mode.
// Used by mockClient to authenticate admin, approver, and viewer roles.

import { User } from '@/api/types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@demo.local',
    role: 'admin',
  },
  {
    id: 'usr_approver',
    email: 'approver@demo.local',
    role: 'approver',
  },
  {
    id: 'usr_viewer',
    email: 'viewer@demo.local',
    role: 'viewer',
  },
];

export const MOCK_PASSWORD = 'demo1234';
