import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Bone, Loading, SkeletonRows } from './Skeleton.tsx';

describe('Skeleton (D-157)', () => {
  it('announces loading once and hides the shapes from assistive technology', () => {
    const { container } = render(
      <Loading>
        <Bone width="40%" height={36} />
        <SkeletonRows count={3} variant="card" />
      </Loading>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Lädt …');
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    const bone = container.querySelector('[aria-hidden="true"]');
    expect(bone).toHaveStyle({ width: '40%', height: '36px' });
  });

  it('renders the requested number of rows with title and meta bars', () => {
    const { container } = render(<SkeletonRows count={4} />);
    const list = container.firstElementChild;
    expect(list?.children).toHaveLength(4);
    expect(list?.children[0]?.querySelectorAll('span[style]')).toHaveLength(2);
  });
});
