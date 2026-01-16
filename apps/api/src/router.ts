import { router } from './trpc';
import { provisionRouter } from './routers/provision.router';
import { siteRouter } from './routers/site.router';
import { extractionRouter } from './routers/extraction.router';
import { bookingRouter } from './routers/booking.router';
import { adminRouter } from './routers/admin.router';
import { marketingRouter } from './routers/marketing.router';
import { referralRouter } from './routers/referral.router';
import { analyticsRouter } from './routers/analytics.router';
import { n8nRouter } from './routers/n8n.router';
import { activityRouter } from './routers/activity.router';

export const appRouter = router({
  site: siteRouter,
  extraction: extractionRouter,
  provision: provisionRouter,
  booking: bookingRouter,
  admin: adminRouter,
  marketing: marketingRouter,
  referral: referralRouter,
  analytics: analyticsRouter,
  n8n: n8nRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
