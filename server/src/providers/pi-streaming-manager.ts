/**
 * Pi Streaming Manager
 *
 * Single Responsibility: Manage streaming state and buffers for pi conversations.
 *
 * Responsibilities:
 * - Track streaming state per conversation
 * - Buffer text and thinking deltas
 * - Broadcast chunks in real-time
 * - Provide completion and abort logic
 *
 * Does NOT handle:
 * - RPC communication (see PiRpcClient)
 * - Event translation (see PiEventTranslator)
 * - Process management (see PiProcessManager)
 */

/**
 * Streaming state for a conversation
 */
interface StreamingState {
  isStreaming: boolean;
  textBuffer: string;
  thinkingBuffer: string;
}

/**
 * Buffered content
 */
export interface BufferedContent {
  text: string;
  thinking: string;
}

/**
 * Broadcast callback for streaming chunks
 */
export type BroadcastCallback = (
  conversationId: string,
  chunk: string,
  isThinking: boolean
) => void;

/**
 * Manages streaming state for pi conversations
 */
export class PiStreamingManager {
  private states = new Map<string, StreamingState>();
  private broadcastCallback: BroadcastCallback;

  constructor(broadcastCallback: BroadcastCallback) {
    this.broadcastCallback = broadcastCallback;
  }

  /**
   * Start streaming for a conversation
   */
  startStreaming(conversationId: string): void {
    this.states.set(conversationId, {
      isStreaming: true,
      textBuffer: '',
      thinkingBuffer: '',
    });
  }

  /**
   * Check if a conversation is currently streaming
   */
  isStreaming(conversationId: string): boolean {
    const state = this.states.get(conversationId);
    return state?.isStreaming ?? false;
  }

  /**
   * Append a text delta
   */
  appendTextDelta(conversationId: string, text: string): void {
    const state = this.states.get(conversationId);
    if (!state || !state.isStreaming) {
      return;
    }

    state.textBuffer += text;
    this.broadcastCallback(conversationId, text, false);
  }

  /**
   * Append a thinking delta
   */
  appendThinkingDelta(conversationId: string, thinking: string): void {
    const state = this.states.get(conversationId);
    if (!state || !state.isStreaming) {
      return;
    }

    state.thinkingBuffer += thinking;
    this.broadcastCallback(conversationId, thinking, true);
  }

  /**
   * Complete streaming and return buffered content
   */
  completeStreaming(conversationId: string): BufferedContent {
    const state = this.states.get(conversationId);
    if (!state) {
      return { text: '', thinking: '' };
    }

    const content: BufferedContent = {
      text: state.textBuffer,
      thinking: state.thinkingBuffer,
    };

    // Clean up state
    this.states.delete(conversationId);

    return content;
  }

  /**
   * Abort streaming and return partial content
   */
  abortStreaming(conversationId: string): BufferedContent {
    // Same as complete, but semantically different
    return this.completeStreaming(conversationId);
  }

  /**
   * Get current buffer state
   */
  getBuffer(conversationId: string): BufferedContent {
    const state = this.states.get(conversationId);
    if (!state) {
      return { text: '', thinking: '' };
    }

    return {
      text: state.textBuffer,
      thinking: state.thinkingBuffer,
    };
  }

  /**
   * Get buffer size in characters
   */
  getBufferSize(conversationId: string): number {
    const buffer = this.getBuffer(conversationId);
    return buffer.text.length + buffer.thinking.length;
  }

  /**
   * Clear all streaming states (for cleanup)
   */
  clearAll(): void {
    this.states.clear();
  }

  /**
   * Get count of active streams
   */
  getActiveStreamCount(): number {
    return Array.from(this.states.values()).filter(s => s.isStreaming).length;
  }
}
