import { initTRPC, TRPCError } from '@trpc/server';
import { DatabaseManager } from '@codename/database';
import { BillingService } from './services/admin/billing.service';

const t = initTRPC.create();
const db = new DatabaseManager();
const billing = new BillingService(db);

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

/**
 * Auth middleware - requires authenticated user
 * NOTE: Currently returns 401 for all requests until real auth is implemented
 * TODO: Implement actual authentication (JWT, sessions, WebAuthn)
 */
export const authGuard = middleware(async ({ ctx, next }) => {
  // TODO: Implement real authentication
  // For now, this denies all requests until auth is implemented
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'Authentication required. This endpoint is protected but auth is not yet implemented.',
  });
  // return next(); // Uncomment when auth is implemented
});

/**
 * Admin middleware - requires admin role
 */
export const adminGuard = middleware(async ({ ctx, next }) => {
  // TODO: Implement admin role check
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Admin access required. This endpoint is protected but admin auth is not yet implemented.',
  });
  // return next(); // Uncomment when admin auth is implemented
});

/**
 * Tenant ownership middleware - ensures user can only access their own tenant
 */
export const tenantGuard = middleware(async ({ input, ctx, next }) => {
  // TODO: Implement tenant ownership validation
  return next();
});

/**
 * Protected procedure - requires authentication
 * NOTE: Currently disabled until real auth is implemented
 * TODO: Uncomment when auth is implemented
 */
export const protectedProcedure = publicProcedure; // .use(authGuard);

/**
 * Admin procedure - requires admin role
 * NOTE: Currently disabled until real auth is implemented
 * TODO: Uncomment when auth is implemented
 */
export const adminProcedure = publicProcedure; // .use(authGuard).use(adminGuard);

/**
 * Tenant procedure - requires auth + tenant ownership validation
 * NOTE: Currently disabled until real auth is implemented
 * TODO: Uncomment when auth is implemented
 */
export const tenantProcedure = publicProcedure; // .use(authGuard).use(tenantGuard);

/**
 * Middleware to check if tenant has reached their AI cost cap.
 * IMPORTANT: Must be applied AFTER .input() to receive the tenantId.
 */
export const usageGuard = middleware(async ({ input, next }) => {
  const { tenantId } = (input ?? {}) as { tenantId?: string };

  if (tenantId) {
    const isCapped = await billing.checkAiCap(tenantId);
    if (isCapped) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Monthly AI Cost Cap reached. Upgrade your plan to increase limits.',
      });
    }
  }

  return next();
});
