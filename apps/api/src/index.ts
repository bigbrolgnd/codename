import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import cors from 'cors';
import { appRouter } from './router';

const app = express();
app.use(cors());

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
);

app.listen(4000, () => {
  console.log('API server running on port 4000');
});
