// Stored fix recipes that DriftSmith remembers for instant zero-AI healing.
// Only "Field renamed" and "Email moved" are pre-seeded; "Price format changed" is added after its first completion.

import { LearnedPattern } from '@/api/types';

export const INITIAL_MOCK_PATTERNS: LearnedPattern[] = [
  {
    id: 'pat-901',
    fingerprint: 'fp_rename_amount_in_cents_9b2e',
    summary: 'When a provider renames amount_in_cents to total_amount, read total_amount while keeping fallback for the old name.',
    times_used: 12,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'pat-902',
    fingerprint: 'fp_nested_payer_contact_email_331a',
    summary: 'When a provider moves customer.email to payer.contact.email, navigate the nested path with safe fallback to customer.email.',
    times_used: 7,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];
