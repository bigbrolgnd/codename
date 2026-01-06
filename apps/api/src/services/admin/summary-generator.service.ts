import { InsightSummary } from '@codename/api';

export class SummaryGeneratorService {
  /**
   * Generates a list of plain english summaries based on raw stats
   */
  generate(stats: {
    totalRevenue: number;
    totalBookings: number;
    totalVisitors: number;
    prevRevenue: number;
    prevBookings: number;
    prevVisitors: number;
  }): InsightSummary[] {
    const insights: InsightSummary[] = [];

    // 1. Popularity (Visitors)
    const visitorDiff = stats.totalVisitors - stats.prevVisitors;
    if (stats.totalVisitors > 0) {
      if (visitorDiff > 0) {
        const pct = Math.round((visitorDiff / (stats.prevVisitors || 1)) * 100);
        insights.push({
          message: `You're popular! ${stats.totalVisitors.toLocaleString()} visitors checked out your site this week.`,
          trend: 'positive',
          percentage: pct > 0 ? pct : undefined
        });
      } else {
        insights.push({
          message: `Steady interest. ${stats.totalVisitors.toLocaleString()} people visited your site recently.`,
          trend: 'neutral'
        });
      }
    }

    // 2. Revenue / Money
    if (stats.totalRevenue > 0) {
      const revenueStr = (stats.totalRevenue / 100).toLocaleString();
      insights.push({
        message: `Cha-ching! You've generated $${revenueStr} in automated revenue.`,
        trend: 'positive'
      });
    }

    // 3. Conversion
    if (stats.totalVisitors > 0 && stats.totalBookings > 0) {
      const convPct = Math.round((stats.totalBookings / stats.totalVisitors) * 100);
      insights.push({
        message: `Conversion is looking good. ${convPct}% of your visitors are becoming customers.`,
        trend: convPct > 10 ? 'positive' : 'neutral'
      });
    } else if (stats.totalVisitors > 0) {
      insights.push({
        message: "Your site is live and attracting visitors. We're waiting for your first 'Ghost Booking'!",
        trend: 'neutral'
      });
    }

    return insights;
  }
}
