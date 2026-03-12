/**
 * Domain Value Objects Tests
 * TDD: Tests written FIRST, before implementation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ConversationId,
  PiModelId,
  Money,
  ThinkingBlock,
  SessionId,
} from '../value-objects';

import {
  InvalidConversationIdError,
  InvalidModelIdError,
  NegativeAmountError,
  CurrencyMismatchError,
} from '../errors';

describe('ConversationId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUuid = 'not-a-uuid';

  describe('construction', () => {
    it('should create from valid UUID string', () => {
      const id = ConversationId.fromString(validUuid);
      assert.strictEqual(id.toString(), validUuid);
    });

    it('should reject invalid UUID', () => {
      assert.throws(
        () => ConversationId.fromString(invalidUuid),
        InvalidConversationIdError
      );
    });

    it('should reject empty string', () => {
      assert.throws(
        () => ConversationId.fromString(''),
        InvalidConversationIdError
      );
    });
  });

  describe('equality', () => {
    it('should be equal to itself', () => {
      const id1 = ConversationId.fromString(validUuid);
      const id2 = ConversationId.fromString(validUuid);
      assert.ok(id1.equals(id2));
    });

    it('should not be equal to different ID', () => {
      const id1 = ConversationId.fromString(validUuid);
      const id2 = ConversationId.fromString('650e8400-e29b-41d4-a716-446655440000');
      assert.ok(!id1.equals(id2));
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = ConversationId.fromString(validUuid);
      assert.strictEqual(id.toString(), validUuid);
      // toString should always return same value
      assert.strictEqual(id.toString(), id.toString());
    });
  });
});

describe('PiModelId', () => {
  describe('parsing simple format', () => {
    it('should parse provider/model format', () => {
      const id = PiModelId.parse('anthropic/claude-3-5-sonnet-latest');
      assert.strictEqual(id.toString(), 'anthropic/claude-3-5-sonnet-latest');
    });

    it('should parse model with dots and dashes', () => {
      const id = PiModelId.parse('google/gemini-2.0-flash');
      assert.strictEqual(id.toString(), 'google/gemini-2.0-flash');
    });
  });

  describe('parsing with thinking', () => {
    it('should parse model with thinking level', () => {
      const id = PiModelId.parse('openai/gpt-4o:high');
      assert.strictEqual(id.toString(), 'openai/gpt-4o:high');
      assert.ok(id.hasThinking());
    });

    it('should parse model without thinking', () => {
      const id = PiModelId.parse('anthropic/claude-3-5-sonnet');
      assert.ok(!id.hasThinking());
    });
  });

  describe('command arguments', () => {
    it('should generate command args without thinking', () => {
      const id = PiModelId.parse('anthropic/claude-3-5-sonnet');
      const args = id.toCommandArgs();
      assert.deepStrictEqual(args, ['--model', 'anthropic/claude-3-5-sonnet']);
    });

    it('should generate command args with thinking', () => {
      const id = PiModelId.parse('openai/gpt-4o:high');
      const args = id.toCommandArgs();
      assert.deepStrictEqual(args, [
        '--model', 'openai/gpt-4o',
        '--thinking', 'high'
      ]);
    });
  });

  describe('invalid formats', () => {
    it('should reject model without provider', () => {
      assert.throws(
        () => PiModelId.parse('claude-3-5-sonnet'),
        InvalidModelIdError
      );
    });

    it('should reject empty string', () => {
      assert.throws(
        () => PiModelId.parse(''),
        InvalidModelIdError
      );
    });

    it('should reject model with only provider', () => {
      assert.throws(
        () => PiModelId.parse('anthropic/'),
        InvalidModelIdError
      );
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = PiModelId.parse('anthropic/claude:high');
      const args1 = id.toCommandArgs();
      const args2 = id.toCommandArgs();
      assert.deepStrictEqual(args1, args2);
      assert.strictEqual(id.toString(), id.toString());
    });
  });
});

describe('Money', () => {
  describe('construction', () => {
    it('should create money from dollars', () => {
      const money = Money.dollars(10.50);
      assert.strictEqual(money.getAmount(), 10.50);
    });

    it('should reject negative amounts', () => {
      assert.throws(
        () => Money.dollars(-5),
        NegativeAmountError
      );
    });

    it('should allow zero amount', () => {
      const money = Money.dollars(0);
      assert.strictEqual(money.getAmount(), 0);
    });
  });

  describe('arithmetic', () => {
    it('should add money with same currency', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(5);
      const sum = m1.add(m2);
      assert.strictEqual(sum.getAmount(), 15);
    });

    it('should subtract money with same currency', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(3);
      const diff = m1.subtract(m2);
      assert.strictEqual(diff.getAmount(), 7);
    });

    it('should allow subtraction resulting in negative', () => {
      const m1 = Money.dollars(5);
      const m2 = Money.dollars(10);
      assert.throws(
        () => m1.subtract(m2),
        NegativeAmountError
      );
    });

    it('should reject addition with different currencies', () => {
      const usd = Money.dollars(10);
      const eur = Money.euros(10);
      assert.throws(
        () => usd.add(eur),
        CurrencyMismatchError
      );
    });

    it('should reject subtraction with different currencies', () => {
      const usd = Money.dollars(10);
      const eur = Money.euros(5);
      assert.throws(
        () => usd.subtract(eur),
        CurrencyMismatchError
      );
    });
  });

  describe('formatting', () => {
    it('should format dollars with 4 decimal places', () => {
      const money = Money.dollars(10.1234);
      assert.strictEqual(money.format(), '$10.1234');
    });

    it('should format small amounts correctly', () => {
      const money = Money.dollars(0.0025);
      assert.strictEqual(money.format(), '$0.0025');
    });
  });

  describe('immutability', () => {
    it('should not mutate original on add', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(5);
      const sum = m1.add(m2);
      
      assert.strictEqual(m1.getAmount(), 10); // original unchanged
      assert.strictEqual(m2.getAmount(), 5);  // original unchanged
      assert.strictEqual(sum.getAmount(), 15); // new value
    });

    it('should not mutate original on subtract', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(3);
      const diff = m1.subtract(m2);
      
      assert.strictEqual(m1.getAmount(), 10); // original unchanged
      assert.strictEqual(diff.getAmount(), 7); // new value
    });
  });
});

describe('ThinkingBlock', () => {
  describe('creation', () => {
    it('should create non-empty thinking block', () => {
      const block = ThinkingBlock.create('Analyzing the problem...', 0);
      assert.strictEqual(block.getContent(), 'Analyzing the problem...');
      assert.strictEqual(block.getIndex(), 0);
      assert.ok(!block.isEmpty());
    });

    it('should create empty thinking block for empty content', () => {
      const block = ThinkingBlock.create('', 0);
      assert.ok(block.isEmpty());
    });

    it('should create empty thinking block for whitespace', () => {
      const block = ThinkingBlock.create('   \n  ', 0);
      assert.ok(block.isEmpty());
    });

    it('should create empty block explicitly', () => {
      const block = ThinkingBlock.empty(0);
      assert.ok(block.isEmpty());
      assert.strictEqual(block.getContent(), '');
    });
  });

  describe('index', () => {
    it('should store correct index', () => {
      const block = ThinkingBlock.create('content', 5);
      assert.strictEqual(block.getIndex(), 5);
    });

    it('should reject negative index', () => {
      assert.throws(
        () => ThinkingBlock.create('content', -1),
        Error
      );
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const block = ThinkingBlock.create('content', 0);
      assert.strictEqual(block.getContent(), 'content');
      assert.strictEqual(block.getContent(), block.getContent());
    });
  });
});

describe('SessionId', () => {
  describe('generation', () => {
    it('should generate valid session ID', () => {
      const id = SessionId.generate();
      assert.ok(id.toString().length > 0);
    });

    it('should generate unique IDs', () => {
      const id1 = SessionId.generate();
      const id2 = SessionId.generate();
      assert.ok(!id1.equals(id2));
    });
  });

  describe('construction', () => {
    it('should create from string', () => {
      const id = SessionId.fromString('test-session-123');
      assert.strictEqual(id.toString(), 'test-session-123');
    });

    it('should reject empty string', () => {
      assert.throws(
        () => SessionId.fromString(''),
        Error
      );
    });

    it('should reject whitespace', () => {
      assert.throws(
        () => SessionId.fromString('   '),
        Error
      );
    });
  });

  describe('equality', () => {
    it('should be equal to itself', () => {
      const id1 = SessionId.fromString('session-1');
      const id2 = SessionId.fromString('session-1');
      assert.ok(id1.equals(id2));
    });

    it('should not be equal to different ID', () => {
      const id1 = SessionId.fromString('session-1');
      const id2 = SessionId.fromString('session-2');
      assert.ok(!id1.equals(id2));
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = SessionId.fromString('session-1');
      assert.strictEqual(id.toString(), 'session-1');
      assert.strictEqual(id.toString(), id.toString());
    });
  });
});

describe('Value object integration', () => {
  it('should work together in domain logic', () => {
    // Create a conversation with pi model
    const convId = ConversationId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const model = PiModelId.parse('anthropic/claude-3-5-sonnet:high');
    const sessionId = SessionId.generate();
    
    // Track costs
    const cost1 = Money.dollars(0.0025);
    const cost2 = Money.dollars(0.0030);
    const totalCost = cost1.add(cost2);
    
    // Create thinking blocks
    const thinking = ThinkingBlock.create('Analyzing request...', 0);
    
    // Verify all work together
    assert.ok(convId.toString().length > 0);
    assert.deepStrictEqual(model.toCommandArgs(), [
      '--model', 'anthropic/claude-3-5-sonnet',
      '--thinking', 'high'
    ]);
    assert.strictEqual(totalCost.format(), '$0.0055');
    assert.ok(!thinking.isEmpty());
  });
});
