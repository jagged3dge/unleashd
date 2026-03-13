/**
 * Pi RPC Client (Facade)
 *
 * Responsibility: Coordinate RPC communication components.
 *
 * This is a Facade that orchestrates:
 * - PiProcessManager: Process lifecycle
 * - PiProtocolHandler: JSONL protocol
 * - PiEventStream: Event parsing
 *
 * Provides high-level API for RPC operations.
 */

import { randomUUID } from 'node:crypto';
import { PiProcessManager } from './pi-process-manager';
import { PiProtocolHandler } from './pi-protocol-handler';
import { PiEventStream, type EventCallback } from './pi-event-stream';
import type { PiRpcCommand, PiRpcEvent } from './pi-rpc-types';

export interface StartOptions {
  model: string;
  sessionId?: string;
  cwd?: string;
}

/**
 * High-level RPC client for pi communication
 */
export class PiRpcClient {
  private processManager: PiProcessManager;
  private protocolHandler: PiProtocolHandler;
  private eventStream: PiEventStream;
  private running = false;

  constructor() {
    this.processManager = new PiProcessManager();
    this.protocolHandler = new PiProtocolHandler();
    this.eventStream = new PiEventStream(() => {
      // Default no-op callback
    });
  }

  /**
   * Start the RPC client
   */
  async start(options: StartOptions): Promise<void> {
    if (this.running) {
      throw new Error('RPC client already running');
    }

    // Start process
    const handle = await this.processManager.spawn({
      model: options.model,
      sessionId: options.sessionId,
      cwd: options.cwd,
    });

    // Set up stdout processing
    if (handle.stdout) {
      handle.stdout.on('data', (chunk: Buffer) => {
        const lines = this.protocolHandler.processChunk(chunk.toString());
        
        for (const line of lines) {
          // Try parsing as response
          const response = this.protocolHandler.parseResponse(line);
          if (response) {
            this.protocolHandler.clearPending(response.id);
            // TODO: Emit response event
            continue;
          }

          // Otherwise treat as event
          this.eventStream.processLine(line);
        }
      });
    }

    this.running = true;
  }

  /**
   * Send a prompt command
   */
  async sendPrompt(message: string, images?: any[]): Promise<string> {
    const id = randomUUID();
    const command: PiRpcCommand = {
      type: 'prompt',
      id,
      message,
      images,
    };

    await this.sendCommand(command);
    return id;
  }

  /**
   * Send an abort command
   */
  async sendAbort(commandId: string): Promise<void> {
    const command: PiRpcCommand = {
      type: 'abort',
      id: commandId,
    };

    await this.sendCommand(command);
  }

  /**
   * Set the model
   */
  async setModel(provider: string, modelId: string): Promise<string> {
    const id = randomUUID();
    const command: PiRpcCommand = {
      type: 'set_model',
      id,
      provider,
      modelId,
    };

    await this.sendCommand(command);
    return id;
  }

  /**
   * Send a command to the pi process
   */
  private async sendCommand(command: PiRpcCommand): Promise<void> {
    const handle = this.processManager.getProcess();
    if (!handle) {
      throw new Error('Process not running');
    }

    if (!handle.stdin) {
      throw new Error('Process stdin not available');
    }

    this.protocolHandler.trackCommand(command);
    const line = this.protocolHandler.serializeCommand(command);
    
    return new Promise((resolve, reject) => {
      handle.stdin!.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Register event callback
   */
  onEvent(callback: EventCallback): void {
    this.eventStream.setCallback(callback);
  }

  /**
   * Stop the RPC client
   */
  async stop(): Promise<void> {
    await this.processManager.terminate();
    this.running = false;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running && this.processManager.isRunning();
  }
}
