/**
 * n8n Session Management Tests
 *
 * Unit tests for session lifecycle and refresh logic (AC 8.2)
 * Story 3-8: n8n Workflow Management API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSession,
  setSession,
  clearSession,
  isSessionValid,
  getSessionCookie,
  parseSessionCookie,
  formatSessionCookie,
  shouldRefreshSession,
  refreshSessionIfNeeded,
  _resetSession,
} from './session.js';

describe('Session Management', () => {
  beforeEach(() => {
    _resetSession();
  });

  describe('Session Storage', () => {
    it('should store and retrieve session', () => {
      const cookie = 'n8n-auth=test_token';
      setSession(cookie, 60000); // 1 minute expiry

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session?.cookie).toBe(cookie);
    });

    it('should return null for expired session', () => {
      const cookie = 'n8n-auth=test_token';
      setSession(cookie, 1); // 1ms expiry (essentially expired)

      // Wait for expiry
      return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
        const session = getSession();
        expect(session).toBeNull();
      });
    });

    it('should clear session', () => {
      setSession('n8n-auth=test_token', 60000);
      expect(getSession()).not.toBeNull();

      clearSession();
      expect(getSession()).toBeNull();
    });

    it('should check if session is valid', () => {
      setSession('n8n-auth=test_token', 60000);
      expect(isSessionValid()).toBe(true);

      clearSession();
      expect(isSessionValid()).toBe(false);
    });
  });

  describe('Session Cookie Parsing', () => {
    it('should parse session cookie from set-cookie header', () => {
      const header = 'n8n-auth=jwt_token_here; Path=/; HttpOnly; Secure; SameSite=Lax';
      const cookie = parseSessionCookie(header);

      expect(cookie).toBe('jwt_token_here');
    });

    it('should return null for missing set-cookie header', () => {
      const cookie = parseSessionCookie(null);
      expect(cookie).toBeNull();
    });

    it('should return null for malformed set-cookie header', () => {
      const cookie = parseSessionCookie('invalid-header');
      expect(cookie).toBeNull();
    });

    it('should format session cookie for request header', () => {
      const cookie = formatSessionCookie('jwt_token_here');
      expect(cookie).toBe('n8n-auth=jwt_token_here');
    });
  });

  describe('Session Cookie Retrieval', () => {
    it('should return session cookie string', () => {
      setSession('jwt_token_here', 60000);
      const cookie = getSessionCookie();

      expect(cookie).toBe('n8n-auth=jwt_token_here');
    });

    it('should throw error when no valid session exists', () => {
      clearSession();

      expect(() => getSessionCookie()).toThrow('No active session');
    });
  });
});

describe('Session Refresh Logic', () => {
  beforeEach(() => {
    _resetSession();
  });

  describe('shouldRefreshSession()', () => {
    it('should return true for 401 status code', () => {
      expect(shouldRefreshSession(401)).toBe(true);
    });

    it('should return false for other status codes', () => {
      expect(shouldRefreshSession(200)).toBe(false);
      expect(shouldRefreshSession(404)).toBe(false);
      expect(shouldRefreshSession(500)).toBe(false);
    });
  });

  describe('refreshSessionIfNeeded()', () => {
    it('should return current session if no refresh needed', async () => {
      setSession('existing_token', 60000);

      const result = await refreshSessionIfNeeded(200, async () => ({
        cookie: 'new_token',
        expiresAt: new Date(Date.now() + 60000),
      }));

      expect(result?.cookie).toBe('existing_token');
    });

    it('should refresh session on 401 status', async () => {
      setSession('old_token', 60000);

      const loginFn = vi.fn().mockResolvedValue({
        cookie: 'new_token',
        expiresAt: new Date(Date.now() + 60000),
      });

      const result = await refreshSessionIfNeeded(401, loginFn);

      expect(result).not.toBeNull();
      expect(result?.cookie).toBe('new_token');
      expect(loginFn).toHaveBeenCalled();
    });

    it('should clear old session before refresh', async () => {
      setSession('old_token', 60000);

      const loginFn = vi.fn().mockResolvedValue({
        cookie: 'new_token',
        expiresAt: new Date(Date.now() + 60000),
      });

      await refreshSessionIfNeeded(401, loginFn);

      // Check that old session was cleared
      const sessionBeforeSet = getSession();
      expect(sessionBeforeSet).toBeNull(); // Session cleared before new one set
    });

    it('should handle concurrent refresh requests (mutex pattern)', async () => {
      setSession('old_token', 60000);

      let refreshCount = 0;
      const loginFn = vi.fn().mockImplementation(async () => {
        refreshCount++;
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          cookie: `new_token_${refreshCount}`,
          expiresAt: new Date(Date.now() + 60000),
        };
      });

      // Trigger multiple concurrent refreshes
      const [result1, result2, result3] = await Promise.all([
        refreshSessionIfNeeded(401, loginFn),
        refreshSessionIfNeeded(401, loginFn),
        refreshSessionIfNeeded(401, loginFn),
      ]);

      // All should get the same result (only one refresh happened)
      expect(result1?.cookie).toBe('new_token_1');
      expect(result2?.cookie).toBe('new_token_1');
      expect(result3?.cookie).toBe('new_token_1');
      expect(refreshCount).toBe(1);
    });

    it('should throw error when refresh fails', async () => {
      setSession('old_token', 60000);

      const loginFn = vi.fn().mockRejectedValue(new Error('Auth failed'));

      await expect(
        refreshSessionIfNeeded(401, loginFn)
      ).rejects.toThrow('Failed to refresh session');
    });
  });
});
