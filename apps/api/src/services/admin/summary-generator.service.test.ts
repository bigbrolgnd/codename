import { describe, it, expect } from 'vitest';
import { SummaryGeneratorService } from './summary-generator.service';

describe('SummaryGeneratorService', () => {
  const service = new SummaryGeneratorService();

  it('generates popularity insight when visitors increase', () => {
    const stats = {
      totalRevenue: 0,
      totalBookings: 0,
      totalVisitors: 100,
      prevRevenue: 0,
      prevBookings: 0,
      prevVisitors: 50,
    };

    const results = service.generate(stats);
    const popularity = results.find(r => r.message.includes('popular'));
    
    expect(popularity).toBeDefined();
    expect(popularity?.trend).toBe('positive');
    expect(popularity?.percentage).toBe(100);
  });

  it('generates revenue insight when money is made', () => {
    const stats = {
      totalRevenue: 50000,
      totalBookings: 5,
      totalVisitors: 100,
      prevRevenue: 0,
      prevBookings: 0,
      prevVisitors: 0,
    };

    const results = service.generate(stats);
    const revenue = results.find(r => r.message.includes('generated $500'));
    
    expect(revenue).toBeDefined();
    expect(revenue?.trend).toBe('positive');
  });
});
