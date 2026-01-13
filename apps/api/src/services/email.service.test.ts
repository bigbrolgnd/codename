import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let emailService: EmailService;
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService({ provider: 'console' });
  });

  describe('constructor', () => {
    it('uses default configuration when no config provided', () => {
      const service = new EmailService();
      expect(service).toBeDefined();
    });

    it('uses provided configuration', () => {
      const service = new EmailService({
        provider: 'console',
        fromEmail: 'test@example.com',
        fromName: 'Test App',
      });
      expect(service).toBeDefined();
    });
  });

  describe('send', () => {
    it('sends email via console provider', async () => {
      await emailService.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content',
      });

      // Check that console.log was called at all
      expect(consoleLogSpy).toHaveBeenCalled();
      // Check that at least one call contains the expected content
      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('EMAIL [Console Provider]');
      expect(combinedOutput).toContain('recipient@example.com');
      expect(combinedOutput).toContain('Test Subject');
    });

    it('logs HTML content when provided', async () => {
      await emailService.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>HTML content</p>',
      });

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('HTML:');
    });

    it('truncates long HTML content in logs', async () => {
      const longHtml = '<p>'.repeat(100);

      await emailService.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: longHtml,
      });

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('...');
    });

    it('falls back to console for unsupported provider', async () => {
      const service = new EmailService({ provider: 'unsupported' as any });

      await service.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content',
      });

      // Check for the unsupported provider warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unsupported provider'));
      // And that console.log was called (the fallback output)
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('sendVisitCapWarning', () => {
    it('sends visit cap warning email', async () => {
      await emailService.sendVisitCapWarning('test@example.com', 'Test Business', 4000, 5000);

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('80%');
      expect(combinedOutput).toContain('test@example.com');
      expect(combinedOutput).toContain('Test Business');
    });

    it('calculates percentage correctly', async () => {
      await emailService.sendVisitCapWarning('test@example.com', 'Test Business', 2500, 5000);

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('50%');
    });

    it('includes upgrade URL in email', async () => {
      await emailService.sendVisitCapWarning('test@example.com', 'Test Business', 4000, 5000);

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('codename.app/pricing?upgrade=standard');
    });
  });

  describe('sendVisitCapReached', () => {
    it('sends visit cap reached email', async () => {
      await emailService.sendVisitCapReached('test@example.com', 'Test Business');

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('Your site has reached its monthly visit limit');
      expect(combinedOutput).toContain('test@example.com');
      expect(combinedOutput).toContain('Test Business');
    });

    it('includes upgrade message in email', async () => {
      await emailService.sendVisitCapReached('test@example.com', 'Test Business');

      const calls = consoleLogSpy.mock.calls.map((call: any) => call.join(' '));
      const combinedOutput = calls.join(' ');
      expect(combinedOutput).toContain('upgrade message on your site');
    });
  });

  describe('Resend provider (not implemented)', () => {
    it('falls back to console for Resend provider', async () => {
      const service = new EmailService({
        provider: 'resend',
        apiKey: 'test-key',
      });

      await service.send({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Check that console.warn was called with the fallback message
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Resend provider not fully implemented'));
    });
  });

  describe('SendGrid provider (not implemented)', () => {
    it('falls back to console for SendGrid provider', async () => {
      const service = new EmailService({
        provider: 'sendgrid',
        apiKey: 'test-key',
      });

      await service.send({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Check that console.warn was called with the fallback message
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('SendGrid provider not fully implemented'));
      // And that console.log was called (the actual email output)
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('falls back to console when SendGrid API key is missing', async () => {
      const service = new EmailService({
        provider: 'sendgrid',
      });

      // The send method should handle the error and fall back to console
      await expect(service.send({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      })).resolves.not.toThrow();

      // Check that console.warn was called with the error message
      expect(consoleWarnSpy).toHaveBeenCalled();
      // And that console.log was called (the fallback output)
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
