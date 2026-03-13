/**
 * Pi Event Stream
 *
 * Single Responsibility: Parse and emit pi RPC events.
 *
 * Responsibilities:
 * - Parse JSONL lines as events
 * - Validate event types
 * - Emit events via callback
 *
 * Does NOT handle:
 * - Line buffering (see PiProtocolHandler)
 * - Command/response correlation (see PiProtocolHandler)
 * - Process management (see PiProcessManager)
 */

import type { PiRpcEvent } from './pi-rpc-types';
import { isPiRpcEvent } from './pi-rpc-types';

/**
 * Callback for event emission
 */
export type EventCallback = (event: PiRpcEvent) => void;

/**
 * Parses and emits pi RPC events from JSONL lines
 */
export class PiEventStream {
  private callback: EventCallback;

  constructor(callback: EventCallback) {
    this.callback = callback;
  }

  /**
   * Process a line and emit event if valid
   */
  processLine(line: string): void {
    try {
      const trimmed = line.trim();
      if (!trimmed) return;

      const obj = JSON.parse(trimmed);

      // Only emit if it's a valid event (not a response)
      if (isPiRpcEvent(obj)) {
        this.callback(obj);
      }
    } catch (error) {
      // Invalid JSON or parse error - ignore
    }
  }

  /**
   * Change the event callback
   */
  setCallback(callback: EventCallback): void {
    this.callback = callback;
  }
}
