import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { appRouter } from './router';
import componentRestRouter from './routes/component.rest.router';
import agentRestRouter from './routes/agent.rest.router';
import pricingRestRouter from './routes/pricing.rest.router';
import webhookRouter from './routes/stripe.webhook.router';
import analyticsRouter from './routes/analytics.routes';

const app = express();
app.use(cors());
app.use(express.json());

// tRPC routes
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
);

// REST API routes for component system
app.use('/api/v1', componentRestRouter);

// REST API routes for AI Builder Agent
app.use('/api/v1/agent', agentRestRouter);

// REST API routes for pricing system
app.use('/api/pricing', pricingRestRouter);

// Analytics live feed (SSE)
app.use('/api/analytics', analyticsRouter);

// Stripe webhook endpoints
app.use('/api/webhooks', webhookRouter);

// Serve static files from the dashboard
const dashboardPath = '/app/apps/dashboard/dist';
app.use(express.static(dashboardPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  // Check if we are requesting an API/TRPC route that missed the middleware
  if (req.path.startsWith('/trpc') || req.path.startsWith('/api/v1')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

app.listen(4000, () => {
  console.log('API server running on port 4000');
});