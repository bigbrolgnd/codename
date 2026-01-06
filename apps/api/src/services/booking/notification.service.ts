export interface NotificationPayload {
  customerName: string;
  customerEmail: string;
  businessName: string;
  serviceName: string;
  startTime: string;
}

export class NotificationService {
  /**
   * Simulates sending SMS and WhatsApp confirmations
   */
  async sendBookingConfirmation(payload: NotificationPayload) {
    const timeStr = new Date(payload.startTime).toLocaleString();
    
    const message = `
      Confirmed: ${payload.serviceName} at ${payload.businessName}
      Time: ${timeStr}
      Client: ${payload.customerName}
    `.trim();

    console.log(`[NotificationService] DISPATCHING CHANNELS...`);
    
    // 1. Mock SMS (Customer)
    console.log(`[SMS] To Customer (${payload.customerName}): ${message}`);
    
    // 2. Mock WhatsApp (Owner)
    console.log(`[WhatsApp] To Owner (${payload.businessName}): New Booking! ${payload.customerName} - ${payload.serviceName} at ${timeStr}`);

    return {
      success: true,
      channels: ['sms', 'whatsapp'],
      timestamp: new Date().toISOString()
    };
  }
}
