import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrendSparkline } from './TrendSparkline';

describe('TrendSparkline', () => {
  it('renders SVG with correct points', () => {
    const data = [10, 20, 30];
    const { container } = render(<TrendSparkline data={data} width={100} height={50} />);
    
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    
    const points = polyline?.getAttribute('points');
    // First point should be at x=0, y=height (min value)
    expect(points).toContain('0,50');
    // Last point should be at x=width, y=0 (max value)
    expect(points).toContain('100,0');
  });

  it('returns null if data length is less than 2', () => {
    const { container } = render(<TrendSparkline data={[10]} />);
    expect(container.firstChild).toBeNull();
  });
});
