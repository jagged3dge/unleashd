/**
 * Domain Value Objects Tests
 * TDD: Tests written FIRST, before implementation
 */

import { describe, it, expect } from 'vitest';


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
      expect(id.toString()).toBe(validUuid);
    });

    it('should reject invalid UUID', () => {
      expect(() => {
        () => ConversationId.fromString(invalidUuid),
        InvalidConversationIdError
      );
    });

    it('should reject empty string', () => {
      expect(() => {
        () => ConversationId.fromString(''),
        InvalidConversationIdError
      );
    });
  });

  describe('equality', () => {
    it('should be equal to itself', () => {
      const id1 = ConversationId.fromString(validUuid);
      const id2 = ConversationId.fromString(validUuid);
      expect(id1.equals(id2));
    });

    it('should not be equal to different ID', () => {
      const id1 = ConversationId.fromString(validUuid);
      const id2 = ConversationId.fromString('650e8400-e29b-41d4-a716-446655440000');
      expect(!id1.equals(id2));
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = ConversationId.fromString(validUuid);
      expect(id.toString()).toBe(validUuid);
      // toString should always return same value
      assert.strictEqual(id.toString(), id.toString());
    });
  });
});

describe('PiModelId', () => {
  describe('parsing simple format', () => {
    it('should parse provider/model format', () => {
      const id = PiModelId.parse('anthropic/claude-3-5-sonnet-latest');
      expect(id.toString()).toBe('anthropic/claude-3-5-sonnet-latest');
    });

    it('should parse model with dots and dashes', () => {
      const id = PiModelId.parse('google/gemini-2.0-flash');
      expect(id.toString()).toBe('google/gemini-2.0-flash');
    });
  });

  describe('parsing with thinking', () => {
    it('should parse model with thinking level', () => {
      const id = PiModelId.parse('openai/gpt-4o:high');
      expect(id.toString()).toBe('openai/gpt-4o:high');
      expect(id.hasThinking());
    });

    it('should parse model without thinking', () => {
      const id = PiModelId.parse('anthropic/claude-3-5-sonnet');
      expect(!id.hasThinking());
    });
  });

  describe('command arguments', () => {
    it('should generate command args without thinking', () => {
      const id = PiModelId.parse('anthropic/claude-3-5-sonnet');
      const args = id.toCommandArgs();
      expect(args).toEqual(['--model', 'anthropic/claude-3-5-sonnet']);
    });

    it('should generate command args with thinking', () => {
      const id = PiModelId.parse('openai/gpt-4o:high');
      const args = id.toCommandArgs();
      expect(args, [
        '--model', 'openai/gpt-4o',
        '--thinking', 'high'
      ]);
    });
  });

  describe('invalid formats', () => {
    it('should reject model without provider', () => {
      expect(() => {
        () => PiModelId.parse('claude-3-5-sonnet'),
        InvalidModelIdError
      );
    });

    it('should reject empty string', () => {
      expect(() => {
        () => PiModelId.parse(''),
        InvalidModelIdError
      );
    });

    it('should reject model with only provider', () => {
      expect(() => {
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
      expect(args1).toEqual(args2);
      assert.strictEqual(id.toString(), id.toString());
    });
  });
});

describe('Money', () => {
  describe('construction', () => {
    it('should create money from dollars', () => {
      const money = Money.dollars(10.50);
      expect(money.getAmount()).toBe(10.50);
    });

    it('should reject negative amounts', () => {
      expect(() => {
        () => Money.dollars(-5),
        NegativeAmountError
      );
    });

    it('should allow zero amount', () => {
      const money = Money.dollars(0);
      expect(money.getAmount()).toBe(0);
    });
  });

  describe('arithmetic', () => {
    it('should add money with same currency', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(5);
      const sum = m1.add(m2);
      expect(sum.getAmount()).toBe(15);
    });

    it('should subtract money with same currency', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(3);
      const diff = m1.subtract(m2);
      expect(diff.getAmount()).toBe(7);
    });

    it('should allow subtraction resulting in negative', () => {
      const m1 = Money.dollars(5);
      const m2 = Money.dollars(10);
      expect(() => {
        () => m1.subtract(m2),
        NegativeAmountError
      );
    });

    it('should reject addition with different currencies', () => {
      const usd = Money.dollars(10);
      const eur = Money.euros(10);
      expect(() => {
        () => usd.add(eur),
        CurrencyMismatchError
      );
    });

    it('should reject subtraction with different currencies', () => {
      const usd = Money.dollars(10);
      const eur = Money.euros(5);
      expect(() => {
        () => usd.subtract(eur),
        CurrencyMismatchError
      );
    });
  });

  describe('formatting', () => {
    it('should format dollars with 4 decimal places', () => {
      const money = Money.dollars(10.1234);
      expect(money.format()).toBe('$10.1234');
    });

    it('should format small amounts correctly', () => {
      const money = Money.dollars(0.0025);
      expect(money.format()).toBe('$0.0025');
    });
  });

  describe('immutability', () => {
    it('should not mutate original on add', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(5);
      const sum = m1.add(m2);
      
      expect(m1.getAmount()).toBe(10); // original unchanged
      expect(m2.getAmount()).toBe(5);  // original unchanged
      expect(sum.getAmount()).toBe(15); // new value
    });

    it('should not mutate original on subtract', () => {
      const m1 = Money.dollars(10);
      const m2 = Money.dollars(3);
      const diff = m1.subtract(m2);
      
      expect(m1.getAmount()).toBe(10); // original unchanged
      expect(diff.getAmount()).toBe(7); // new value
    });
  });
});

describe('ThinkingBlock', () => {
  describe('creation', () => {
    it('should create non-empty thinking block', () => {
      const block = ThinkingBlock.create('Analyzing the problem...', 0);
      expect(block.getContent()).toBe('Analyzing the problem...');
      expect(block.getIndex()).toBe(0);
      expect(!block.isEmpty());
    });

    it('should create empty thinking block for empty content', () => {
      const block = ThinkingBlock.create('', 0);
      expect(block.isEmpty());
    });

    it('should create empty thinking block for whitespace', () => {
      const block = ThinkingBlock.create('   \n  ', 0);
      expect(block.isEmpty());
    });

    it('should create empty block explicitly', () => {
      const block = ThinkingBlock.empty(0);
      expect(block.isEmpty());
      expect(block.getContent()).toBe('');
    });
  });

  describe('index', () => {
    it('should store correct index', () => {
      const block = ThinkingBlock.create('content', 5);
      expect(block.getIndex()).toBe(5);
    });

    it('should reject negative index', () => {
      expect(() => {
        () => ThinkingBlock.create('content', -1),
        Error
      );
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const block = ThinkingBlock.create('content', 0);
      expect(block.getContent()).toBe('content');
      assert.strictEqual(block.getContent(), block.getContent());
    });
  });
});

describe('SessionId', () => {
  describe('generation', () => {
    it('should generate valid session ID', () => {
      const id = SessionId.generate();
      expect(id.toString().length > 0);
    });

    it('should generate unique IDs', () => {
      const id1 = SessionId.generate();
      const id2 = SessionId.generate();
      expect(!id1.equals(id2));
    });
  });

  describe('construction', () => {
    it('should create from string', () => {
      const id = SessionId.fromString('test-session-123');
      expect(id.toString()).toBe('test-session-123');
    });

    it('should reject empty string', () => {
      expect(() => {
        () => SessionId.fromString(''),
        Error
      );
    });

    it('should reject whitespace', () => {
      expect(() => {
        () => SessionId.fromString('   '),
        Error
      );
    });
  });

  describe('equality', () => {
    it('should be equal to itself', () => {
      const id1 = SessionId.fromString('session-1');
      const id2 = SessionId.fromString('session-1');
      expect(id1.equals(id2));
    });

    it('should not be equal to different ID', () => {
      const id1 = SessionId.fromString('session-1');
      const id2 = SessionId.fromString('session-2');
      expect(!id1.equals(id2));
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = SessionId.fromString('session-1');
      expect(id.toString()).toBe('session-1');
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
    expect(convId.toString().length > 0);
    expect(model.toCommandArgs(), [
      '--model', 'anthropic/claude-3-5-sonnet',
      '--thinking', 'high'
    ]);
    expect(totalCost.format()).toBe('$0.0055');
    expect(!thinking.isEmpty());
  });
});
