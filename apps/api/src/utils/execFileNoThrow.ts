/**
 * execFileNoThrow - Safe command execution utility
 *
 * Provides safe command execution using child_process.execFile to prevent shell injection.
 * All arguments are passed as an array, avoiding shell string parsing.
 *
 * Usage:
 * ```typescript
 * import { execFileNoThrow, isExecSuccess } from '../../utils/execFileNoThrow.js';
 *
 * const result = await execFileNoThrow('docker', ['exec', 'n8n', 'n8n', 'list:workflow']);
 * if (isExecSuccess(result)) {
 *   console.log(result.stdout);
 * }
 * ```
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Result from command execution
 */
export interface ExecResult {
  /** Exit status code (0 = success, non-zero = failure) */
  status: number;
  /** Standard output (trimmed) */
  stdout: string;
  /** Standard error output (trimmed) */
  stderr: string;
}

/**
 * Execute a command safely without throwing exceptions.
 *
 * Uses child_process.execFile to prevent shell injection.
 * All command arguments are passed as an array, avoiding shell string parsing.
 *
 * @param command - Command to execute (e.g., 'docker', 'node', 'npm')
 * @param args - Command arguments as an array
 * @param options - Optional execution options
 * @returns ExecResult with status, stdout, and stderr
 *
 * @example
 * ```typescript
 * const result = await execFileNoThrow('docker', ['exec', 'n8n', 'n8n', 'list:workflow']);
 * if (result.status === 0) {
 *   console.log(result.stdout);
 * } else {
 *   console.error(result.stderr);
 * }
 * ```
 */
export async function execFileNoThrow(
  command: string,
  args: string[] = [],
  options?: {
    /** Working directory for the command */
    cwd?: string;
    /** Environment variables */
    env?: NodeJS.ProcessEnv;
    /** Timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Maximum buffer size for stdout/stderr (default: 10MB) */
    maxBuffer?: number;
  }
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: 30000, // 30 seconds
      ...options,
    });

    return {
      status: 0,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    if (error instanceof Error) {
      const execError = error as NodeJS.ErrnoException & {
        stdout?: string | Buffer;
        stderr?: string | Buffer;
      };

      // Handle structured error from execFile
      return {
        status: execError.code ? parseInt(execError.code, 10) : 1,
        stdout: 'stdout' in execError ? String(execError.stdout || '') : '',
        stderr: execError.message || (execError.stderr ? String(execError.stderr || '') : ''),
      };
    }

    return {
      status: 1,
      stdout: '',
      stderr: String(error),
    };
  }
}

/**
 * Check if command execution was successful (status code 0)
 *
 * @param result - ExecResult from execFileNoThrow
 * @returns true if status is 0, false otherwise
 *
 * @example
 * ```typescript
 * const result = await execFileNoThrow('docker', ['ps']);
 * if (isExecSuccess(result)) {
 *   console.log('Command succeeded');
 * }
 * ```
 */
export function isExecSuccess(result: ExecResult): boolean {
  return result.status === 0;
}

/**
 * Get error message from ExecResult
 *
 * @param result - ExecResult from execFileNoThrow
 * @returns Error message (empty string if successful)
 *
 * @example
 * ```typescript
 * const result = await execFileNoThrow('docker', ['ps']);
 * const error = getExecError(result);
 * if (error) {
 *   console.error('Command failed:', error);
 * }
 * ```
 */
export function getExecError(result: ExecResult): string {
  if (result.status === 0) return '';
  return result.stderr || `Command failed with status ${result.status}`;
}

/**
 * Execute command and throw on error (alternative to execFileNoThrow for cases where you want exceptions)
 *
 * @param command - Command to execute
 * @param args - Command arguments
 * @param options - Optional execution options
 * @returns stdout if successful
 * @throws Error with stderr message if command fails
 *
 * @example
 * ```typescript
 * try {
 *   const output = await execFileOrThrow('ls', ['-la']);
 *   console.log(output);
 * } catch (error) {
 *   console.error('Command failed:', error.message);
 * }
 * ```
 */
export async function execFileOrThrow(
  command: string,
  args: string[] = [],
  options?: Parameters<typeof execFileNoThrow>[2]
): Promise<string> {
  const result = await execFileNoThrow(command, args, options);

  if (!isExecSuccess(result)) {
    throw new Error(getExecError(result));
  }

  return result.stdout;
}
