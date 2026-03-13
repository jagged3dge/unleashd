/**
 * Pi Protocol Handler
 *
 * Single Responsibility: Handle JSONL protocol serialization/deserialization.
 *
 * Responsibilities:
 * - Serialize commands to JSONL format
 * - Parse responses from JSONL format
 * - Buffer incomplete lines
 * - Track command/response correlation
 *
 * Does NOT handle:
 * - Process management (see PiProcessManager)
 * - Event parsing (see PiEventStream)
 * - RPC coordination (see PiRpcClient)
 */

import type { PiRpcCommand, PiRpcResponse } from './pi-rpc-types';
import { isPiRpcResponse } from './pi-rpc-types';

interface PendingCommand {
  command: PiRpcCommand;
  timestamp: number;
}

/**
 * Handles JSONL protocol for pi RPC communication
 */
export class PiProtocolHandler {
  private lineBuffer = '';
  private pendingCommands = new Map<string, PendingCommand>();

  /**
   * Serialize a command to JSONL format
   */
  serializeCommand(command: PiRpcCommand): string {
    return JSON.stringify(command) + '\n';
  }

  /**
   * Parse a response from JSONL format
   * Returns null if line is not a valid response
   */
  parseResponse(line: string): PiRpcResponse | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const obj = JSON.parse(trimmed);
      
      if (isPiRpcResponse(obj)) {
        return obj;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Process a chunk of data, extracting complete lines
   * Buffers incomplete lines for next chunk
   */
  processChunk(chunk: string): string[] {
    this.lineBuffer += chunk;
    const lines: string[] = [];

    let newlineIndex: number;
    while ((newlineIndex = this.lineBuffer.indexOf('\n')) !== -1) {
      const line = this.lineBuffer.slice(0, newlineIndex + 1);
      lines.push(line);
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
    }

    return lines;
  }

  /**
   * Track a command for correlation
   */
  trackCommand(command: PiRpcCommand): void {
    this.pendingCommands.set(command.id, {
      command,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear a pending command (received response)
   */
  clearPending(id: string): void {
    this.pendingCommands.delete(id);
  }

  /**
   * Check if a command is pending
   */
  isPending(id: string): boolean {
    return this.pendingCommands.has(id);
  }

  /**
   * Get commands that have timed out
   */
  getTimedOutCommands(timeoutMs: number): PendingCommand[] {
    const now = Date.now();
    const timedOut: PendingCommand[] = [];

    for (const [id, pending] of this.pendingCommands.entries()) {
      if (now - pending.timestamp > timeoutMs) {
        timedOut.push(pending);
        this.pendingCommands.delete(id);
      }
    }

    return timedOut;
  }

  /**
   * Get all pending command IDs
   */
  getPendingIds(): string[] {
    return Array.from(this.pendingCommands.keys());
  }

  /**
   * Clear all pending commands
   */
  clearAll(): void {
    this.pendingCommands.clear();
  }
}
