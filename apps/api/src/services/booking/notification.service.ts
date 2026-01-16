/**
 * Notification Service for Booking Confirmations
 *
 * Triggers n8n workflow webhook for booking confirmations.
 * Sends payload with customer details, service info, and booking time.
 */

// Phone validation pattern: international format with optional + and country code
const PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/;

export interface NotificationPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessName: string;
  serviceName: string;
  startTime: string;
  depositAmount?: number;
  bookingId?: string;
}

/**
 * Validate phone number format (international format)
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return true; // Optional field
  // Remove spaces, dashes, parentheses for validation
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_PATTERN.test(cleaned);
}

export class NotificationService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.N8N_BOOKING_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      console.warn('[NotificationService] N8N_WEBHOOK_URL not configured - using mock mode');
    }
  }

  /**
   * Triggers n8n workflow webhook for booking confirmation
   *
   * Sends POST request to n8n webhook with booking details.
   * The n8n workflow should handle:
   * - SMS confirmation to customer (Twilio)
   * - WhatsApp notification to business owner
   * - Calendar invite generation (ICS)
   */
  async sendBookingConfirmation(payload: NotificationPayload) {
    // Validate phone number format if provided
    if (payload.customerPhone && !isValidPhoneNumber(payload.customerPhone)) {
      console.warn(`[NotificationService] Invalid phone number format: ${payload.customerPhone}. Skipping phone notifications.`);
      // Continue with notification but set phone to null
      payload.customerPhone = undefined;
    }

    const timeStr = new Date(payload.startTime).toLocaleString();

    const webhookPayload = {
      eventType: 'booking.confirmed',
      timestamp: new Date().toISOString(),
      data: {
        customer: {
          name: payload.customerName,
          email: payload.customerEmail,
          phone: payload.customerPhone || null,
        },
        business: {
          name: payload.businessName,
        },
        booking: {
          serviceName: payload.serviceName,
          startTime: payload.startTime,
          depositAmount: payload.depositAmount || 0,
          bookingId: payload.bookingId || null,
        },
      },
    };

    // If webhook URL is configured, trigger n8n workflow
    if (this.webhookUrl) {
      try {
        console.log(`[NotificationService] Triggering n8n webhook: ${this.webhookUrl}`);
        console.log(`[NotificationService] Payload:`, JSON.stringify(webhookPayload, null, 2));

        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.N8N_WEBHOOK_SECRET && {
              'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET,
            }),
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`n8n webhook returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[NotificationService] n8n workflow triggered successfully:`, result);

        return {
          success: true,
          channels: ['n8n'],
          workflowExecutionId: result.executionId || null,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // Log error but don't fail the booking
        console.error(`[NotificationService] n8n webhook failed:`, error);
        console.error(`[NotificationService] Falling back to mock mode`);

        // Fall back to mock mode
        return this.mockSendBookingConfirmation(payload, webhookPayload);
      }
    }

    // Mock mode if webhook URL not configured
    return this.mockSendBookingConfirmation(payload, webhookPayload);
  }

  /**
   * Mock notification service (fallback when webhook not configured)
   */
  private mockSendBookingConfirmation(payload: NotificationPayload, webhookPayload: any) {
    const message = `
      Confirmed: ${payload.serviceName} at ${payload.businessName}
      Time: ${new Date(payload.startTime).toLocaleString()}
      Client: ${payload.customerName}
    `.trim();

    console.log(`[NotificationService] MOCK MODE - DISPATCHING CHANNELS...`);
    console.log(`[NotificationService] Webhook Payload:`, JSON.stringify(webhookPayload, null, 2));

    // 1. Mock SMS (Customer)
    console.log(`[SMS] To Customer (${payload.customerName}): ${message}`);

    // 2. Mock WhatsApp (Owner)
    console.log(`[WhatsApp] To Owner (${payload.businessName}): New Booking! ${payload.customerName} - ${payload.serviceName} at ${new Date(payload.startTime).toLocaleString()}`);

    return {
      success: true,
      channels: ['sms', 'whatsapp'],
      mock: true,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
