import { DatabaseManager } from '@codename/database';
import { notificationService } from './notification.service';

export class PaymentService {
  constructor(private db: DatabaseManager) {}

  /**
   * Simulates creating a Stripe Payment Intent
   */
  async createIntent(tenantId: string, serviceId: string) {
    // 1. Fetch service to get price
    const result = await this.db.queryInSchema(tenantId, 
      `SELECT price FROM services WHERE id = $1`,
      [serviceId]
    );

    if (result.rows.length === 0) throw new Error('Service not found');

    const price = result.rows[0].price;
    const depositAmount = Math.round(price * 0.2); // 20% deposit

    // Simulate Stripe Intent
    return {
      id: `pi_${crypto.randomUUID().replace(/-/g, '')}`,
      amount: depositAmount,
      currency: 'usd',
      status: 'requires_payment_method'
    };
  }

  /**
   * Finalizes the booking in the database
   */
  async finalizeBooking(tenantId: string, data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    serviceId: string;
    startTime: string;
    paymentIntentId: string;
  }) {
    const startTime = new Date(data.startTime);
    
    // 1. Fetch metadata for security and notifications (include price for deposit calculation)
    const metadataResult = await this.db.queryInSchema(tenantId,
      `SELECT s.duration, s.name as service_name, s.price as price, t.business_name
       FROM services s
       CROSS JOIN public.tenants t
       WHERE s.id = $1 AND t.schema_name = $2`,
      [data.serviceId, tenantId]
    );

    if (metadataResult.rows.length === 0) throw new Error('Service or Tenant not found');

    const { duration, service_name, price, business_name } = metadataResult.rows[0];
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const depositAmount = Math.round(price * 0.2); // 20% deposit

    // 2. Create booking record
    const result = await this.db.queryInSchema(tenantId,
      `INSERT INTO bookings (
        customer_name, 
        customer_email, 
        service_id, 
        start_time, 
        end_time, 
        status, 
        deposit_paid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        data.customerName,
        data.customerEmail,
        data.serviceId,
        startTime.toISOString(),
        endTime.toISOString(),
        'confirmed',
        true
      ]
    );

    // 3. Trigger Notification (Fire and forget)
    notificationService.sendBookingConfirmation({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      businessName: business_name,
      serviceName: service_name,
      startTime: data.startTime,
      depositAmount: depositAmount,
      bookingId: result.rows[0].id,
    }).catch(err => console.error('[PaymentService] Notification failed:', err));

    return {
      bookingId: result.rows[0].id,
      status: 'confirmed'
    };
  }
}
