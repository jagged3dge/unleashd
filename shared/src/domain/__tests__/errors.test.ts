/**
 * Domain Error Hierarchy Tests
 * TDD: Tests written FIRST, before implementation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// These imports will fail until we implement the errors
import {
  PiProviderError,
  ModelNotFoundError,
  InvalidModelIdError,
  ThinkingNotSupportedError,
  InvalidConversationIdError,
  NegativeAmountError,
  CurrencyMismatchError,
} from '../errors';

describe('PiProviderError (base class)', () => {
  it('should create error with message and code', () => {
    const error = new PiProviderError('Test error', 'TEST_CODE');
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.strictEqual(error.name, 'PiProviderError');
  });

  it('should support error cause chaining', () => {
    const cause = new Error('Original error');
    const error = new PiProviderError('Wrapper error', 'WRAPPER_CODE', cause);
    assert.strictEqual(error.cause, cause);
  });

  it('should be instance of Error', () => {
    const error = new PiProviderError('Test', 'TEST');
    assert.ok(error instanceof Error);
  });

  it('should have stack trace', () => {
    const error = new PiProviderError('Test', 'TEST');
    assert.ok(error.stack);
    assert.ok(error.stack!.includes('PiProviderError'));
  });
});

describe('ModelNotFoundError', () => {
  it('should create error with model ID', () => {
    const error = new ModelNotFoundError('anthropic/claude-unknown');
    assert.strictEqual(error.message, 'Model not found: anthropic/claude-unknown');
    assert.strictEqual(error.code, 'MODEL_NOT_FOUND');
    assert.strictEqual(error.name, 'ModelNotFoundError');
  });

  it('should extend PiProviderError', () => {
    const error = new ModelNotFoundError('test-model');
    assert.ok(error instanceof PiProviderError);
    assert.ok(error instanceof Error);
  });
});

describe('InvalidModelIdError', () => {
  it('should create error with model ID and reason', () => {
    const error = new InvalidModelIdError('invalid', 'Must contain slash');
    assert.strictEqual(
      error.message,
      'Invalid model ID "invalid": Must contain slash'
    );
    assert.strictEqual(error.code, 'INVALID_MODEL_ID');
    assert.strictEqual(error.name, 'InvalidModelIdError');
  });

  it('should extend PiProviderError', () => {
    const error = new InvalidModelIdError('test', 'reason');
    assert.ok(error instanceof PiProviderError);
  });
});

describe('ThinkingNotSupportedError', () => {
  it('should create error with model ID', () => {
    const error = new ThinkingNotSupportedError('anthropic/haiku');
    assert.strictEqual(
      error.message,
      'Model anthropic/haiku does not support thinking mode'
    );
    assert.strictEqual(error.code, 'THINKING_NOT_SUPPORTED');
    assert.strictEqual(error.name, 'ThinkingNotSupportedError');
  });

  it('should extend PiProviderError', () => {
    const error = new ThinkingNotSupportedError('test');
    assert.ok(error instanceof PiProviderError);
  });
});

describe('InvalidConversationIdError', () => {
  it('should create error with conversation ID', () => {
    const error = new InvalidConversationIdError('not-a-uuid');
    assert.strictEqual(
      error.message,
      'Invalid conversation ID: not-a-uuid. Must be a valid UUID.'
    );
    assert.strictEqual(error.code, 'INVALID_CONVERSATION_ID');
    assert.strictEqual(error.name, 'InvalidConversationIdError');
  });

  it('should extend PiProviderError', () => {
    const error = new InvalidConversationIdError('test');
    assert.ok(error instanceof PiProviderError);
  });
});

describe('NegativeAmountError', () => {
  it('should create error with appropriate message', () => {
    const error = new NegativeAmountError();
    assert.strictEqual(error.message, 'Money amount cannot be negative');
    assert.strictEqual(error.code, 'NEGATIVE_AMOUNT');
    assert.strictEqual(error.name, 'NegativeAmountError');
  });

  it('should extend PiProviderError', () => {
    const error = new NegativeAmountError();
    assert.ok(error instanceof PiProviderError);
  });
});

describe('CurrencyMismatchError', () => {
  it('should create error with both currencies', () => {
    const error = new CurrencyMismatchError('USD', 'EUR');
    assert.strictEqual(
      error.message,
      'Cannot operate on different currencies: USD and EUR'
    );
    assert.strictEqual(error.code, 'CURRENCY_MISMATCH');
    assert.strictEqual(error.name, 'CurrencyMismatchError');
  });

  it('should extend PiProviderError', () => {
    const error = new CurrencyMismatchError('USD', 'EUR');
    assert.ok(error instanceof PiProviderError);
  });
});

describe('Error hierarchy integration', () => {
  it('should maintain proper instanceof relationships', () => {
    const errors = [
      new ModelNotFoundError('test'),
      new InvalidModelIdError('test', 'reason'),
      new ThinkingNotSupportedError('test'),
      new InvalidConversationIdError('test'),
      new NegativeAmountError(),
      new CurrencyMismatchError('USD', 'EUR'),
    ];

    errors.forEach(error => {
      assert.ok(error instanceof PiProviderError, 
        `${error.name} should be instanceof PiProviderError`);
      assert.ok(error instanceof Error,
        `${error.name} should be instanceof Error`);
    });
  });

  it('should have unique error codes', () => {
    const errors = [
      new PiProviderError('test', 'BASE'),
      new ModelNotFoundError('test'),
      new InvalidModelIdError('test', 'reason'),
      new ThinkingNotSupportedError('test'),
      new InvalidConversationIdError('test'),
      new NegativeAmountError(),
      new CurrencyMismatchError('USD', 'EUR'),
    ];

    const codes = errors.map(e => (e as any).code);
    const uniqueCodes = new Set(codes);
    
    assert.strictEqual(codes.length, uniqueCodes.size,
      'All error codes should be unique');
  });

  it('should all have stack traces', () => {
    const errors = [
      new ModelNotFoundError('test'),
      new InvalidModelIdError('test', 'reason'),
      new ThinkingNotSupportedError('test'),
    ];

    errors.forEach(error => {
      assert.ok(error.stack, `${error.name} should have stack trace`);
    });
  });
});

describe('Error serialization', () => {
  it('should be JSON serializable', () => {
    const error = new ModelNotFoundError('test-model');
    const serialized = JSON.stringify({
      name: error.name,
      message: error.message,
      code: (error as any).code,
    });
    
    const parsed = JSON.parse(serialized);
    assert.strictEqual(parsed.name, 'ModelNotFoundError');
    assert.strictEqual(parsed.message, 'Model not found: test-model');
    assert.strictEqual(parsed.code, 'MODEL_NOT_FOUND');
  });

  it('should preserve cause in serialization', () => {
    const cause = new Error('Root cause');
    const error = new PiProviderError('Wrapper', 'WRAPPER', cause);
    
    // Cause is preserved in the object
    assert.strictEqual(error.cause, cause);
  });
});
