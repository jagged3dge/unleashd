/**
 * Pi Conversation Manager
 *
 * Manages RPC clients for pi conversations.
 * Integrates with server conversation handling.
 *
 * Responsibilities:
 * - Create/stop pi conversations
 * - Manage RPC client lifecycle
 * - Route events to conversation handlers
 * - Handle model changes and aborts
 */

import { PiRpcClient } from './pi-rpc-client';
import { PiEventTranslator } from './pi-event-translator';
import type { PiRpcEvent } from './pi-rpc-types';
import type { ProviderEvent } from './index';

/**
 * Options for creating a pi conversation
 */
export interface PiConversationOptions {
  model: string;
  sessionId?: string;
  resume?: boolean;
  workingDirectory?: string;
}

/**
 * Event callback for conversation events
 */
export type ConversationEventCallback = (
  conversationId: string,
  event: ProviderEvent
) => void;

/**
 * Per-conversation state
 */
interface ConversationState {
  client: PiRpcClient;
  translator: PiEventTranslator;
  options: PiConversationOptions;
}

/**
 * Manages pi RPC clients per conversation
 */
export class PiConversationManager {
  private conversations = new Map<string, ConversationState>();
  private globalEventCallback?: ConversationEventCallback;
  private perConversationCallbacks = new Map<string, ConversationEventCallback>();

  /**
   * Create a new pi conversation
   */
  async createConversation(
    conversationId: string,
    options: PiConversationOptions
  ): Promise<void> {
    // Don't create if already exists
    if (this.conversations.has(conversationId)) {
      throw new Error(`Conversation ${conversationId} already exists`);
    }

    const client = new PiRpcClient();
    const translator = new PiEventTranslator();

    // Wire up event handling
    client.onEvent((piEvent) => {
      this.handlePiEvent(conversationId, piEvent, translator);
    });

    // Start the RPC client
    await client.start({
      model: options.model,
      sessionId: options.sessionId,
      cwd: options.workingDirectory,
    });

    // Store conversation state
    this.conversations.set(conversationId, {
      client,
      translator,
      options,
    });

    console.log(`[PiConversationManager] Created conversation ${conversationId}`);
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: string,
    message: string
  ): Promise<string> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return state.client.sendPrompt(message);
  }

  /**
   * Change the model for a conversation
   */
  async setModel(
    conversationId: string,
    model: string
  ): Promise<void> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Parse model ID to extract provider and model
    const parts = model.split('/');
    const provider = parts.length > 1 ? parts[0] : 'anthropic';
    const modelId = parts.length > 1 ? parts.slice(1).join('/') : model;

    await state.client.setModel(provider, modelId);
    state.options.model = model;
  }

  /**
   * Abort the current operation for a conversation
   */
  async abort(conversationId: string): Promise<void> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      // No-op if conversation doesn't exist
      return;
    }

    // For now, we don't have a command ID to abort
    // This would need to be tracked if we want granular abort
    console.log(`[PiConversationManager] Abort requested for ${conversationId}`);
  }

  /**
   * Stop a conversation
   */
  async stopConversation(conversationId: string): Promise<void> {
    const state = this.conversations.get(conversationId);
    if (!state) {
      // No-op if already stopped
      return;
    }

    await state.client.stop();
    this.conversations.delete(conversationId);
    this.perConversationCallbacks.delete(conversationId);

    console.log(`[PiConversationManager] Stopped conversation ${conversationId}`);
  }

  /**
   * Stop all conversations
   */
  async stopAll(): Promise<void> {
    const conversationIds = Array.from(this.conversations.keys());
    
    await Promise.all(
      conversationIds.map(id => this.stopConversation(id))
    );
  }

  /**
   * Check if a conversation exists
   */
  hasConversation(conversationId: string): boolean {
    return this.conversations.has(conversationId);
  }

  /**
   * Register global event callback
   */
  onEvent(callback: ConversationEventCallback): void {
    this.globalEventCallback = callback;
  }

  /**
   * Register per-conversation event callback
   */
  onConversationEvent(
    conversationId: string,
    callback: ConversationEventCallback
  ): void {
    this.perConversationCallbacks.set(conversationId, callback);
  }

  /**
   * Handle a pi RPC event
   */
  private handlePiEvent(
    conversationId: string,
    piEvent: PiRpcEvent,
    translator: PiEventTranslator
  ): void {
    // Translate to provider event
    const providerEvent = translator.translate(piEvent);
    if (!providerEvent) {
      return; // Internal event, don't emit
    }

    // Emit to per-conversation callback
    const perConvCallback = this.perConversationCallbacks.get(conversationId);
    if (perConvCallback) {
      perConvCallback(conversationId, providerEvent);
    }

    // Emit to global callback
    if (this.globalEventCallback) {
      this.globalEventCallback(conversationId, providerEvent);
    }
  }

  /**
   * Get conversation count (for debugging/monitoring)
   */
  getConversationCount(): number {
    return this.conversations.size;
  }
}
