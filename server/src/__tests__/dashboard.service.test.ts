import { describe, expect, it } from 'vitest';
import {
  buildMonthlyActivity,
  calculateConversionRate,
} from '../modules/dashboard/dashboard.service.js';

describe('calculateConversionRate', () => {
  it('returns 0 when there are no leads', () => {
    expect(calculateConversionRate(0, 0)).toBe(0);
    expect(calculateConversionRate(5, -1)).toBe(0);
  });

  it('rounds to one decimal place', () => {
    expect(calculateConversionRate(1, 3)).toBe(33.3);
    expect(calculateConversionRate(2, 3)).toBe(66.7);
    expect(calculateConversionRate(3, 3)).toBe(100);
  });
});

describe('buildMonthlyActivity', () => {
  const reference = new Date(2026, 4, 15); // May 2026

  it('always returns six chronological month buckets', () => {
    const points = buildMonthlyActivity([], reference);
    expect(points).toHaveLength(6);
    expect(points.map((point) => point.month)).toEqual([
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
    ]);
    expect(points.every((point) => point.leads === 0 && point.revenue === 0)).toBe(true);
  });

  it('counts leads by creation month and revenue by conversion month', () => {
    const points = buildMonthlyActivity(
      [
        {
          status: 'new',
          source: 'website',
          deal_value: 1000,
          created_at: new Date(2026, 4, 2).toISOString(),
          updated_at: new Date(2026, 4, 2).toISOString(),
        },
        {
          status: 'converted',
          source: 'referral',
          deal_value: '2500.50',
          created_at: new Date(2026, 3, 20).toISOString(),
          updated_at: new Date(2026, 4, 3).toISOString(),
        },
        {
          status: 'converted',
          source: 'linkedin',
          deal_value: 500,
          created_at: new Date(2026, 3, 1).toISOString(),
          updated_at: new Date(2026, 3, 28).toISOString(),
        },
      ],
      reference
    );

    const may = points.find((point) => point.month === 'May');
    const april = points.find((point) => point.month === 'Apr');

    expect(may).toMatchObject({ leads: 1, revenue: 2501 });
    expect(april).toMatchObject({ leads: 2, revenue: 500 });
  });
});
