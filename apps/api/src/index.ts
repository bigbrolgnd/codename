import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { appRouter } from './router';
import { DatabaseManager } from '@codename/database';
import { ReputationService } from './services/admin/reputation.service';

const app = express();
app.use(cors());

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
);

// --- Background Automation ---
// Initialize DatabaseManager - will use PG environment variables
const dbManager = new DatabaseManager();
const reputationService = new ReputationService(dbManager);

// Simulate a background worker polling for reviews every 10 minutes
const REVIEW_INGESTION_INTERVAL = 10 * 60 * 1000;
setInterval(async () => {
  console.log('[BackgroundJob] Starting automated review ingestion cycle...');
  try {
    // Fetch all active tenants from the master registry
    const tenantsResult = await dbManager.queryInSchema('public', 
      "SELECT schema_name FROM tenants WHERE status = 'active'"
    );
    
    for (const tenant of tenantsResult.rows) {
      try {
        await reputationService.ingestReviews(tenant.schema_name);
        console.log(`[BackgroundJob] Review ingestion complete for ${tenant.schema_name}`);
      } catch (err) {
        console.error(`[BackgroundJob] Failed for tenant ${tenant.schema_name}:`, err);
      }
    }
  } catch (error) {
    console.error('[BackgroundJob] Critical failure in ingestion cycle:', error);
  }
}, REVIEW_INGESTION_INTERVAL);
// --- End Automation ---

// Serve static files from the dashboard
// Correct absolute path for container structure
const dashboardPath = '/app/apps/dashboard/dist';
app.use(express.static(dashboardPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  // Check if we are requesting an API/TRPC route that missed the middleware
  if (req.path.startsWith('/trpc')) {
    return res.status(404).json({ error: 'TRPC route not found' });
  }
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

app.listen(4000, () => {
  console.log('API server running on port 4000');
});
