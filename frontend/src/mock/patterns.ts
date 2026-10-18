// Learned pattern fixtures for instant zero-LLM drift resolution.
// Stored fingerprints enable sub-second healing when familiar drift patterns recur.

import { LearnedPattern } from '@/api/types';

export const INITIAL_MOCK_PATTERNS: LearnedPattern[] = [
  {
    id: 'pat-901',
    fingerprint: 'fp_rename_amount_in_cents_9b2e',
    summary: 'Stripe webhook rename: amount_in_cents → total_amount',
    times_used: 12,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'pat-902',
    fingerprint: 'fp_nested_payer_contact_email_331a',
    summary: 'Razorpay payload restructure: customer.email → payer.contact.email',
    times_used: 7,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];
