/**
 * Email Service
 *
 * Handles transactional emails for the platform.
 * Uses console-based implementation in development, can be extended with real providers.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailServiceConfig {
  provider: 'console' | 'resend' | 'sendgrid' | 'aws-ses';
  fromEmail: string;
  fromName: string;
  apiKey?: string;
}

/**
 * EmailService sends transactional emails
 *
 * Development mode: Logs to console
 * Production mode: Uses configured provider (Resend, SendGrid, AWS SES, etc.)
 */
export class EmailService {
  private config: EmailServiceConfig;

  constructor(config?: Partial<EmailServiceConfig>) {
    this.config = {
      provider: config?.provider || 'console',
      fromEmail: config?.fromEmail || process.env.EMAIL_FROM_EMAIL || 'noreply@codename.app',
      fromName: config?.fromName || process.env.EMAIL_FROM_NAME || 'codename',
      apiKey: config?.apiKey || process.env.EMAIL_API_KEY,
    };
  }

  /**
   * Send an email
   * @param options - Email options (to, subject, html, text)
   * @returns Promise that resolves when email is sent
   */
  async send(options: EmailOptions): Promise<void> {
    const { provider } = this.config;

    try {
      switch (provider) {
        case 'console':
          await this.sendConsole(options);
          break;
        case 'resend':
          await this.sendResend(options);
          break;
        case 'sendgrid':
          await this.sendSendgrid(options);
          break;
        default:
          console.warn(`[EmailService] Unsupported provider: ${provider}, falling back to console`);
          await this.sendConsole(options);
      }
    } catch (error) {
      // If any provider fails, fall back to console
      console.warn(`[EmailService] ${provider} provider failed: ${error instanceof Error ? error.message : 'Unknown error'}, falling back to console`);
      await this.sendConsole(options);
    }
  }

  /**
   * Console-based email implementation for development
   */
  private async sendConsole(options: EmailOptions): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 EMAIL [Console Provider]`);
    console.log(`To: ${options.to}`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log(`Subject: ${options.subject}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (options.text) {
      console.log(`Text: ${options.text}`);
    }
    if (options.html) {
      console.log(`HTML: ${options.html.substring(0, 200)}${options.html.length > 200 ? '...' : ''}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Resend.com email implementation
   * Requires: EMAIL_PROVIDER=resend and EMAIL_API_KEY set
   */
  private async sendResend(options: EmailOptions): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('EMAIL_API_KEY is required for Resend provider');
    }

    // TODO: Implement Resend API call
    // import { Resend } from 'resend';
    // const resend = new Resend(this.config.apiKey);
    // await resend.emails.send({...});

    console.warn('[EmailService] Resend provider not fully implemented, falling back to console');
    await this.sendConsole(options);
  }

  /**
   * SendGrid email implementation
   * Requires: EMAIL_PROVIDER=sendgrid and EMAIL_API_KEY set
   */
  private async sendSendgrid(options: EmailOptions): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('EMAIL_API_KEY is required for SendGrid provider');
    }

    // TODO: Implement SendGrid API call
    // import sgMail from '@sendgrid/mail';
    // sgMail.setApiKey(this.config.apiKey);
    // await sgMail.send({...});

    console.warn('[EmailService] SendGrid provider not fully implemented, falling back to console');
    await this.sendConsole(options);
  }

  /**
   * Send visit cap warning email to tenant
   * @param to - Recipient email address
   * @param businessName - Business name for personalization
   * @param currentVisits - Current visit count
   * @param visitCap - Monthly visit cap
   */
  async sendVisitCapWarning(
    to: string,
    businessName: string,
    currentVisits: number,
    visitCap: number
  ): Promise<void> {
    const percentage = Math.round((currentVisits / visitCap) * 100);

    await this.send({
      to,
      subject: `⚠️ Your site is at ${percentage}% of its monthly visit limit`,
      text: `
Hi ${businessName},

Your website has reached ${currentVisits} of ${visitCap} monthly visits (${percentage}%).

At ${visitCap} visits, your site will show an upgrade message to visitors. To continue
unlimited visits, consider upgrading to the Standard plan.

Upgrade: https://codename.app/pricing?upgrade=standard

---
codename Platform
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>⚠️ Visit Limit Warning</h2>
    <p>Hi <strong>${businessName}</strong>,</p>
    <p>Your website has reached <strong>${currentVisits} of ${visitCap}</strong> monthly visits (${percentage}%).</p>

    <div class="alert">
      At ${visitCap} visits, your site will show an upgrade message to visitors.
    </div>

    <p>To continue with unlimited visits, consider upgrading to the Standard plan.</p>

    <p><a href="https://codename.app/pricing?upgrade=standard" class="button">Upgrade Now</a></p>

    <hr>
    <p><small>codename Platform</small></p>
  </div>
</body>
</html>
      `.trim(),
    });
  }

  /**
   * Send visit cap reached email (hard limit)
   * @param to - Recipient email address
   * @param businessName - Business name for personalization
   */
  async sendVisitCapReached(to: string, businessName: string): Promise<void> {
    await this.send({
      to,
      subject: `🚫 Your site has reached its monthly visit limit`,
      text: `
Hi ${businessName},

Your website has reached its monthly visit limit. Visitors are now seeing an
upgrade message on your site.

To restore unlimited access, upgrade to the Standard plan.

Upgrade: https://codename.app/pricing?upgrade=standard

---
codename Platform
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🚫 Visit Limit Reached</h2>
    <p>Hi <strong>${businessName}</strong>,</p>
    <p>Your website has reached its monthly visit limit.</p>

    <div class="alert">
      Visitors are now seeing an upgrade message on your site.
    </div>

    <p>To restore unlimited access, upgrade to the Standard plan.</p>

    <p><a href="https://codename.app/pricing?upgrade=standard" class="button">Upgrade Now</a></p>

    <hr>
    <p><small>codename Platform</small></p>
  </div>
</body>
</html>
      `.trim(),
    });
  }
}

// Export singleton instance
export const emailService = new EmailService({
  provider: (process.env.EMAIL_PROVIDER as any) || 'console',
  fromEmail: process.env.EMAIL_FROM_EMAIL,
  fromName: process.env.EMAIL_FROM_NAME,
  apiKey: process.env.EMAIL_API_KEY,
});
