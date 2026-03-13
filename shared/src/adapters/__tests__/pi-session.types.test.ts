import { describe, it, expect } from 'vitest';
import {
  PiUserMessageSchema,
  PiAssistantMessageSchema,
  PiToolResultMessageSchema,
  PiThinkingBlockSchema,
  PiUsageStatsSchema,
  PiCostInfoSchema,
  PiSessionEntrySchema,
  isPiUserMessage,
  isPiAssistantMessage,
  isPiToolResult,
} from '../pi-session.types';

describe('Pi Session Types', () => {
  describe('RED: PiUserMessage validation', () => {
    it('should validate simple user message', () => {
      const msg = {
        role: 'user',
        content: 'Hello',
        timestamp: 1733234567890,
      };
      const result = PiUserMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should validate user message with array content', () => {
      const msg = {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
        timestamp: 1733234567890,
      };
      const result = PiUserMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const msg = {
        role: 'invalid',
        content: 'Hello',
        timestamp: 1733234567890,
      };
      const result = PiUserMessageSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });

    it('should require timestamp', () => {
      const msg = {
        role: 'user',
        content: 'Hello',
      };
      const result = PiUserMessageSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });
  });

  describe('RED: PiAssistantMessage validation', () => {
    it('should validate simple assistant message', () => {
      const msg = {
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi!' }],
        api: 'messages',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        timestamp: 1733234567891,
      };
      const result = PiAssistantMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should validate assistant message with thinking', () => {
      const msg = {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'Let me think...' },
          { type: 'text', text: 'Answer' },
        ],
        api: 'messages',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        timestamp: 1733234567891,
      };
      const result = PiAssistantMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should validate assistant message with usage', () => {
      const msg = {
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi!' }],
        api: 'messages',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          input: 10,
          output: 8,
          cost: {
            input: 0.00003,
            output: 0.000024,
            total: 0.000054,
          },
        },
        timestamp: 1733234567891,
      };
      const result = PiAssistantMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should require content array', () => {
      const msg = {
        role: 'assistant',
        content: 'string not allowed',
        api: 'messages',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        timestamp: 1733234567891,
      };
      const result = PiAssistantMessageSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });
  });

  describe('RED: PiToolResult validation', () => {
    it('should validate tool result', () => {
      const msg = {
        role: 'toolResult',
        toolUseId: 'toolu_123',
        toolName: 'read',
        content: [{ type: 'text', text: 'file contents' }],
        isError: false,
        timestamp: 1733234567892,
      };
      const result = PiToolResultMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should validate error tool result', () => {
      const msg = {
        role: 'toolResult',
        toolUseId: 'toolu_123',
        toolName: 'bash',
        content: [{ type: 'text', text: 'Error: command failed' }],
        isError: true,
        timestamp: 1733234567892,
      };
      const result = PiToolResultMessageSchema.safeParse(msg);
      expect(result.success).toBe(true);
    });

    it('should require toolUseId', () => {
      const msg = {
        role: 'toolResult',
        toolName: 'read',
        content: [{ type: 'text', text: 'contents' }],
        isError: false,
        timestamp: 1733234567892,
      };
      const result = PiToolResultMessageSchema.safeParse(msg);
      expect(result.success).toBe(false);
    });
  });

  describe('RED: PiThinkingBlock validation', () => {
    it('should validate thinking block', () => {
      const block = {
        type: 'thinking',
        thinking: 'Let me analyze this...',
      };
      const result = PiThinkingBlockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should reject non-thinking type', () => {
      const block = {
        type: 'text',
        thinking: 'text',
      };
      const result = PiThinkingBlockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });
  });

  describe('RED: PiUsageStats validation', () => {
    it('should validate basic usage', () => {
      const usage = {
        input: 100,
        output: 50,
      };
      const result = PiUsageStatsSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('should validate usage with cache', () => {
      const usage = {
        input: 100,
        output: 50,
        cacheRead: 200,
        cacheWrite: 50,
      };
      const result = PiUsageStatsSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('should validate usage with cost', () => {
      const usage = {
        input: 100,
        output: 50,
        cost: {
          input: 0.0003,
          output: 0.00075,
          total: 0.00105,
        },
      };
      const result = PiUsageStatsSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });
  });

  describe('RED: PiCostInfo validation', () => {
    it('should validate cost info', () => {
      const cost = {
        input: 0.0003,
        output: 0.00075,
        total: 0.00105,
      };
      const result = PiCostInfoSchema.safeParse(cost);
      expect(result.success).toBe(true);
    });

    it('should validate cost with cache', () => {
      const cost = {
        input: 0.0003,
        output: 0.00075,
        cacheRead: 0.00015,
        cacheWrite: 0.000375,
        total: 0.00165,
      };
      const result = PiCostInfoSchema.safeParse(cost);
      expect(result.success).toBe(true);
    });

    it('should require total', () => {
      const cost = {
        input: 0.0003,
        output: 0.00075,
      };
      const result = PiCostInfoSchema.safeParse(cost);
      expect(result.success).toBe(false);
    });
  });

  describe('RED: PiSessionEntry union', () => {
    it('should parse user message', () => {
      const entry = {
        role: 'user',
        content: 'Hello',
        timestamp: 1733234567890,
      };
      const result = PiSessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should parse assistant message', () => {
      const entry = {
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        api: 'messages',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        timestamp: 1733234567891,
      };
      const result = PiSessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should parse tool result', () => {
      const entry = {
        role: 'toolResult',
        toolUseId: 'toolu_123',
        toolName: 'read',
        content: [{ type: 'text', text: 'contents' }],
        isError: false,
        timestamp: 1733234567892,
      };
      const result = PiSessionEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  describe('RED: Type guards', () => {
    it('should identify user message', () => {
      const msg = {
        role: 'user',
        content: 'Hello',
        timestamp: 1733234567890,
      };
      expect(isPiUserMessage(msg)).toBe(true);
    });

    it('should identify assistant message', () => {
      const msg = {
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi' }],
        api: 'messages',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        timestamp: 1733234567891,
      };
      expect(isPiAssistantMessage(msg)).toBe(true);
    });

    it('should identify tool result', () => {
      const msg = {
        role: 'toolResult',
        toolUseId: 'toolu_123',
        toolName: 'read',
        content: [{ type: 'text', text: 'contents' }],
        isError: false,
        timestamp: 1733234567892,
      };
      expect(isPiToolResult(msg)).toBe(true);
    });

    it('should reject invalid objects', () => {
      const invalid = { random: 'data' };
      expect(isPiUserMessage(invalid)).toBe(false);
      expect(isPiAssistantMessage(invalid)).toBe(false);
      expect(isPiToolResult(invalid)).toBe(false);
    });
  });
});
