/**
 * Domain Value Objects for Pi Provider
 * 
 * Value objects are immutable objects that represent domain concepts.
 * They enforce validation rules and provide type safety.
 * 
 * Key principles:
 * - Immutable (readonly fields)
 * - Validate on construction
 * - Provide meaningful operations
 * - Equality based on value, not identity
 */

import { ThinkingLevel } from '../index.js';
import {
  InvalidConversationIdError,
  InvalidModelIdError,
  NegativeAmountError,
  CurrencyMismatchError,
} from './errors.js';

/**
 * Conversation identifier (must be a valid UUID v4)
 * 
 * @example
 * ```typescript
 * const id = ConversationId.fromString('550e8400-e29b-41d4-a716-446655440000');
 * console.log(id.toString()); // '550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export class ConversationId {
  private static readonly UUID_PATTERN = 
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(private readonly value: string) {
    if (!ConversationId.UUID_PATTERN.test(value)) {
      throw new InvalidConversationIdError(value);
    }
  }

  /**
   * Create ConversationId from string
   * @throws InvalidConversationIdError if not a valid UUID
   */
  static fromString(id: string): ConversationId {
    return new ConversationId(id);
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another ConversationId
   */
  equals(other: ConversationId): boolean {
    return this.value === other.value;
  }
}

/**
 * Pi model identifier
 * Supports formats: provider/model or provider/model:thinking
 * 
 * @example
 * ```typescript
 * const model = PiModelId.parse('anthropic/claude-3-5-sonnet-latest');
 * console.log(model.toCommandArgs()); // ['--model', 'anthropic/claude-3-5-sonnet-latest']
 * 
 * const modelWithThinking = PiModelId.parse('openai/gpt-4o:high');
 * console.log(modelWithThinking.toCommandArgs()); 
 * // ['--model', 'openai/gpt-4o', '--thinking', 'high']
 * ```
 */
export class PiModelId {
  private constructor(
    private readonly provider: string,
    private readonly model: string,
    private readonly thinking?: ThinkingLevel
  ) {
    if (!provider || !model) {
      throw new InvalidModelIdError(
        `${provider}/${model}`, 
        'Provider and model are required'
      );
    }
  }

  /**
   * Parse model ID from string
   * Supports: provider/model or provider/model:thinking
   * 
   * @throws InvalidModelIdError if format is invalid
   */
  static parse(raw: string): PiModelId {
    if (!raw || raw.trim().length === 0) {
      throw new InvalidModelIdError(raw, 'Model ID cannot be empty');
    }

    // Split on colon to separate thinking level
    const [providerModel, thinking] = raw.split(':');
    
    // Split on slash to separate provider and model
    const slashIndex = providerModel.indexOf('/');
    if (slashIndex === -1) {
      throw new InvalidModelIdError(
        raw,
        'Must be in format provider/model or provider/model:thinking'
      );
    }

    const provider = providerModel.slice(0, slashIndex);
    const model = providerModel.slice(slashIndex + 1);

    if (!provider || !model) {
      throw new InvalidModelIdError(
        raw,
        'Both provider and model must be non-empty'
      );
    }

    return new PiModelId(provider, model, thinking as ThinkingLevel);
  }

  /**
   * Convert to command-line arguments for pi CLI
   * @returns Array of arguments: ['--model', 'provider/model', '--thinking', 'level']
   */
  toCommandArgs(): string[] {
    const args = ['--model', `${this.provider}/${this.model}`];
    
    if (this.thinking) {
      args.push('--thinking', this.thinking);
    }
    
    return args;
  }

  /**
   * Check if model has thinking level specified
   */
  hasThinking(): boolean {
    return this.thinking !== undefined;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.thinking
      ? `${this.provider}/${this.model}:${this.thinking}`
      : `${this.provider}/${this.model}`;
  }

  /**
   * Get provider name
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get thinking level (if any)
   */
  getThinking(): ThinkingLevel | undefined {
    return this.thinking;
  }
}

/**
 * Money value object for cost tracking
 * Enforces non-negative amounts and currency matching for operations
 * 
 * @example
 * ```typescript
 * const cost1 = Money.dollars(0.0025);
 * const cost2 = Money.dollars(0.0030);
 * const total = cost1.add(cost2);
 * console.log(total.format()); // '$0.0055'
 * ```
 */
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new NegativeAmountError();
    }
  }

  /**
   * Create Money in US dollars
   */
  static dollars(amount: number): Money {
    return new Money(amount, 'USD');
  }

  /**
   * Create Money in euros
   */
  static euros(amount: number): Money {
    return new Money(amount, 'EUR');
  }

  /**
   * Create Money with custom currency
   */
  static of(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  /**
   * Add two Money values (must be same currency)
   * @throws CurrencyMismatchError if currencies don't match
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract two Money values (must be same currency)
   * @throws CurrencyMismatchError if currencies don't match
   * @throws NegativeAmountError if result would be negative
   */
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new NegativeAmountError();
    }
    return new Money(result, this.currency);
  }

  /**
   * Format money for display
   * @returns String like '$10.1234' for USD
   */
  format(): string {
    if (this.currency === 'USD') {
      return `$${this.amount.toFixed(4)}`;
    }
    return `${this.amount.toFixed(4)} ${this.currency}`;
  }

  /**
   * Get numeric amount
   */
  getAmount(): number {
    return this.amount;
  }

  /**
   * Get currency code
   */
  getCurrency(): string {
    return this.currency;
  }

  /**
   * Check equality with another Money
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

/**
 * Thinking block from pi responses
 * Represents a block of reasoning/thinking content
 * 
 * @example
 * ```typescript
 * const thinking = ThinkingBlock.create('Let me analyze this...', 0);
 * if (!thinking.isEmpty()) {
 *   console.log(thinking.getContent());
 * }
 * ```
 */
export class ThinkingBlock {
  private constructor(
    private readonly content: string,
    private readonly index: number
  ) {
    if (index < 0) {
      throw new Error('Thinking block index cannot be negative');
    }
  }

  /**
   * Create thinking block from content
   * Automatically creates empty block if content is whitespace
   */
  static create(content: string, index: number): ThinkingBlock {
    if (content.trim().length === 0) {
      return ThinkingBlock.empty(index);
    }
    return new ThinkingBlock(content, index);
  }

  /**
   * Create explicitly empty thinking block
   */
  static empty(index: number): ThinkingBlock {
    return new ThinkingBlock('', index);
  }

  /**
   * Check if block is empty
   */
  isEmpty(): boolean {
    return this.content.length === 0;
  }

  /**
   * Get thinking content
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Get block index (position in message)
   */
  getIndex(): number {
    return this.index;
  }
}

/**
 * Session identifier for pi sessions
 * Can be any non-empty string
 * 
 * @example
 * ```typescript
 * const id = SessionId.generate(); // Random UUID
 * const customId = SessionId.fromString('my-session-123');
 * ```
 */
export class SessionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
  }

  /**
   * Generate new random session ID (UUID)
   */
  static generate(): SessionId {
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return new SessionId(uuid);
  }

  /**
   * Create SessionId from existing string
   * @throws Error if string is empty or whitespace
   */
  static fromString(id: string): SessionId {
    return new SessionId(id);
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another SessionId
   */
  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
