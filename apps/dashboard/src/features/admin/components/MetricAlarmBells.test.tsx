import { render, screen } from '@testing-library/react';
import { MetricAlarmBells } from './MetricAlarmBells';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('MetricAlarmBells', () => {
  it('renders nothing when metrics are healthy', () => {
    const metrics = { conversion: 0.05, kFactor: 0.8, nps: 60, ltvCac: 3 };
    const { container } = render(<MetricAlarmBells metrics={metrics} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders warning when conversion is low', () => {
    const metrics = { conversion: 0.005, kFactor: 0.8, nps: 60, ltvCac: 3 };
    render(<MetricAlarmBells metrics={metrics} />);
    expect(screen.getByText('Free tier burning cash')).toBeInTheDocument();
  });

  it('renders multiple warnings', () => {
    const metrics = { conversion: 0.005, kFactor: 0.1, nps: 10, ltvCac: 0.5 };
    render(<MetricAlarmBells metrics={metrics} />);
    expect(screen.getByText('Free tier burning cash')).toBeInTheDocument();
    expect(screen.getByText('Not viral, relying on paid acquisition')).toBeInTheDocument();
    expect(screen.getByText('Users unhappy, churn will spike')).toBeInTheDocument();
    expect(screen.getByText('Losing money on every customer')).toBeInTheDocument();
  });
});
