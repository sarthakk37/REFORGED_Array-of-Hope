// Unit tests for Presenter Mode sequence ordering and narrative consistency.

import { describe, it, expect } from 'vitest';
import { PRESENTER_STEPS } from '@/components/demo/PresenterOverlay';

describe('components/demo/PresenterOverlay sequence order', () => {
  it('defines 8 sequential narrative steps', () => {
    expect(PRESENTER_STEPS).toHaveLength(8);
  });

  it('introduces Priya\'s app in step 1', () => {
    expect(PRESENTER_STEPS[0].caption).toContain("Meet Priya's payment app");
  });

  it('explains the silent API break in step 2', () => {
    expect(PRESENTER_STEPS[1].caption).toContain("silently changes their API");
    expect(PRESENTER_STEPS[1].caption).toContain("Priya's app crashes");
  });

  it('features the Reviewer catching precision error in step 4', () => {
    expect(PRESENTER_STEPS[3].caption).toContain('Reviewer catches');
    expect(PRESENTER_STEPS[3].caption).toContain('precision error');
  });

  it('validates safe test room with old AND new data in step 5', () => {
    expect(PRESENTER_STEPS[4].caption).toContain("safe test room");
    expect(PRESENTER_STEPS[4].caption).toContain("BOTH the legacy payload and the new payload");
  });

  it('includes human approval and pull request creation in step 6', () => {
    expect(PRESENTER_STEPS[5].caption).toContain("One click approves the verified fix");
    expect(PRESENTER_STEPS[5].caption).toContain("pull request preview");
  });

  it('demonstrates instant memory healing on second app in step 7', () => {
    expect(PRESENTER_STEPS[6].caption).toContain("second team's app");
    expect(PRESENTER_STEPS[6].caption).toContain("remembers the verified recipe");
    expect(PRESENTER_STEPS[6].caption).toContain("0 AI calls");
  });

  it('summarizes comparison in step 8', () => {
    expect(PRESENTER_STEPS[7].caption).toContain("First fix: ~22s, 4 AI calls");
    expect(PRESENTER_STEPS[7].caption).toContain("Second app: ~5s, 0 AI calls");
  });
});
