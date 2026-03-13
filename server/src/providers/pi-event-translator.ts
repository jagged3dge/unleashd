/**
 * Pi Event Translator
 *
 * Strategy Pattern: Translates pi RPC events to unleashd ProviderEvents.
 *
 * Each event type has its own translation strategy.
 * Open/Closed Principle: Easy to add new event types without modifying existing code.
 */

import type { PiRpcEvent } from './pi-rpc-types';
import type { ProviderEvent } from './index';

/**
 * Translation strategy for a specific event type
 */
type TranslationStrategy = (event: PiRpcEvent) => ProviderEvent | null;

/**
 * Translates pi RPC events to unleashd provider events
 */
export class PiEventTranslator {
  private strategies: Map<PiRpcEvent['type'], TranslationStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerStrategies();
  }

  /**
   * Register all translation strategies
   * Strategy Pattern: Each event type has its own translation logic
   */
  private registerStrategies(): void {
    // agent_start → message_start
    this.strategies.set('agent_start', () => ({
      type: 'message_start',
    }));

    // text_delta → text_delta
    this.strategies.set('text_delta', (event) => {
      if (event.type !== 'text_delta') return null;
      return {
        type: 'text_delta',
        text: event.delta,
      };
    });

    // thinking_delta → text_delta with prefix
    this.strategies.set('thinking_delta', (event) => {
      if (event.type !== 'thinking_delta') return null;
      return {
        type: 'text_delta',
        text: `[Thinking] ${event.delta}`,
      };
    });

    // tool_execution_start → tool_use
    this.strategies.set('tool_execution_start', (event) => {
      if (event.type !== 'tool_execution_start') return null;
      return {
        type: 'tool_use',
        name: event.toolName,
        input: event.args,
      };
    });

    // message_end → message_complete
    this.strategies.set('message_end', () => ({
      type: 'message_complete',
      reason: 'success',
    }));

    // agent_end → message_complete
    this.strategies.set('agent_end', () => ({
      type: 'message_complete',
      reason: 'success',
    }));

    // tool_execution_end - internal tracking only, don't emit
    this.strategies.set('tool_execution_end', () => null);

    // auto_compaction_start/end - internal events, don't emit
    this.strategies.set('auto_compaction_start', () => null);
    this.strategies.set('auto_compaction_end', () => null);
  }

  /**
   * Translate a pi event to a provider event
   * Returns null if event should not be emitted
   */
  translate(event: PiRpcEvent): ProviderEvent | null {
    const strategy = this.strategies.get(event.type);
    
    if (!strategy) {
      console.warn(`[PiEventTranslator] No strategy for event type: ${event.type}`);
      return null;
    }

    return strategy(event);
  }

  /**
   * Register a custom translation strategy
   * Open/Closed Principle: Extend behavior without modifying
   */
  registerStrategy(
    eventType: PiRpcEvent['type'],
    strategy: TranslationStrategy
  ): void {
    this.strategies.set(eventType, strategy);
  }
}
