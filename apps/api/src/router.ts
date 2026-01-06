import { router } from './trpc';
import { provisionRouter } from './routers/provision.router';
import { siteRouter } from './routers/site.router';
import { extractionRouter } from './routers/extraction.router';
import { bookingRouter } from './routers/booking.router';
import { adminRouter } from './routers/admin.router';
import { marketingRouter } from './routers/marketing.router';

export const appRouter = router({
  site: siteRouter,
  extraction: extractionRouter,
  provision: provisionRouter,
  booking: bookingRouter,
  admin: adminRouter,
  marketing: marketingRouter,
});

export type AppRouter = typeof appRouter;
