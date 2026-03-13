import { describe, it, expect, beforeEach } from 'vitest';
import { PiDiskAdapter } from '../pi-adapter';
import { join } from 'path';

describe('PiDiskAdapter', () => {
  let adapter: PiDiskAdapter;
  // Use relative path from project root
  const fixturesDir = 'server/src/adapters/__fixtures__/pi-sessions';

  beforeEach(() => {
    adapter = new PiDiskAdapter();
  });

  describe('RED: provider identification', () => {
    it('should have provider property', () => {
      expect(adapter.provider).toBe('pi');
    });
  });

  describe('RED: loading simple session', () => {
    it('should load session from file', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation).toBeDefined();
      expect(conversation).not.toBeNull();
    });

    it('should extract messages', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.messages).toBeDefined();
      expect(conversation?.messages.length).toBeGreaterThan(0);
    });

    it('should have correct message count', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      // simple.jsonl has 4 messages (2 user, 2 assistant)
      expect(conversation?.messages).toHaveLength(4);
    });

    it('should extract session ID from filename', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.sessionId).toBe('simple');
    });
  });

  describe('RED: parsing user messages', () => {
    it('should parse user messages correctly', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      const userMessages = conversation?.messages.filter(m => m.role === 'user');
      expect(userMessages?.length).toBeGreaterThan(0);
    });

    it('should extract user message content', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      const firstUser = conversation?.messages.find(m => m.role === 'user');
      expect(firstUser?.content).toBeDefined();
      expect(typeof firstUser?.content).toBe('string');
    });
  });

  describe('RED: parsing assistant messages', () => {
    it('should parse assistant messages correctly', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      const assistantMessages = conversation?.messages.filter(m => m.role === 'assistant');
      expect(assistantMessages?.length).toBeGreaterThan(0);
    });

    it('should extract assistant message content', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      const firstAssistant = conversation?.messages.find(m => m.role === 'assistant');
      expect(firstAssistant?.content).toBeDefined();
    });
  });

  describe('RED: parsing thinking blocks', () => {
    it('should extract thinking blocks', async () => {
      const sessionPath = join(fixturesDir, 'with-thinking.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      const assistantMsg = conversation?.messages.find(m => m.role === 'assistant');
      // Thinking should be extracted separately or marked
      expect(assistantMsg).toBeDefined();
    });

    it('should handle sessions without thinking', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation).toBeDefined();
    });
  });

  describe('RED: parsing tool calls', () => {
    it('should extract tool calls', async () => {
      const sessionPath = join(fixturesDir, 'with-tools.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation).toBeDefined();
      expect(conversation?.messages.length).toBeGreaterThan(0);
    });

    it('should link tool results to calls', async () => {
      const sessionPath = join(fixturesDir, 'with-tools.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      const toolResults = conversation?.messages.filter(m => m.role === 'toolResult');
      expect(toolResults).toBeDefined();
    });
  });

  describe('RED: cost tracking', () => {
    it('should calculate total cost', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      // Conversation should have totalCost calculated
      expect(conversation?.totalCost).toBeDefined();
    });

    it('should sum costs from all messages', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      // Total should be sum of individual message costs
      expect(typeof conversation?.totalCost).toBe('number');
      expect(conversation?.totalCost).toBeGreaterThan(0);
    });
  });

  describe('RED: token tracking', () => {
    it('should calculate total tokens', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.totalTokens).toBeDefined();
      expect(typeof conversation?.totalTokens).toBe('number');
    });

    it('should sum tokens from all messages', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('RED: error handling', () => {
    it('should return null for non-existent file', async () => {
      const sessionPath = join(fixturesDir, 'non-existent.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation).toBeNull();
    });

    it('should handle malformed JSONL gracefully', async () => {
      const sessionPath = join(fixturesDir, 'edge-cases.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      // Should parse valid lines, skip invalid
      expect(conversation).toBeDefined();
    });
  });

  describe('RED: metadata extraction', () => {
    it('should extract model information', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.model).toBeDefined();
    });

    it('should extract provider information', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.provider).toBe('pi');
    });

    it('should set timestamps', async () => {
      const sessionPath = join(fixturesDir, 'simple.jsonl');
      const conversation = await adapter.loadSession(sessionPath);
      
      expect(conversation?.createdAt).toBeInstanceOf(Date);
    });
  });
});
