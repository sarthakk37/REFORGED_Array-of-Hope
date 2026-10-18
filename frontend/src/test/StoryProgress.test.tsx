// Unit tests for StoryProgress 5-step progress bar and retry state presentation.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryProgress } from '@/components/runs/StoryProgress';

describe('components/runs/StoryProgress', () => {
  it('renders all 5 steps in the plain-English narrative', () => {
    render(<StoryProgress currentStep={1} isFinished={false} />);

    expect(screen.getByText('API changed')).toBeInTheDocument();
    expect(screen.getByText('Problem found')).toBeInTheDocument();
    expect(screen.getByText('Fix written')).toBeInTheDocument();
    expect(screen.getByText('Fix tested')).toBeInTheDocument();
    expect(screen.getByText('Ready for your approval')).toBeInTheDocument();
  });

  it('renders amber retrying state when Reviewer catches a bug on Step 4', () => {
    render(<StoryProgress currentStep={4} isFinished={false} isRetrying={true} />);

    expect(screen.getByText(/retrying fix\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/reviewer caught bug/i)).toBeInTheDocument();
  });

  it('renders completed state when isFinished is true', () => {
    const { container } = render(<StoryProgress currentStep={5} isFinished={true} />);

    // Check SVG checkmark icons rendered for completed steps
    const checkIcons = container.querySelectorAll('svg.lucide-check');
    expect(checkIcons.length).toBe(5);
  });
});
