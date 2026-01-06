import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { AvailabilityService } from '../services/booking/availability.service';
import { PaymentService } from '../services/booking/payment.service';
import { DatabaseManager } from '@codename/database';
import { TRPCError } from '@trpc/server';

const dbManager = new DatabaseManager();
const availabilityService = new AvailabilityService(dbManager);
const paymentService = new PaymentService(dbManager);

export const bookingRouter = router({
  listServices: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/, 'Invalid tenant ID format'),
    }))
    .query(async ({ input }) => {
      try {
        const result = await dbManager.queryInSchema(input.tenantId,
          `SELECT id, name, price, duration, category, description FROM services`
        );
        return result.rows;
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Tenant '${input.tenantId}' not found`,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getAvailableSlots: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/, 'Invalid tenant ID format'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
      serviceId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        // 1. Fetch service duration
        const serviceResult = await dbManager.queryInSchema(input.tenantId,
          `SELECT duration FROM services WHERE id = $1`,
          [input.serviceId]
        );

        if (serviceResult.rows.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service not found in this tenant',
          });
        }

        const duration = serviceResult.rows[0].duration;

        // 2. Get slots
        const slots = await availabilityService.getAvailableSlots(
          input.tenantId,
          input.date,
          duration,
          0
        );

        return slots;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        
        // Handle postgres error for missing schema
        if (error.message?.includes('does not exist')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Tenant '${input.tenantId}' not found`,
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  createPaymentIntent: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      serviceId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await paymentService.createIntent(input.tenantId, input.serviceId);
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  confirmBooking: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      customerName: z.string().min(2),
      customerEmail: z.string().email(),
      serviceId: z.string().uuid(),
      startTime: z.string().datetime(),
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await paymentService.finalizeBooking(input.tenantId, input);
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),
});
