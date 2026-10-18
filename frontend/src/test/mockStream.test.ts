// Unit tests for mockStream agent event sequencing.
// Tests event progression, critic retry loop, and rapid memory-healed sequences.

import { describe, it, expect } from 'vitest';
import { getMockRunSequence } from '@/api/mockStream';

describe('api/mockStream event ordering', () => {
  it('generates complete multi-agent sequence for fresh "rename" scenario', () => {
    const sequence = getMockRunSequence('rename', false);

    expect(sequence[0].agent).toBe('system');
    expect(sequence[1].agent).toBe('sentinel');

    const agentsInOrder = sequence.map((s) => s.agent);
    expect(agentsInOrder).toContain('sentinel');
    expect(agentsInOrder).toContain('triage');
    expect(agentsInOrder).toContain('locator');
    expect(agentsInOrder).toContain('coder');
    expect(agentsInOrder).toContain('verifier');
    expect(agentsInOrder).toContain('pr');
    expect(agentsInOrder[agentsInOrder.length - 1]).toBe('system');
    expect(sequence[sequence.length - 1].message).toBe('run_finished');
  });

  it('contains critic retry loop for "type" drift scenario', () => {
    const sequence = getMockRunSequence('type', false);

    // Should contain verifier failure followed by critic feedback and coder retry
    const verifierError = sequence.find((s) => s.agent === 'verifier' && s.kind === 'error');
    const criticThought = sequence.find((s) => s.agent === 'critic' && s.kind === 'thought');
    const verifierSuccess = sequence.find((s) => s.agent === 'verifier' && s.kind === 'success');

    expect(verifierError).toBeDefined();
    expect(criticThought).toBeDefined();
    expect(verifierSuccess).toBeDefined();

    const errorIndex = sequence.indexOf(verifierError!);
    const criticIndex = sequence.indexOf(criticThought!);
    const successIndex = sequence.indexOf(verifierSuccess!);

    expect(criticIndex).toBeGreaterThan(errorIndex);
    expect(successIndex).toBeGreaterThan(criticIndex);
  });

  it('generates streamlined 0-LLM sequence for memory healed run', () => {
    const sequence = getMockRunSequence('rename', true, 'fp_test');

    const agents = sequence.map((s) => s.agent);

    // Memory sequence should only have system, sentinel, memory, verifier, pr, system
    expect(agents).toContain('memory');
    expect(agents).toContain('verifier');
    expect(agents).toContain('pr');

    // Should NOT contain coder, locator, or triage
    expect(agents).not.toContain('coder');
    expect(agents).not.toContain('locator');
    expect(agents).not.toContain('triage');

    expect(sequence[sequence.length - 1].message).toBe('run_finished');
  });
});
