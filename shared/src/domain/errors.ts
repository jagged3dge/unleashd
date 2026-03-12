/**
 * Domain Error Hierarchy for Pi Provider
 * 
 * All errors extend PiProviderError base class and include:
 * - Unique error codes for programmatic handling
 * - Error cause chaining for debugging
 * - Proper stack traces
 * - Type-safe error construction
 */

/**
 * Base error for all Pi provider domain errors.
 * Supports error codes and error chaining for better debugging.
 * 
 * @example
 * ```typescript
 * throw new PiProviderError('Configuration invalid', 'CONFIG_ERROR');
 * ```
 * 
 * @example With cause chaining
 * ```typescript
 * try {
 *   await loadConfig();
 * } catch (err) {
 *   throw new PiProviderError('Failed to load config', 'CONFIG_ERROR', err);
 * }
 * ```
 */
export class PiProviderError extends Error {
  /**
   * Machine-readable error code for programmatic error handling
   */
  public readonly code: string;

  /**
   * Optional original error that caused this error (error chaining)
   */
  public readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = 'PiProviderError';
    this.code = code;
    this.cause = cause;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if ('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when a requested model cannot be found in the pi model registry.
 * 
 * @example
 * ```typescript
 * const model = findModel('unknown/model');
 * if (!model) {
 *   throw new ModelNotFoundError('unknown/model');
 * }
 * ```
 */
export class ModelNotFoundError extends PiProviderError {
  constructor(modelId: string) {
    super(
      `Model not found: ${modelId}`,
      'MODEL_NOT_FOUND'
    );
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Thrown when a model ID has an invalid format.
 * 
 * @example
 * ```typescript
 * if (!modelId.includes('/')) {
 *   throw new InvalidModelIdError(modelId, 'Must be in format provider/model');
 * }
 * ```
 */
export class InvalidModelIdError extends PiProviderError {
  constructor(modelId: string, reason: string) {
    super(
      `Invalid model ID "${modelId}": ${reason}`,
      'INVALID_MODEL_ID'
    );
    this.name = 'InvalidModelIdError';
  }
}

/**
 * Thrown when thinking mode is requested for a model that doesn't support it.
 * 
 * @example
 * ```typescript
 * if (!model.supportsThinking && requestedThinking) {
 *   throw new ThinkingNotSupportedError(model.id);
 * }
 * ```
 */
export class ThinkingNotSupportedError extends PiProviderError {
  constructor(modelId: string) {
    super(
      `Model ${modelId} does not support thinking mode`,
      'THINKING_NOT_SUPPORTED'
    );
    this.name = 'ThinkingNotSupportedError';
  }
}

/**
 * Thrown when a conversation ID is not a valid UUID.
 * 
 * @example
 * ```typescript
 * const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 * if (!uuidPattern.test(id)) {
 *   throw new InvalidConversationIdError(id);
 * }
 * ```
 */
export class InvalidConversationIdError extends PiProviderError {
  constructor(id: string) {
    super(
      `Invalid conversation ID: ${id}. Must be a valid UUID.`,
      'INVALID_CONVERSATION_ID'
    );
    this.name = 'InvalidConversationIdError';
  }
}

/**
 * Thrown when attempting to create Money with a negative amount.
 * 
 * @example
 * ```typescript
 * if (amount < 0) {
 *   throw new NegativeAmountError();
 * }
 * ```
 */
export class NegativeAmountError extends PiProviderError {
  constructor() {
    super(
      'Money amount cannot be negative',
      'NEGATIVE_AMOUNT'
    );
    this.name = 'NegativeAmountError';
  }
}

/**
 * Thrown when attempting to perform arithmetic operations on Money with different currencies.
 * 
 * @example
 * ```typescript
 * const usd = Money.dollars(10);
 * const eur = Money.euros(10);
 * try {
 *   usd.add(eur); // Throws CurrencyMismatchError
 * } catch (err) {
 *   if (err instanceof CurrencyMismatchError) {
 *     // Handle currency conversion
 *   }
 * }
 * ```
 */
export class CurrencyMismatchError extends PiProviderError {
  constructor(currency1: string, currency2: string) {
    super(
      `Cannot operate on different currencies: ${currency1} and ${currency2}`,
      'CURRENCY_MISMATCH'
    );
    this.name = 'CurrencyMismatchError';
  }
}

/**
 * Type guard to check if an error is a PiProviderError
 * 
 * @example
 * ```typescript
 * try {
 *   // ... some operation
 * } catch (err) {
 *   if (isPiProviderError(err)) {
 *     console.log(`Pi error ${err.code}: ${err.message}`);
 *   }
 * }
 * ```
 */
export function isPiProviderError(error: unknown): error is PiProviderError {
  return error instanceof PiProviderError;
}

/**
 * Extract error code from any error (PiProviderError or generic Error)
 * Returns 'UNKNOWN_ERROR' for non-Pi errors
 * 
 * @example
 * ```typescript
 * try {
 *   // ... operation
 * } catch (err) {
 *   const code = getErrorCode(err); // 'MODEL_NOT_FOUND' or 'UNKNOWN_ERROR'
 *   logError(code, err);
 * }
 * ```
 */
export function getErrorCode(error: unknown): string {
  if (isPiProviderError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Format error for logging (includes code, message, and cause chain)
 * 
 * @example
 * ```typescript
 * try {
 *   // ... operation
 * } catch (err) {
 *   console.error(formatErrorForLogging(err));
 * }
 * ```
 */
export function formatErrorForLogging(error: unknown): string {
  if (!isPiProviderError(error)) {
    return error instanceof Error ? error.message : String(error);
  }

  let output = `[${error.code}] ${error.message}`;
  
  if (error.cause) {
    output += `\nCaused by: ${formatErrorForLogging(error.cause)}`;
  }
  
  return output;
}
