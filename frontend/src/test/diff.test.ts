// Unit tests for handcrafted line diff helper and unified diff parser.
// Verifies hunk parsing, line numbering, and split side-by-side row generation.

import { describe, it, expect } from 'vitest';
import { parseUnifiedDiff, buildSideBySideRows } from '@/lib/diff';

describe('lib/diff', () => {
  const sampleDiff = `--- a/services/payment_webhook.py
+++ b/services/payment_webhook.py
@@ -14,4 +14,5 @@ def handle_charge(payload):
     data = payload["data"]
-    amount = data["amount_in_cents"]
+    # Self-healed
+    amount = data.get("total_amount", data.get("amount_in_cents"))
     return amount`;

  it('correctly parses unified diff header paths', () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    expect(parsed.oldPath).toBe('services/payment_webhook.py');
    expect(parsed.newPath).toBe('services/payment_webhook.py');
    expect(parsed.hunks).toHaveLength(1);
  });

  it('correctly computes line numbers and types in hunk', () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    const hunk = parsed.hunks[0];
    expect(hunk.oldStart).toBe(14);
    expect(hunk.newStart).toBe(14);

    const deleteLine = hunk.lines.find((l) => l.type === 'delete');
    expect(deleteLine).toBeDefined();
    expect(deleteLine?.text).toContain('amount_in_cents');
    expect(deleteLine?.oldLineNumber).toBe(15);
    expect(deleteLine?.newLineNumber).toBeNull();

    const addLines = hunk.lines.filter((l) => l.type === 'add');
    expect(addLines).toHaveLength(2);
    expect(addLines[0].newLineNumber).toBe(15);
    expect(addLines[1].newLineNumber).toBe(16);
  });

  it('builds aligned side-by-side rows aligning deletes with adds', () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    const hunk = parsed.hunks[0];
    const rows = buildSideBySideRows(hunk);

    // Context line "data = payload["data"]"
    expect(rows[0].left?.type).toBe('context');
    expect(rows[0].right?.type).toBe('context');

    // Deletion paired with first addition
    expect(rows[1].left?.type).toBe('delete');
    expect(rows[1].right?.type).toBe('add');

    // Second addition without corresponding deletion
    expect(rows[2].left).toBeNull();
    expect(rows[2].right?.type).toBe('add');
  });

  it('gracefully handles empty or blank diff text', () => {
    const parsed = parseUnifiedDiff('');
    expect(parsed.hunks).toHaveLength(0);
    expect(parsed.oldPath).toBe('');
  });
});
