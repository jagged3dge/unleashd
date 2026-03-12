/**
 * Pi Process Manager
 *
 * Single Responsibility: Manage the lifecycle of the pi CLI process.
 *
 * Responsibilities:
 * - Spawn pi process with correct arguments
 * - Track process running status
 * - Terminate process gracefully
 * - Restart process
 * - Provide process handle abstraction
 *
 * Does NOT handle:
 * - Protocol communication (see PiProtocolHandler)
 * - Event parsing (see PiEventStream)
 * - RPC coordination (see PiRpcClient)
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { getHarness } from '../../../vendor/agent-cli-tool/src/harnesses/index';
import { buildCommand } from '../../../vendor/agent-cli-tool/src/build';

/**
 * Process handle abstraction
 * Follows Dependency Inversion Principle - depend on abstraction not concrete ChildProcess
 */
export interface ProcessHandle {
  pid: number | undefined;
  stdin: NodeJS.WritableStream;
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
  on(event: string, listener: (...args: any[]) => void): this;
  kill(signal?: NodeJS.Signals | number): boolean;
}

/**
 * Options for spawning pi process
 */
export interface SpawnOptions {
  model: string;
  sessionId?: string;
  cwd?: string;
}

/**
 * Manages the pi CLI process lifecycle
 */
export class PiProcessManager {
  private process: ChildProcess | null = null;
  private lastSpawnOptions: SpawnOptions | null = null;

  /**
   * Spawn a new pi process
   * @param options - Spawn configuration
   * @returns Promise resolving to process handle
   */
  async spawn(options: SpawnOptions): Promise<ProcessHandle> {
    // Terminate existing process if running
    if (this.process) {
      await this.terminate();
    }

    // Store options for restart capability
    this.lastSpawnOptions = options;

    // Build command using harness config
    const command = buildCommand('pi', {
      model: options.model,
      sessionId: options.sessionId,
      cwd: options.cwd,
    });

    console.log('[PiProcessManager] Spawning pi:', command.argv.join(' '));

    // Spawn process
    this.process = spawn(command.argv[0], command.argv.slice(1), {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Handle spawn errors
    return new Promise((resolve, reject) => {
      const errorHandler = (error: Error) => {
        console.error('[PiProcessManager] Spawn error:', error);
        this.process = null;
        reject(error);
      };

      this.process!.once('error', errorHandler);

      // Wait for process to be ready (or fail immediately)
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process!.removeListener('error', errorHandler);
          
          // Set up ongoing error handling
          this.process!.on('error', (error) => {
            console.error('[PiProcessManager] Process error:', error);
          });

          this.process!.on('exit', (code, signal) => {
            console.log(`[PiProcessManager] Process exited: code=${code}, signal=${signal}`);
            this.process = null;
          });

          resolve(this.process! as ProcessHandle);
        }
      }, 100);
    });
  }

  /**
   * Check if process is currently running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  /**
   * Terminate the running process
   */
  async terminate(): Promise<void> {
    if (!this.process || this.process.killed) {
      return;
    }

    console.log('[PiProcessManager] Terminating process...');

    try {
      this.process.kill('SIGTERM');

      // Wait for graceful shutdown (max 5 seconds)
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.process && !this.process.killed) {
            console.warn('[PiProcessManager] Graceful shutdown timeout, sending SIGKILL');
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.process!.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.process = null;
    } catch (error) {
      console.error('[PiProcessManager] Termination error:', error);
      // Don't throw - termination errors should be logged but not crash
      this.process = null;
    }
  }

  /**
   * Restart the process with the same options
   */
  async restart(): Promise<ProcessHandle> {
    if (!this.lastSpawnOptions) {
      throw new Error('Cannot restart: no previous spawn options');
    }

    console.log('[PiProcessManager] Restarting process...');
    await this.terminate();
    return this.spawn(this.lastSpawnOptions);
  }

  /**
   * Get the current process handle (for direct access if needed)
   * @returns Current process or null if not running
   */
  getProcess(): ProcessHandle | null {
    return this.process;
  }
}
