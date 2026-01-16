/**
 * n8n Session Management
 *
 * Handles authentication and session lifecycle for n8n REST API.
 * Stores session cookie in memory only (never persisted to disk for security).
 */

import type { N8nSession, N8nLoginRequest, Result } from './types.js';

// ============================================================================
// Session Storage (in-memory only)
// ============================================================================

let currentSession: N8nSession | null = null;

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get the current active session
 */
export function getSession(): N8nSession | null {
  // Check if session is expired
  if (currentSession && new Date() > currentSession.expiresAt) {
    currentSession = null;
    return null;
  }

  return currentSession;
}

/**
 * Set the current session
 */
export function setSession(cookie: string, expiresInMs: number = 24 * 60 * 60 * 1000): N8nSession {
  const session: N8nSession = {
    cookie,
    expiresAt: new Date(Date.now() + expiresInMs),
  };

  currentSession = session;
  return session;
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  currentSession = null;
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(): boolean {
  const session = getSession();
  return session !== null && new Date() < session.expiresAt;
}

/**
 * Get the session cookie for API requests
 * @throws Error if no valid session exists
 */
export function getSessionCookie(): string {
  const session = getSession();

  if (!session) {
    throw new Error('No active session. Please authenticate first.');
  }

  // Format the cookie for use in request headers
  return formatSessionCookie(session.cookie);
}

/**
 * Parse session cookie from n8n login response
 * n8n returns Set-Cookie header with format: "n8n-auth=jwt_token; Path=/; HttpOnly; Secure; SameSite=Lax"
 */
export function parseSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null;
  }

  // Extract n8n-auth cookie value (JWT token)
  const match = setCookieHeader.match(/n8n-auth=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Format session cookie for request header
 */
export function formatSessionCookie(cookie: string): string {
  return `n8n-auth=${cookie}`;
}

// ============================================================================
// Session Refresh Logic
// ============================================================================

/**
 * Determine if a request should trigger session refresh based on status code
 * @param statusCode - HTTP status code from response
 * @returns true if session should be refreshed
 */
export function shouldRefreshSession(statusCode: number): boolean {
  return statusCode === 401;
}

/**
 * Session refresh state to prevent multiple concurrent refresh attempts
 */
let isRefreshing = false;
let refreshPromise: Promise<N8nSession> | null = null;

/**
 * Refresh session with mutex to prevent concurrent refreshes
 * @param loginFn - Function to call to perform login
 */
export async function refreshSessionIfNeeded(
  statusCode: number,
  loginFn: () => Promise<N8nSession>
): Promise<N8nSession | null> {
  if (!shouldRefreshSession(statusCode)) {
    return getSession();
  }

  // If already refreshing, wait for existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Start new refresh
  isRefreshing = true;
  refreshPromise = performRefresh(loginFn);

  try {
    const session = await refreshPromise;
    return session;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * Perform the actual session refresh
 */
async function performRefresh(loginFn: () => Promise<N8nSession>): Promise<N8nSession> {
  try {
    clearSession();
    const newSession = await loginFn();
    return newSession;
  } catch (error) {
    throw new Error(`Failed to refresh session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Export for Testing
// ============================================================================

export function _resetSession(): void {
  clearSession();
  isRefreshing = false;
  refreshPromise = null;
}
